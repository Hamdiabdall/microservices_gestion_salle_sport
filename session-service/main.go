package main

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"net"
	"os"
	"time"

	"github.com/golang/protobuf/ptypes/timestamp"
	_ "github.com/lib/pq"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/reflection"
	"google.golang.org/grpc/status"

	// Use an absolute import path that matches the Docker build context
	pb "session-service/proto"
)

type server struct {
	db *sql.DB
	pb.UnimplementedSessionServiceServer
}

// Create tables if they don't exist
func initDatabase(db *sql.DB) error {
	// Create sessions table
	_, err := db.Exec(`
	CREATE TABLE IF NOT EXISTS sessions (
		id SERIAL PRIMARY KEY,
		title VARCHAR(255) NOT NULL,
		description TEXT,
		coach_id VARCHAR(100) NOT NULL,
		coach_name VARCHAR(255) NOT NULL,
		capacity INT NOT NULL,
		reserved_spots INT DEFAULT 0,
		start_time TIMESTAMP NOT NULL,
		end_time TIMESTAMP NOT NULL,
		location VARCHAR(255) NOT NULL,
		session_type VARCHAR(100) NOT NULL,
		difficulty_level VARCHAR(50) NOT NULL,
		is_cancelled BOOLEAN DEFAULT FALSE,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	)
	`)
	if err != nil {
		return err
	}

	// Create reservations table
	_, err = db.Exec(`
	CREATE TABLE IF NOT EXISTS reservations (
		id SERIAL PRIMARY KEY,
		session_id INT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
		user_id VARCHAR(100) NOT NULL,
		user_name VARCHAR(255) NOT NULL,
		reservation_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		status VARCHAR(50) DEFAULT 'confirmed',
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		UNIQUE(session_id, user_id)
	)
	`)
	return err
}

// Convert SQL timestamp to string format
func formatTimestamp(t time.Time) string {
	return t.Format(time.RFC3339)
}

// Implementation of CreateSession RPC
func (s *server) CreateSession(ctx context.Context, req *pb.CreateSessionRequest) (*pb.Session, error) {
	var id int
	var createdAt, updatedAt time.Time

	// Validate request
	if req.Title == "" || req.CoachId == "" || req.Capacity < 1 || req.StartTime == "" || req.EndTime == "" || req.Location == "" || req.SessionType == "" || req.DifficultyLevel == "" {
		return nil, status.Error(codes.InvalidArgument, "Missing required fields")
	}

	// Insert new session into database
	err := s.db.QueryRowContext(
		ctx,
		`INSERT INTO sessions 
		(title, description, coach_id, coach_name, capacity, start_time, end_time, location, session_type, difficulty_level) 
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
		RETURNING id, created_at, updated_at`,
		req.Title, req.Description, req.CoachId, "Coach Name", req.Capacity, req.StartTime, req.EndTime, req.Location, req.SessionType, req.DifficultyLevel,
	).Scan(&id, &createdAt, &updatedAt)

	if err != nil {
		return nil, status.Errorf(codes.Internal, "Failed to create session: %v", err)
	}

	// Construct response
	return &pb.Session{
		Id:             fmt.Sprint(id),
		Title:          req.Title,
		Description:    req.Description,
		CoachId:        req.CoachId,
		CoachName:      "Coach Name", // In a real app, would fetch this from the User service
		Capacity:       req.Capacity,
		ReservedSpots:  0,
		StartTime:      req.StartTime,
		EndTime:        req.EndTime,
		Location:       req.Location,
		SessionType:    req.SessionType,
		DifficultyLevel: req.DifficultyLevel,
		IsCancelled:    false,
		CreatedAt:      formatTimestamp(createdAt),
		UpdatedAt:      formatTimestamp(updatedAt),
	}, nil
}

// Implementation of GetSession RPC
func (s *server) GetSession(ctx context.Context, req *pb.GetSessionRequest) (*pb.Session, error) {
	var session pb.Session
	var startTime, endTime, createdAt, updatedAt time.Time

	// Query the database for the session
	err := s.db.QueryRowContext(
		ctx,
		`SELECT id, title, description, coach_id, coach_name, capacity, reserved_spots, 
		start_time, end_time, location, session_type, difficulty_level, is_cancelled, created_at, updated_at 
		FROM sessions WHERE id = $1`,
		req.SessionId,
	).Scan(
		&session.Id, &session.Title, &session.Description, &session.CoachId, &session.CoachName,
		&session.Capacity, &session.ReservedSpots, &startTime, &endTime, &session.Location,
		&session.SessionType, &session.DifficultyLevel, &session.IsCancelled, &createdAt, &updatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, status.Errorf(codes.NotFound, "Session not found: %v", req.SessionId)
		}
		return nil, status.Errorf(codes.Internal, "Failed to get session: %v", err)
	}

	// Format the timestamps
	session.StartTime = formatTimestamp(startTime)
	session.EndTime = formatTimestamp(endTime)
	session.CreatedAt = formatTimestamp(createdAt)
	session.UpdatedAt = formatTimestamp(updatedAt)

	return &session, nil
}

// Main function
func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "50051"
	}

	// Get database URL from environment
	dbURL := os.Getenv("POSTGRES_URI")
	if dbURL == "" {
		dbURL = "postgres://postgres:password@localhost:5432/gym?sslmode=disable"
	}

	// Connect to database
	db, err := sql.Open("postgres", dbURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	// Initialize database tables
	if err := initDatabase(db); err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}

	// Create gRPC server
	lis, err := net.Listen("tcp", fmt.Sprintf(":%s", port))
	if err != nil {
		log.Fatalf("Failed to listen: %v", err)
	}
	s := grpc.NewServer()
	pb.RegisterSessionServiceServer(s, &server{db: db})

	// Register reflection service (useful for gRPC tools)
	reflection.Register(s)

	log.Printf("Server listening at %v", lis.Addr())
	if err := s.Serve(lis); err != nil {
		log.Fatalf("Failed to serve: %v", err)
	}
}
