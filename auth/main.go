package main

import (
	"context"
	"crypto/rand"
	"crypto/rsa"
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/lestrrat-go/jwx/v3/jwa"
	"github.com/lestrrat-go/jwx/v3/jwt"
	"github.com/matthewhartstonge/argon2"
	"github.com/uptrace/bun"
	"github.com/uptrace/bun/dialect/pgdialect"
)

var Db *bun.DB
var ctx context.Context

type users struct {
	ID       int64  `bun:",pk,autoincrement"`
	Username string `bun:",unique,notnull"`
	Hash     string `bun:",notnull"`
}

func loginHandler(w http.ResponseWriter, r *http.Request) {
	// Only allow POST requests
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	username := r.FormValue("username")
	password := r.FormValue("password")

	var hash string
	selectQuery := Db.NewSelect().Table("users").Column("username", "hash").Where("username = ?", username).Limit(1).Scan(ctx, &username, &hash)
	if selectQuery != nil {
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

	privateKey, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		fmt.Println("Error generating RSA private key:", err)
		os.Exit(1)
	}

	// Sign a JWT!
	signed, err := jwt.Sign(tok, jwt.WithKey(jwa.RS256(), privateKey))
	if err != nil {
		fmt.Printf("failed to sign token: %s\n", err)
		return
	}

	log.Println(string(signed))
	w.Write([]byte("Authentication request received"))
}

func registerUser(username, password string) error {
	argon := argon2.DefaultConfig()

	encoded, err := argon.HashEncoded([]byte(password))
	if err != nil {
		panic(err)
	}

	user := &users{
		Username: username,
		Hash:     string(encoded),
	}
	_, err = Db.NewInsert().Model(user).Exec(ctx)
	return err
}

func main() {
	log.Println("Starting auth server")
	ctx = context.Background()

	// Connect to Postgres
	sqldb, err := sql.Open("pgx", "postgres://postgres:0VnbUoLVhKRy0hJ1KoTPr4JfiBzNZo44yi51+GkVE9YgK+hmG63mYFW4C6hnU3WI@localhost:5432/postgres?sslmode=disable")
	if err != nil {
		panic(err)
	}
	if err := sqldb.PingContext(ctx); err != nil {
		log.Fatalf("unable to connect to Postgres: %v", err)
	}

	// Create Bun ( not the javascript runtime dummy ) instance
	Db = bun.NewDB(sqldb, pgdialect.New())
	defer Db.Close()

	Db.NewCreateTable().Model((*users)(nil)).Exec(ctx)

	http.HandleFunc("/", loginHandler)
	http.ListenAndServe("127.0.0.1:8080", nil)
}
