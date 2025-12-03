package main

import (
	"context"
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"database/sql"
	"encoding/json"
	"encoding/pem"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/joho/godotenv"
	"github.com/lestrrat-go/jwx/v3/jwa"
	"github.com/lestrrat-go/jwx/v3/jwt"
	"github.com/matthewhartstonge/argon2"
	"github.com/uptrace/bun"
	"github.com/uptrace/bun/dialect/pgdialect"
)

var Db *bun.DB
var ctx context.Context
var privateKey *rsa.PrivateKey

type users struct {
	ID       int64  `bun:",pk,autoincrement"`
	Username string `bun:",unique,notnull"`
	Hash     string `bun:",notnull"`
}

var (
	fetchUserHash    = defaultFetchUserHash
	insertUserRecord = defaultInsertUserRecord
	signToken        = defaultSignToken
)

func defaultFetchUserHash(ctx context.Context, username string) (string, error) {
	var hash string
	err := Db.NewSelect().
		Table("users").
		Column("hash").
		Where("username = ?", username).
		Limit(1).
		Scan(ctx, &hash)
	return hash, err
}

func defaultInsertUserRecord(ctx context.Context, user *users) error {
	_, err := Db.NewInsert().Model(user).Exec(ctx)
	return err
}

func defaultSignToken(tok jwt.Token) ([]byte, error) {
	return jwt.Sign(tok, jwt.WithKey(jwa.RS256(), privateKey))
}

func loginHandler(w http.ResponseWriter, r *http.Request) {
	// Only allow POST requests
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	username := r.FormValue("username")
	password := r.FormValue("password")

	hash, err := fetchUserHash(ctx, username)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	ok, err := argon2.VerifyEncoded([]byte(password), []byte(hash))
	if err != nil || !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	tok, err := jwt.NewBuilder().
		IssuedAt(time.Now()).
		Expiration(time.Now().Add(24 * time.Hour)).
		Subject(username).
		Build()
	if err != nil {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	// Sign a JWT!
	signed, err := signToken(tok)
	if err != nil {
		fmt.Printf("failed to sign token: %s\n", err)
		return
	}

	response := struct {
		Username string
		Token    string
	}{
		Username: username,
		Token:    string(signed),
	}

	jsonData, err := json.Marshal(response)
	if err != nil {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	w.Write(jsonData)
}

func servePublicKey(w http.ResponseWriter, r *http.Request) {
	pubKeyBytes, err := x509.MarshalPKIXPublicKey(&privateKey.PublicKey)
	if err != nil {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	pemBytes := pem.EncodeToMemory(&pem.Block{
		Type:  "PUBLIC KEY",
		Bytes: pubKeyBytes,
	})
	w.Header().Set("Content-Type", "text/plain")
	w.Write(pemBytes)
}

func verifyToken(w http.ResponseWriter, r *http.Request) {
	// Only allow POST requests
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	tokenString := r.Header.Get("Authorization")
	if tokenString == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	tokenString = tokenString[len("Bearer "):]

	verifiedToken, err := jwt.Parse([]byte(tokenString), jwt.WithKey(jwa.RS256(), &privateKey.PublicKey))
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	subject, ok := verifiedToken.Subject()
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	response := struct {
		Valid   bool
		Subject string
	}{
		Valid:   true,
		Subject: subject,
	}

	jsonData, err := json.Marshal(response)
	if err != nil {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	w.Write(jsonData)
}

func registerUser(username, password string) error {
	argon := argon2.DefaultConfig()

	encoded, err := argon.HashEncoded([]byte(password))
	if err != nil {
		return err
	}

	user := &users{
		Username: username,
		Hash:     string(encoded),
	}
	return insertUserRecord(ctx, user)
}

func main() {
	log.Println("Starting auth server")
	ctx = context.Background()
	var err error
	err = godotenv.Load()
	if err != nil {
		panic(err)
	}

	privateKey, err = rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		panic(err)
	}

	postgresPassword := os.Getenv("POSTGRES_PASSWORD")
	if postgresPassword == "" {
		panic("POSTGRES_PASSWORD not set in environment")
	}
	// Connect to Postgres
	sqldb, err := sql.Open("pgx", "postgres://postgres:"+postgresPassword+"@127.0.0.1:5432/postgres?sslmode=disable")
	if err != nil {
		panic(err)
	}

	if err := sqldb.PingContext(ctx); err != nil {
		panic(err)
	}

	// Create Bun ( not the javascript runtime dummy ) instance
	Db = bun.NewDB(sqldb, pgdialect.New())
	defer Db.Close()

	Db.NewCreateTable().Model((*users)(nil)).Exec(ctx)

	http.HandleFunc("/", loginHandler)
	http.HandleFunc("/verify", verifyToken)
	http.HandleFunc("/publickey", servePublicKey)
	http.ListenAndServe("127.0.0.1:8080", nil)
}
