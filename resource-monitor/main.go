package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"log"
	"os"
	"time"

	"net/http"

	linuxproc "github.com/c9s/goprocinfo/linux"
	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/joho/godotenv"
	"github.com/uptrace/bun"
	"github.com/uptrace/bun/dialect/pgdialect"
)

var Db *bun.DB
var ctx context.Context

type cpu_usage struct {
	ID        int64     `bun:",pk,autoincrement"`
	Usage     float32   `bun:",notnull"`
	Timestamp time.Time `bun:",notnull,default:current_timestamp"`
}

type ram_usage struct {
	ID              int64     `bun:",pk,autoincrement"`
	UsagePercentage float32   `bun:",notnull"`
	TotalMemory     int32     `bun:",notnull"`
	UsedMemory      int32     `bun:",notnull"`
	FreeMemory      int32     `bun:",notnull"`
	Timestamp       time.Time `bun:",notnull,default:current_timestamp"`
}

func main() {
	log.Println("Resource Monitor is starting...")
	ctx = context.Background()
	var err error
	err = godotenv.Load()
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

	// Create Bun ( again.. not the javascript runtime, dummy ) instance
	Db = bun.NewDB(sqldb, pgdialect.New())
	defer Db.Close()

	Db.NewCreateTable().Model((*cpu_usage)(nil)).Exec(ctx)
	Db.NewCreateTable().Model((*ram_usage)(nil)).Exec(ctx)

	http.HandleFunc("/getRecentData", func(w http.ResponseWriter, r *http.Request) {
		var ramUsage []ram_usage
		var cpuUsage []cpu_usage

		Db.NewSelect().Model(&cpuUsage).Order("timestamp DESC").Limit(50).Scan(ctx)
		Db.NewSelect().Model(&ramUsage).Order("timestamp DESC").Limit(50).Scan(ctx)

		response := struct {
			CPU []cpu_usage `json:"cpu"`
			RAM []ram_usage `json:"ram"`
		}{
			CPU: cpuUsage,
			RAM: ramUsage,
		}

		responseJson, err := json.Marshal(response)
		if err != nil {
			http.Error(w, "Failed to marshal response", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusOK)
		w.Write([]byte(responseJson))
	})
	go http.ListenAndServe("127.0.0.1:55556", nil)

	for {
		time.Sleep(5 * time.Second)
		ram, err := linuxproc.ReadMemInfo("/proc/meminfo")
		if err != nil {
			log.Fatal("stat read fail")
		}

		TotalMemory := ram.MemTotal / 1024
		FreeMemory := ram.MemAvailable / 1024
		UsedMemory := TotalMemory - FreeMemory

		usedProcentage := (float64(UsedMemory) / float64(TotalMemory)) * 100

		ramUsage := &ram_usage{
			UsagePercentage: float32(usedProcentage),
			TotalMemory:     int32(TotalMemory),
			UsedMemory:      int32(UsedMemory),
			FreeMemory:      int32(FreeMemory),
		}
		_, err = Db.NewInsert().Model(ramUsage).Exec(ctx)

		cpu, err := linuxproc.ReadStat("/proc/stat")
		if err != nil {
			log.Fatal("stat read fail")
		}

		CpuStats1 := cpu.CPUStatAll

		time.Sleep(100 * time.Millisecond)

		cpu, err = linuxproc.ReadStat("/proc/stat")
		if err != nil {
			log.Fatal("stat read fail")
		}

		CpuStats2 := cpu.CPUStatAll

		CpuUser1 := CpuStats2.User - CpuStats1.User
		CpuNice1 := CpuStats2.Nice - CpuStats1.Nice
		CpuSystem1 := CpuStats2.System - CpuStats1.System
		CpuIdle1 := CpuStats2.Idle - CpuStats1.Idle
		CpuIowait1 := CpuStats2.IOWait - CpuStats1.IOWait
		CpuIrq1 := CpuStats2.IRQ - CpuStats1.IRQ
		CpuSoftirq1 := CpuStats2.SoftIRQ - CpuStats1.SoftIRQ
		CpuSteal1 := CpuStats2.Steal - CpuStats1.Steal

		TotalCpu := CpuUser1 + CpuNice1 + CpuSystem1 + CpuIdle1 + CpuIowait1 + CpuIrq1 + CpuSoftirq1 + CpuSteal1

		UsagePercentage := (float64(TotalCpu-CpuIdle1) / float64(TotalCpu)) * 100

		cpuUsage := &cpu_usage{
			Usage: float32(UsagePercentage),
		}
		_, err = Db.NewInsert().Model(cpuUsage).Exec(ctx)

	}
}
