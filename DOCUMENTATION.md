# Système de Gestion de Salle de Sport - Architecture Microservices

## Table des Matières

- [Aperçu du Projet](#aperçu-du-projet)
- [Architecture](#architecture)
- [Technologies Utilisées](#technologies-utilisées)
- [Services](#services)
  - [1. Service Utilisateur](#1-service-utilisateur)
  - [2. Service de Session](#2-service-de-session)
  - [3. Service de Paiement](#3-service-de-paiement)
  - [4. Service de Notification](#4-service-de-notification)
  - [5. API Gateway](#5-api-gateway)
- [Installation et Configuration](#installation-et-configuration)
- [Tests des Services](#tests-des-services)
  - [Approche de Test](#approche-de-test)
  - [Notes Importantes pour les Tests](#notes-importantes-pour-les-tests)
  - [Tests avec Postman](#tests-avec-postman)
- [Tests Manuels](#tests-manuels)
- [Points d'Accès API](#points-daccès-api)
- [Dépannage](#dépannage)

## Aperçu du Projet

Ce projet est un système complet de gestion de salle de sport construit en utilisant une architecture microservices. Il fournit des fonctionnalités pour gérer les membres de la salle de sport, planifier des séances d'entraînement, gérer les abonnements et les paiements, et envoyer des notifications.

Le système démontre l'utilisation de différents protocoles de communication entre les services, notamment REST, gRPC, GraphQL et Kafka, tous intégrés via une API Gateway pour fournir une interface unifiée aux clients.

Grâce à cette architecture, le système offre une grande évolutivité, une facilité de maintenance et une robustesse accrue en cas de défaillance d'un service spécifique. Chaque service peut être développé, déployé et mis à l'échelle indépendamment, offrant ainsi une flexibilité optimale.

## Architecture

Le système est construit en utilisant une architecture microservices avec les composants suivants :

![Diagramme d'Architecture](architecture-diagram.png)

- **API Gateway** : Point d'entrée unique pour toutes les requêtes client, assurant le routage vers les services appropriés
- **Service Utilisateur** : Gère l'authentification des utilisateurs, les profils et les rôles (membre, coach, administrateur)
- **Service de Session** : Gère les séances d'entraînement, les réservations et la planification
- **Service de Paiement** : Gère les plans d'abonnement, les paiements et les transactions
- **Service de Notification** : Envoie des notifications en temps réel basées sur divers événements système
- **Kafka** : Broker de messages pour la communication event-driven entre les services
- **Bases de données** : MongoDB pour les services Utilisateur, Paiement et Notification; PostgreSQL pour le service Session

## Technologies Utilisées

| Composant | Technologie | Protocole |
|-----------|------------|----------|
| API Gateway | Node.js/Express | REST |
| Service Utilisateur | Node.js/Express | REST |
| Service de Session | Go | gRPC |
| Service de Paiement | Node.js/Apollo | GraphQL |
| Service de Notification | Node.js | Kafka |
| Conteneurs | Docker | - |
| Orchestration | Docker Compose | - |
| Bases de données | MongoDB, PostgreSQL | - |
| Broker de Messages | Kafka | - |

Chaque technologie a été sélectionnée pour ses points forts spécifiques : Node.js pour sa performance en opérations I/O asynchrones, Go pour ses performances élevées avec gRPC, GraphQL pour la flexibilité des requêtes, et Kafka pour la communication fiable et asynchrone entre services.

## Services

### 1. Service Utilisateur

**Description**: Le Service Utilisateur est le pilier de la gestion des identités et des accès dans notre système. Il prend en charge l'ensemble du cycle de vie des utilisateurs, depuis l'inscription jusqu'à la gestion quotidienne des profils, en passant par l'authentification sécurisée avec JSON Web Tokens (JWT). Ce service implémente un système de contrôle d'accès basé sur les rôles (RBAC), permettant une ségregation précise des fonctionnalités selon que l'utilisateur est membre, coach ou administrateur.

**Fonctionnalités Clés**:
- Inscription et authentification des utilisateurs avec JWT pour une sécurité renforcée
- Contrôle d'accès basé sur les rôles (membre, coach, administrateur)
- Gestion complète des profils utilisateurs (informations personnelles, préférences)
- Points d'accès API REST complets et bien documentés
- Validation des données pour garantir l'intégrité des informations

**Stack Technologique**:
- Node.js avec Express pour une API REST performante et évolutive
- MongoDB pour le stockage flexible des données utilisateur
- JWT pour une authentification sécurisée et sans état
- Middleware de validation pour garantir l'intégrité des données entrantes

### 2. Service de Session

**Description**: Le Service de Session est responsable de la gestion complète des séances d'entraînement et des réservations des membres. Implémenté en Go pour des performances optimales, ce service utilise gRPC pour une communication efficace et faible latence avec l'API Gateway. Il permet aux coachs de créer et gérer des séances d'entraînement, tout en offrant aux membres la possibilité de consulter et réserver ces séances. *(Remarque: Ce service est temporairement désactivé en raison de problèmes de dépendances des modules Go)*.

**Fonctionnalités Clés**:
- Opérations CRUD complètes pour les séances d'entraînement
- Système de réservation avec gestion de la capacité des salles
- Gestion des réservations avec possibilité d'annulation et de modification
- Communication gRPC pour des échanges de données rapides et efficaces
- Planification avancée des séances avec récurrences

**Stack Technologique**:
- Langage Go pour des performances élevées et une faible empreinte mémoire
- gRPC pour une communication inter-services optimisée
- PostgreSQL pour le stockage relationnel robuste des données
- Protocole Protocol Buffers pour une sérialisation efficace

### 3. Service de Paiement

**Description**: Le Service de Paiement gère tous les aspects financiers du système, depuis les forfaits d'abonnement jusqu'aux transactions de paiement. Utilisant GraphQL, il offre une interface flexible permettant des requêtes précises pour récupérer exactement les données nécessaires. Ce service s'intègre avec Kafka pour publier des événements de paiement qui seront consommés par le Service de Notification, permettant ainsi d'informer les utilisateurs de l'état de leurs transactions.

**Fonctionnalités Clés**:
- Gestion complète des plans d'abonnement avec tarifs et durées personnalisables
- Traitement des paiements avec suivi des transactions
- Historique détaillé des transactions pour chaque utilisateur
- API GraphQL pour des requêtes flexibles et efficaces
- Intégration avec Kafka pour la publication d'événements de paiement
- Gestion des périodes d'essai et des remises

**Stack Technologique**:
- Node.js avec Apollo Server pour l'API GraphQL
- GraphQL pour des requêtes précises et optimisées
- MongoDB pour le stockage des données de paiement et d'abonnement
- Kafka pour la production d'événements liés aux paiements
- Bibliothèques de sécurité pour le chiffrement des données sensibles

### 4. Service de Notification

**Description**: Le Service de Notification fonctionne comme le système de communication en temps réel de la plateforme. Il consomme les événements générés par les autres services via Kafka, puis envoie des notifications personnalisées aux utilisateurs. Ce service prend en charge différents types de notifications, comme les confirmations de réservation de séances, les confirmations de paiement, les rappels d'abonnement, et plus encore. L'architecture event-driven permet au système de rester réactif et découplé.

**Fonctionnalités Clés**:
- Système de notification piloté par événements en temps réel
- Support de multiples types de notifications (réservations, paiements, rappels, etc.)
- Notifications in-app et par email pour maximiser l'engagement
- Consommation d'événements via Kafka provenant de multiples services
- Personnalisation des notifications selon les préférences utilisateur
- Historique des notifications pour chaque utilisateur

**Stack Technologique**:
- Node.js pour un traitement asynchrone efficace des événements
- Kafka pour la consommation fiable des événements de différents services
- MongoDB pour stocker les notifications et les préférences utilisateur
- Services d'envoi d'emails pour les notifications externes

### 5. API Gateway

**Description**: L'API Gateway sert de point d'entrée uniforme pour toutes les requêtes client, simplifiant ainsi l'interaction avec l'architecture microservices sous-jacente. Ce composant crucial gère le routage des requêtes vers les services appropriés, effectue des traductions de protocole lorsque nécessaire, et applique des politiques d'authentification et d'autorisation globales. Il masque la complexité de l'architecture interne aux clients, offrant une expérience d'utilisation simplifiée et cohérente.

**Fonctionnalités Clés**:
- Routage intelligent des requêtes vers les services appropriés
- Traduction de protocole (REST vers gRPC, REST vers GraphQL)
- Vérification centralisée de l'authentification et de l'autorisation
- Documentation complète de l'API pour les développeurs
- Gestion des versions API pour assurer la compatibilité ascendante
- Logging des requêtes pour l'audit et le débogage

**Stack Technologique**:
- Node.js avec Express pour une passerelle API légère et performante
- HTTP-Proxy-Middleware pour le routage efficace des requêtes
- JWT pour la vérification des jetons d'authentification
- Middleware de validation pour filtrer les requêtes malformées

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


## Basic Test Flow (5 Simple Steps)

Step 1: Check API Gateway
**Request:**
- Method: GET
- URL: `http://localhost:8000`

**Expected Result:**
- Status: 200 OK
- JSON response showing available services

Step 2: Register a User
**Request:**
- Method: POST
- URL: `http://localhost:8000/api/auth/register`
- Headers: `Content-Type: application/json`
- Body:
```json
{
  "firstName": "Test",
  "lastName": "User",
  "email": "test@example.com",
  "password": "password123",
  "phone": "+1234567890",
  "dateOfBirth": "1990-01-01"
}
```

**Expected Result:**
- Status: 201 Created
- JSON response with user details

Step 3: Login to Get Token
**Request:**
- Method: POST
- URL: `http://localhost:8000/api/auth/login`
- Headers: `Content-Type: application/json`
- Body:
```json
{
  "email": "test@example.com",
  "password": "password123"
}
```

**Expected Result:**
- Status: 200 OK
- JSON response containing a token
- **Important:** Copy this token for next steps

Step 4: Create Subscription Plan (GraphQL)
**Request:**
- Method: POST
- URL: `http://localhost:8000/api/payment`
- Headers:
  - `Content-Type: application/json`
  - `Authorization: Bearer YOUR_TOKEN_HERE` (replace with token from Step 3)
- Body:
```json
{
  "query": "mutation { createSubscriptionPlan(name: \"Basic Plan\", description: \"Standard gym access\", price: 49.99, durationInDays: 30) { id name price } }"
}
```

**Expected Result:**
- Status: 200 OK
- JSON response with created plan details
- Note the plan ID for the next step

Step 5: Subscribe to the Plan (GraphQL)
**Request:**
- Method: POST
- URL: `http://localhost:8000/api/payment`
- Headers:
  - `Content-Type: application/json`
  - `Authorization: Bearer YOUR_TOKEN_HERE` (use same token)
- Body:
```json
{
  "query": "mutation { subscribe(planId: \"PLAN_ID_HERE\") { id startDate endDate status } }"
}
```
(Replace PLAN_ID_HERE with the ID from Step 4)

**Expected Result:**
- Status: 200 OK
- JSON response with subscription details

## Verify Services are Working
After completing these steps, you can check if all services processed the requests correctly:

1. **User Service Check:**
   ```
   docker logs user-service | tail -20
   ```
   (Should show user registration and login)

2. **Payment Service Check:**
   ```
   docker logs payment-service | tail -20
   ```
   (Should show plan creation and subscription)

3. **Notification Service Check:**
   ```
   docker logs notification-service | tail -20
   ```
   (Should show notifications triggered by subscription)


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
