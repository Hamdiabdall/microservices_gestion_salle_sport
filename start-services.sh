#!/bin/bash

# This script helps start all services in development mode

# Start MongoDB and Postgres
docker-compose up -d mongodb postgres

# Start Kafka and Zookeeper
docker-compose up -d zookeeper kafka kafka-ui

# Wait for databases to be ready
echo "Waiting for databases to be ready..."
sleep 10

# Start all services
docker-compose up -d user-service session-service payment-service notification-service api-gateway

echo "All services started. API Gateway is available at http://localhost:8000"
echo "Kafka UI is available at http://localhost:8080"
echo "GraphQL Playground is available at http://localhost:8000/graphql"
