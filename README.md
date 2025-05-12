# Gym Management System - Microservices Architecture

A comprehensive gym management system built using microservices architecture, implementing various communication protocols including REST, gRPC, GraphQL, and Kafka.

## Services

### 1. User Service (REST API)
- CRUD operations for members
- Authentication using JWT
- Role-based access control (admin, member, coach)
- Technology: Node.js with Express

### 2. Session Service (gRPC)
- Manage training sessions and reservations
- Communication with User Service for identity verification
- Technology: Go with gRPC

### 3. Payment Service (GraphQL)
- Manage subscription plans
- Process payments
- Track transaction history
- Technology: Node.js with Apollo GraphQL

### 4. Notification Service (Kafka Consumer)
- Send notifications via email or in-app
- Consume events from Kafka topics
- Technology: Node.js with Kafkajs

## Getting Started

### Prerequisites
- Docker and Docker Compose
- Postman (for testing REST APIs)
- GraphQL client (for testing GraphQL APIs)
- gRPC client (for testing gRPC services)

### Installation

1. Clone the repository
2. Run the following command:

```bash
docker-compose up -d
```

### Testing with Postman

You can test all services using Postman by creating requests as outlined below:

#### Setting Up Postman

1. Create a new Postman environment with these variables:
   - `api_gateway_url`: http://localhost:8000
   - `jwt_token`: (will be filled after login)
   - `user_id`: (will be filled after login)
   - `session_id`: (will be filled after creating a session)
   - `plan_id`: (will be filled after creating a subscription plan)
   - `subscription_id`: (will be filled after subscribing)

#### 1. User Service (REST API)

**Register a User:**
- Method: POST
- URL: {{api_gateway_url}}/api/auth/register
- Body (JSON):
  ```json
  {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "password": "password123",
    "phone": "+1234567890",
    "dateOfBirth": "1990-01-01"
  }
  ```

**Login:**
- Method: POST
- URL: {{api_gateway_url}}/api/auth/login
- Body (JSON):
  ```json
  {
    "email": "john.doe@example.com",
    "password": "password123"
  }
  ```
- Test Script (to save token):
  ```javascript
  var jsonData = pm.response.json();
  if (jsonData.token) {
    pm.environment.set("jwt_token", jsonData.token);
    pm.environment.set("user_id", jsonData.user.id);
  }
  ```

**Get Profile:**
- Method: GET
- URL: {{api_gateway_url}}/api/auth/profile
- Headers: Authorization: Bearer {{jwt_token}}

#### 2. Session Service (gRPC via API Gateway)

**Create Session:**
- Method: POST
- URL: {{api_gateway_url}}/api/sessions
- Headers: Authorization: Bearer {{jwt_token}}
- Body (JSON):
  ```json
  {
    "title": "Morning Yoga",
    "description": "Start your day with energizing yoga session",
    "coach_id": "{{user_id}}",
    "capacity": 15,
    "start_time": "2025-05-15T08:00:00Z",
    "end_time": "2025-05-15T09:00:00Z",
    "location": "Studio A",
    "session_type": "yoga",
    "difficulty_level": "intermediate"
  }
  ```
- Test Script:
  ```javascript
  var jsonData = pm.response.json();
  if (jsonData.id) {
    pm.environment.set("session_id", jsonData.id);
  }
  ```

**Get All Sessions:**
- Method: GET
- URL: {{api_gateway_url}}/api/sessions?session_type=yoga&include_past=false&page=1&limit=10

**Make Reservation:**
- Method: POST
- URL: {{api_gateway_url}}/api/reservations
- Headers: Authorization: Bearer {{jwt_token}}
- Body (JSON):
  ```json
  {
    "session_id": "{{session_id}}"
  }
  ```

#### 3. Payment Service (GraphQL via API Gateway)

**Create Subscription Plan:**
- Method: POST
- URL: {{api_gateway_url}}/api/subscriptions
- Headers: Authorization: Bearer {{jwt_token}}
- Body (JSON):
  ```json
  {
    "name": "Monthly Membership",
    "description": "Regular monthly gym membership",
    "price": 29.99,
    "duration": 30,
    "features": ["Basic equipment access", "Locker room access"],
    "isActive": true
  }
  ```
- Test Script:
  ```javascript
  var jsonData = pm.response.json();
  if (jsonData.id) {
    pm.environment.set("plan_id", jsonData.id);
  }
  ```

**Subscribe to Plan:**
- Method: POST
- URL: {{api_gateway_url}}/api/payments/subscribe
- Headers: Authorization: Bearer {{jwt_token}}
- Body (JSON):
  ```json
  {
    "planId": "{{plan_id}}",
    "paymentMethod": "credit_card"
  }
  ```
- Test Script:
  ```javascript
  var jsonData = pm.response.json();
  if (jsonData.id) {
    pm.environment.set("subscription_id", jsonData.id);
  }
  ```

**GraphQL Playground:**
- Access directly at: http://localhost:8000/graphql

#### 4. Notification Service

**Get User Notifications:**
- Method: GET
- URL: {{api_gateway_url}}/api/notifications/{{user_id}}
- Headers: Authorization: Bearer {{jwt_token}}

**Mark Notification as Read:**
- Method: PUT
- URL: {{api_gateway_url}}/api/notifications/NOTIFICATION_ID/read
- Headers: Authorization: Bearer {{jwt_token}}

### Additional Testing Resources

- **GraphQL**: Access playground at `http://localhost:8000/graphql`
- **Kafka**: Monitor events through Kafka UI at `http://localhost:8080`

## Architecture

![Architecture Diagram](architecture.png)

## Security

- JWT Authentication
- Role-based Access Control
- SSL/TLS for secure communication
- Data validation middlewares

## License

This project is licensed under the MIT License - see the LICENSE file for details.
