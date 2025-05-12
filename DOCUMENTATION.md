# Gym Management System - Microservices Architecture

## Table of Contents

- [Project Overview](#project-overview)
- [Architecture](#architecture)
- [Technologies Used](#technologies-used)
- [Services](#services)
  - [1. User Service](#1-user-service)
  - [2. Session Service](#2-session-service)
  - [3. Payment Service](#3-payment-service)
  - [4. Notification Service](#4-notification-service)
  - [5. API Gateway](#5-api-gateway)
- [Installation and Setup](#installation-and-setup)
- [Testing the Services](#testing-the-services)
  - [Testing Approach](#testing-approach)
  - [Important Notes for Testing](#important-notes-for-testing)
- [Manual Testing](#manual-testing)
- [API Endpoints](#api-endpoints)
- [Troubleshooting](#troubleshooting)

## Project Overview

This project is a comprehensive Gym Management System built using microservices architecture. It provides functionality for managing gym members, scheduling training sessions, handling subscriptions and payments, and sending notifications. 

The system demonstrates the use of different communication protocols between services, including REST, gRPC, GraphQL, and Kafka, all of which are integrated through an API Gateway to provide a unified interface for clients.

## Architecture

The system is built using a microservices architecture with the following components:

![Architecture Diagram](architecture-diagram.png)

- **API Gateway**: Single entry point for all client requests
- **User Service**: Handles user authentication and management
- **Session Service**: Manages training sessions and reservations
- **Payment Service**: Handles subscription plans and payments
- **Notification Service**: Sends notifications for various events
- **Kafka**: Message broker for event-driven communication
- **Databases**: MongoDB for User, Payment, and Notification services; PostgreSQL for Session service

## Technologies Used

| Component | Technology | Protocol |
|-----------|------------|----------|
| API Gateway | Node.js/Express | REST |
| User Service | Node.js/Express | REST |
| Session Service | Go | gRPC |
| Payment Service | Node.js/Apollo | GraphQL |
| Notification Service | Node.js | Kafka |
| Containers | Docker | - |
| Orchestration | Docker Compose | - |
| Databases | MongoDB, PostgreSQL | - |
| Message Broker | Kafka | - |

## Services

### 1. User Service

**Description**: Handles user authentication, registration, and profile management with role-based access control (member, coach, admin).

**Key Features**:
- User registration and authentication with JWT
- Role-based access control
- User profile management
- REST API endpoints

**Tech Stack**:
- Node.js with Express
- MongoDB for data storage
- JWT for authentication

### 2. Session Service

**Description**: Manages training sessions and member reservations.

**Key Features**:
- CRUD operations for gym sessions
- Session reservation system
- Reservation management
- gRPC for efficient communication

**Tech Stack**:
- Go language
- gRPC for API communication
- PostgreSQL for data storage

### 3. Payment Service

**Description**: Handles subscription plans, payments, and billing.

**Key Features**:
- Subscription plan management
- Payment processing
- Transaction history
- GraphQL API for flexible queries

**Tech Stack**:
- Node.js with Apollo Server
- GraphQL for API
- MongoDB for data storage
- Kafka for event production

### 4. Notification Service

**Description**: Sends notifications to users based on system events.

**Key Features**:
- Event-driven notification system
- Supports multiple notification types (session bookings, payments, etc.)
- In-app notifications and email notifications

**Tech Stack**:
- Node.js
- Kafka for consuming events
- MongoDB for storing notifications

### 5. API Gateway

**Description**: Provides a unified entry point for all client requests.

**Key Features**:
- Request routing to appropriate services
- Protocol translation (REST → gRPC, REST → GraphQL)
- Authentication and authorization
- API documentation

**Tech Stack**:
- Node.js with Express
- HTTP-Proxy-Middleware for routing

## Installation and Setup

### Prerequisites

- Docker and Docker Compose
- Node.js (for local development)
- Go (for local development of Session Service)
- Postman (for testing)

### Setup Steps

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd hadil_microservices
   ```

2. Start all services using Docker Compose:
   ```bash
   docker-compose up -d
   ```

3. Or use the provided script:
   ```bash
   ./start-services.sh
   ```

4. Access the services:
   - API Gateway: http://localhost:8000
   - GraphQL Playground: http://localhost:8000/graphql
   - Kafka UI: http://localhost:8080

## Testing the Services

The project can be tested using various HTTP clients or tools like curl, Insomnia, or by creating your own test scripts. Below is a comprehensive guide for testing each service manually.

### Testing Approach

Follow this sequence to test all services properly:

1. First test the User Service to get authentication tokens
2. Then test the Session Service for booking classes
3. Then test the Payment Service for subscriptions
4. Finally test the Notification Service to see events being processed

### Important Notes for Testing

- Save the JWT token after login for subsequent requests
- Save IDs returned from creating resources (sessions, plans, etc.) for later use
- For requests requiring authentication, include the JWT token in the Authorization header
- For admin-only operations, you'll need a user with admin role


## Manual Testing

You can also test the services manually using `curl` or any HTTP client:

### User Service (REST)

```bash
# Register a new user
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "password": "password123",
    "phone": "+1234567890",
    "dateOfBirth": "1990-01-01"
  }'

# Login and get JWT token
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "password123"
  }'
```

### Session Service (gRPC via API Gateway)

```bash
# Create a session
curl -X POST http://localhost:8000/api/sessions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Morning Yoga",
    "description": "Energizing session",
    "coach_id": "YOUR_USER_ID",
    "capacity": 15,
    "start_time": "2025-05-15T08:00:00Z",
    "end_time": "2025-05-15T09:00:00Z",
    "location": "Studio A",
    "session_type": "yoga",
    "difficulty_level": "intermediate"
  }'
```

### Payment Service (GraphQL)

```bash
# Get subscription plans
curl -X GET http://localhost:8000/api/subscriptions

# For direct GraphQL queries
curl -X POST http://localhost:8000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "query": "query { subscriptionPlans { id name price } }"
  }'
```

## API Endpoints

### User Service

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/auth/register` | POST | Register a new user | No |
| `/api/auth/login` | POST | Login and get JWT token | No |
| `/api/auth/profile` | GET | Get current user profile | Yes |
| `/api/users` | GET | Get all users | Yes (Admin) |
| `/api/users/:id` | GET | Get user by ID | Yes |
| `/api/users` | POST | Create a new user | Yes (Admin) |
| `/api/users/:id` | PUT | Update user | Yes |
| `/api/users/:id` | DELETE | Delete user | Yes (Admin) |
| `/api/users/:id/role` | PATCH | Update user role | Yes (Admin) |

### Session Service

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/sessions` | GET | Get all sessions | No |
| `/api/sessions/:id` | GET | Get session by ID | No |
| `/api/sessions` | POST | Create a new session | Yes (Coach/Admin) |
| `/api/sessions/:id` | PUT | Update session | Yes (Coach/Admin) |
| `/api/sessions/:id` | DELETE | Delete session | Yes (Admin) |
| `/api/reservations` | POST | Make a reservation | Yes |
| `/api/reservations/:id` | GET | Get reservation by ID | Yes |
| `/api/reservations/:id` | DELETE | Cancel reservation | Yes |
| `/api/reservations/user/:userId` | GET | Get user reservations | Yes |
| `/api/reservations/session/:sessionId` | GET | Get session reservations | Yes |

### Payment Service

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/subscriptions` | GET | Get all subscription plans | No |
| `/api/subscriptions/:id` | GET | Get subscription plan by ID | No |
| `/api/subscriptions` | POST | Create subscription plan | Yes (Admin) |
| `/api/subscriptions/:id` | PUT | Update subscription plan | Yes (Admin) |
| `/api/subscriptions/:id` | DELETE | Delete subscription plan | Yes (Admin) |
| `/api/payments/subscribe` | POST | Subscribe to a plan | Yes |
| `/api/payments/user/:userId` | GET | Get user subscriptions | Yes |
| `/api/payments/subscription/:id` | GET | Get subscription details | Yes |
| `/api/payments/process` | POST | Process a payment | Yes |
| `/graphql` | POST/GET | GraphQL endpoint | Varies |

### Notification Service

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/notifications/:userId` | GET | Get user notifications | Yes |
| `/api/notifications/:id/read` | PUT | Mark notification as read | Yes |
| `/api/notifications/user/:userId/read-all` | PUT | Mark all as read | Yes |

## Troubleshooting

### Common Issues

1. **Service unavailable**:
   - Check if the service container is running: `docker-compose ps`
   - Check service logs: `docker-compose logs <service-name>`

2. **Database connection errors**:
   - Ensure MongoDB and PostgreSQL containers are running
   - Check connection strings in environment variables

3. **Authentication failures**:
   - Verify JWT token is valid and not expired
   - Ensure the token is included in the Authorization header

4. **Kafka issues**:
   - Check Kafka and Zookeeper containers are running
   - Verify Kafka topics exist using Kafka UI

### Getting Help

If you encounter issues not covered in this documentation:

1. Check the service logs for detailed error messages
2. Review the source code for the specific service
3. Ensure all services are properly configured in docker-compose.yml
4. Restart the affected service or all services if necessary
