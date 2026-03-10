# API Architecture & Configuration

<cite>
**Referenced Files in This Document**
- [index.js](file://backend/index.js)
- [db.js](file://backend/DB/db.js)
- [package.json](file://backend/package.json)
- [.env](file://backend/.env)
- [AuthRouter.js](file://backend/Routes/AuthRouter.js)
- [ListingRouter.js](file://backend/Routes/ListingRouter.js)
- [DashboardRouter.js](file://backend/Routes/DashboardRouter.js)
- [CommunityRouter.js](file://backend/Routes/CommunityRouter.js)
- [TransactionRouter.js](file://backend/Routes/TransactionRouter.js)
- [Auth.js](file://backend/Middlewares/Auth.js)
- [AuthController.js](file://backend/Controllers/AuthController.js)
- [seed.js](file://backend/seed.js)
- [Users.js](file://backend/Models/Users.js)
- [UserProfile.js](file://backend/Models/UserProfile.js)
- [EnergyListing.js](file://backend/Models/EnergyListing.js)
- [googleConfig.js](file://backend/utils/googleConfig.js)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Dependency Analysis](#dependency-analysis)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Conclusion](#conclusion)
10. [Appendices](#appendices)

## Introduction
This document describes the API architecture and configuration of the Node.js/Express backend server. It covers server initialization, middleware configuration, routing structure, RESTful API design, request/response patterns, error handling strategies, MongoDB connectivity via Mongoose, connection pooling and recovery, Socket.IO integration for real-time communication, environment configuration, CORS settings, security headers, startup procedures, health checks, monitoring, performance optimization, timeouts, and resource cleanup.

## Project Structure
The backend is organized by concerns:
- Entry point initializes Express, HTTP server, Socket.IO, connects to the database, configures middleware, registers routes, and starts the server.
- Routes define API endpoints grouped by domain (authentication, listings, transactions, dashboard, community).
- Controllers implement business logic and interact with models.
- Models define Mongoose schemas for MongoDB collections.
- Middlewares provide cross-cutting concerns like authentication.
- DB module encapsulates database connection.
- Utilities support third-party integrations (e.g., Google OAuth).
- Environment variables are loaded via dotenv.

```mermaid
graph TB
subgraph "Server"
IDX["index.js"]
HTTP["HTTP Server"]
IO["Socket.IO Server"]
end
subgraph "Configuration"
PKG["package.json"]
ENV[".env"]
end
subgraph "Routing"
AR["AuthRouter.js"]
LR["ListingRouter.js"]
DR["DashboardRouter.js"]
CR["CommunityRouter.js"]
TR["TransactionRouter.js"]
end
subgraph "Controllers"
AC["AuthController.js"]
end
subgraph "Middlewares"
AMW["Auth.js"]
end
subgraph "Models"
U["Users.js"]
UP["UserProfile.js"]
EL["EnergyListing.js"]
end
subgraph "DB Layer"
DBM["db.js"]
SEED["seed.js"]
end
subgraph "Utilities"
GC["googleConfig.js"]
end
IDX --> HTTP
IDX --> IO
IDX --> DBM
IDX --> AR
IDX --> LR
IDX --> DR
IDX --> CR
IDX --> TR
AR --> AC
AR --> AMW
LR --> AMW
DR --> AMW
CR --> AMW
TR --> AMW
AC --> U
AC --> UP
AC --> EL
DBM --> U
DBM --> UP
DBM --> EL
SEED --> DBM
GC --> AC
PKG --> IDX
ENV --> IDX
```

**Diagram sources**
- [index.js](file://backend/index.js#L1-L97)
- [db.js](file://backend/DB/db.js#L1-L12)
- [package.json](file://backend/package.json#L1-L29)
- [.env](file://backend/.env#L1-L13)
- [AuthRouter.js](file://backend/Routes/AuthRouter.js#L1-L15)
- [ListingRouter.js](file://backend/Routes/ListingRouter.js#L1-L24)
- [DashboardRouter.js](file://backend/Routes/DashboardRouter.js#L1-L10)
- [CommunityRouter.js](file://backend/Routes/CommunityRouter.js#L1-L14)
- [TransactionRouter.js](file://backend/Routes/TransactionRouter.js#L1-L11)
- [AuthController.js](file://backend/Controllers/AuthController.js#L1-L200)
- [Auth.js](file://backend/Middlewares/Auth.js#L1-L19)
- [Users.js](file://backend/Models/Users.js#L1-L32)
- [UserProfile.js](file://backend/Models/UserProfile.js#L1-L31)
- [EnergyListing.js](file://backend/Models/EnergyListing.js#L1-L56)
- [seed.js](file://backend/seed.js#L1-L169)
- [googleConfig.js](file://backend/utils/googleConfig.js#L1-L14)

**Section sources**
- [index.js](file://backend/index.js#L1-L97)
- [package.json](file://backend/package.json#L1-L29)
- [.env](file://backend/.env#L1-L13)

## Core Components
- Express application and HTTP server creation with explicit HTTP server instantiation for Socket.IO compatibility.
- Socket.IO server configured with CORS and credential support, exposing rooms for user-specific and marketplace events.
- Centralized database connection via Mongoose with environment-driven URI.
- Middleware stack: CORS, body parsing, and JWT-based authentication guard.
- Modular routing under /api with domain-specific routers.
- Real-time emission loop simulating energy data updates.

Key implementation references:
- Server initialization and Socket.IO setup: [index.js](file://backend/index.js#L14-L24)
- CORS and JSON body parsing: [index.js](file://backend/index.js#L29-L35)
- Route registration: [index.js](file://backend/index.js#L41-L45)
- Socket.IO connection handler and rooms: [index.js](file://backend/index.js#L48-L73)
- Periodic energy data emission: [index.js](file://backend/index.js#L76-L89)
- Database connection: [db.js](file://backend/DB/db.js#L3-L10)
- Authentication middleware: [Auth.js](file://backend/Middlewares/Auth.js#L3-L18)

**Section sources**
- [index.js](file://backend/index.js#L14-L97)
- [db.js](file://backend/DB/db.js#L1-L12)
- [Auth.js](file://backend/Middlewares/Auth.js#L1-L19)

## Architecture Overview
The backend follows a layered architecture:
- Presentation layer: Express routes and controllers.
- Application layer: Business logic in controllers.
- Domain layer: Models and database operations.
- Infrastructure layer: Database connection, Socket.IO, environment configuration.

```mermaid
graph TB
Client["Client Apps<br/>Web/React"]
ExpressApp["Express App<br/>index.js"]
Routers["Routers<br/>Auth/Listing/Dashboard/Community/Transaction"]
Controllers["Controllers<br/>AuthController.js"]
MWAuth["Auth Middleware"]
Models["Mongoose Models<br/>Users/UserProfile/EnergyListing"]
DB["MongoDB via Mongoose"]
SIO["Socket.IO Server"]
Client --> ExpressApp
ExpressApp --> Routers
Routers --> Controllers
Routers --> MWAuth
Controllers --> Models
Models --> DB
ExpressApp --> SIO
```

**Diagram sources**
- [index.js](file://backend/index.js#L1-L97)
- [AuthRouter.js](file://backend/Routes/AuthRouter.js#L1-L15)
- [ListingRouter.js](file://backend/Routes/ListingRouter.js#L1-L24)
- [DashboardRouter.js](file://backend/Routes/DashboardRouter.js#L1-L10)
- [CommunityRouter.js](file://backend/Routes/CommunityRouter.js#L1-L14)
- [TransactionRouter.js](file://backend/Routes/TransactionRouter.js#L1-L11)
- [AuthController.js](file://backend/Controllers/AuthController.js#L1-L200)
- [Auth.js](file://backend/Middlewares/Auth.js#L1-L19)
- [Users.js](file://backend/Models/Users.js#L1-L32)
- [UserProfile.js](file://backend/Models/UserProfile.js#L1-L31)
- [EnergyListing.js](file://backend/Models/EnergyListing.js#L1-L56)

## Detailed Component Analysis

### Server Initialization and Startup
- Creates Express app and HTTP server.
- Initializes Socket.IO with CORS allowing origin, methods, and credentials.
- Loads environment variables and connects to MongoDB.
- Registers middleware and routes.
- Starts HTTP server on configured port and logs WebSocket readiness.

```mermaid
sequenceDiagram
participant Proc as "Process"
participant App as "Express App"
participant HTTP as "HTTP Server"
participant DB as "MongoDB"
participant IO as "Socket.IO"
Proc->>App : "Create Express app"
Proc->>HTTP : "Wrap app with HTTP server"
Proc->>IO : "Initialize Socket.IO with CORS"
Proc->>DB : "connectDB()"
DB-->>Proc : "Connection established"
Proc->>App : "Configure middleware"
Proc->>App : "Register routes"
Proc->>HTTP : "Listen on PORT"
HTTP-->>Proc : "Server running"
Proc->>IO : "Start periodic energy data emission"
```

**Diagram sources**
- [index.js](file://backend/index.js#L14-L97)
- [db.js](file://backend/DB/db.js#L3-L10)

**Section sources**
- [index.js](file://backend/index.js#L14-L97)
- [db.js](file://backend/DB/db.js#L1-L12)

### Middleware Configuration
- CORS: Allows credentials and restricts origin to development frontend URL.
- Body parser: Parses JSON payloads.
- Authentication: Validates Authorization header bearer tokens against JWT secret.

```mermaid
flowchart TD
Start(["Incoming Request"]) --> CORS["Apply CORS Policy"]
CORS --> BodyParse["Parse JSON Body"]
BodyParse --> AuthCheck{"Route Protected?"}
AuthCheck --> |Yes| JWT["Verify Bearer Token"]
JWT --> Valid{"Valid?"}
Valid --> |Yes| Next["Attach User to Request<br/>Call Next Handler"]
Valid --> |No| Err401["Return 401 Unauthorized"]
AuthCheck --> |No| Next
Next --> End(["Response Sent"])
Err401 --> End
```

**Diagram sources**
- [index.js](file://backend/index.js#L29-L35)
- [Auth.js](file://backend/Middlewares/Auth.js#L3-L18)

**Section sources**
- [index.js](file://backend/index.js#L29-L35)
- [Auth.js](file://backend/Middlewares/Auth.js#L1-L19)

### Routing Structure and RESTful Design
- Base path: /api
- Auth endpoints: register, login, Google OAuth, profile CRUD, reset password, verify reset code.
- Listings endpoints: public browse, user-specific listings, analytics, create/update/delete.
- Transactions endpoints: user transactions history, create transaction.
- Dashboard endpoints: energy data, transactions summary.
- Community endpoints: posts listing, create post, voting, comments, comment voting.

```mermaid
graph LR
A["/api/auth"] --> A1["POST /register"]
A --> A2["POST /login"]
A --> A3["POST /auth/google"]
A --> A4["GET /user/profile"]
A --> A5["POST /user/profile"]
A --> A6["PUT /user/profile"]
A --> A7["POST /user/reset-password"]
A --> A8["POST /user/verify-reset-code"]
L["/api/listings"] --> L1["GET /listings"]
L --> L2["GET /user/listings"]
L --> L3["GET /user/listings/analytics"]
L --> L4["POST /listings"]
L --> L5["PUT /listings/:id"]
L --> L6["DELETE /listings/:id"]
T["/api/transactions"] --> T1["GET /user/transactions"]
T --> T2["POST /transactions"]
D["/api/dashboard"] --> D1["GET /energy"]
D --> D2["GET /transactions"]
C["/api/community"] --> C1["GET /posts"]
C --> C2["POST /posts"]
C --> C3["PUT /posts/:id/vote"]
C --> C4["POST /posts/:id/comments"]
C --> C5["PUT /posts/:id/comments/:commentId/vote"]
```

**Diagram sources**
- [AuthRouter.js](file://backend/Routes/AuthRouter.js#L1-L15)
- [ListingRouter.js](file://backend/Routes/ListingRouter.js#L1-L24)
- [TransactionRouter.js](file://backend/Routes/TransactionRouter.js#L1-L11)
- [DashboardRouter.js](file://backend/Routes/DashboardRouter.js#L1-L10)
- [CommunityRouter.js](file://backend/Routes/CommunityRouter.js#L1-L14)

**Section sources**
- [AuthRouter.js](file://backend/Routes/AuthRouter.js#L1-L15)
- [ListingRouter.js](file://backend/Routes/ListingRouter.js#L1-L24)
- [TransactionRouter.js](file://backend/Routes/TransactionRouter.js#L1-L11)
- [DashboardRouter.js](file://backend/Routes/DashboardRouter.js#L1-L10)
- [CommunityRouter.js](file://backend/Routes/CommunityRouter.js#L1-L14)

### Request/Response Patterns and Error Handling
- Authentication middleware returns 403 for missing/invalid Authorization header and 401 for invalid/expired tokens.
- Controllers handle validation, persistence, and standardized success/error responses with appropriate HTTP status codes.
- Global environment variables drive secrets and service configurations.

```mermaid
flowchart TD
Req["Request Received"] --> Route["Route Handler"]
Route --> MW["Auth Middleware"]
MW --> |Missing/Invalid| E403["403 Forbidden"]
MW --> |Valid| Ctrl["Controller Logic"]
Ctrl --> TryBlock{"Try Block"}
TryBlock --> |Success| OK["2xx Response"]
TryBlock --> |Error| Err["500 Internal Server Error"]
```

**Diagram sources**
- [Auth.js](file://backend/Middlewares/Auth.js#L3-L18)
- [AuthController.js](file://backend/Controllers/AuthController.js#L49-L101)
- [AuthController.js](file://backend/Controllers/AuthController.js#L105-L155)

**Section sources**
- [Auth.js](file://backend/Middlewares/Auth.js#L1-L19)
- [AuthController.js](file://backend/Controllers/AuthController.js#L49-L155)

### Database Connection with MongoDB and Mongoose
- Connection function attempts to connect using MONGO_URI from environment.
- Models define schemas for Users, UserProfile, and EnergyListing.
- Seed script demonstrates population of demo data and clearing existing listings.

```mermaid
classDiagram
class Users {
+String name
+String email
+String password
+String userType
+Boolean onboardingCompleted
+Date createdAt
}
class UserProfile {
+ObjectId user
+String location
+Number energyUsage
+Boolean hasSolarPanels
+String walletAddress
}
class EnergyListing {
+String title
+String location
+String capacity
+Number price
+String category
+String icon
+String energySource
+Array certifications
+String availability
+ObjectId producer
+Date createdAt
}
Users "1" <-- "1" UserProfile : "ref"
Users "1" <-- "many" EnergyListing : "producer"
```

**Diagram sources**
- [Users.js](file://backend/Models/Users.js#L1-L32)
- [UserProfile.js](file://backend/Models/UserProfile.js#L1-L31)
- [EnergyListing.js](file://backend/Models/EnergyListing.js#L1-L56)

**Section sources**
- [db.js](file://backend/DB/db.js#L1-L12)
- [Users.js](file://backend/Models/Users.js#L1-L32)
- [UserProfile.js](file://backend/Models/UserProfile.js#L1-L31)
- [EnergyListing.js](file://backend/Models/EnergyListing.js#L1-L56)
- [seed.js](file://backend/seed.js#L1-L169)

### Socket.IO Integration for Real-Time Communication
- Socket.IO server bound to HTTP server with CORS configuration.
- Rooms:
  - User-specific room keyed by user ID.
  - Marketplace room for listing updates.
  - Energy updates room for real-time metrics.
- Events:
  - join-user-room(userId)
  - join-marketplace()
  - subscribe-energy-data()
  - energy-data payload emitted periodically to energy-updates room.

```mermaid
sequenceDiagram
participant FE as "Frontend Client"
participant IO as "Socket.IO Server"
participant Room as "Rooms"
FE->>IO : "join-user-room(userId)"
IO->>Room : "Join user-{userId}"
FE->>IO : "join-marketplace()"
IO->>Room : "Join marketplace"
FE->>IO : "subscribe-energy-data()"
IO->>Room : "Join energy-updates"
loop Every 10s
IO->>Room : "Emit energy-data"
end
```

**Diagram sources**
- [index.js](file://backend/index.js#L48-L89)

**Section sources**
- [index.js](file://backend/index.js#L18-L89)

### Environment Configuration, CORS, and Security Headers
- Environment variables include port, MongoDB URI, JWT secret, email service credentials, reCAPTCHA secret, and Google OAuth client credentials.
- CORS enabled for development origin with credentials support.
- Authentication middleware enforces Bearer token presence and validity.

```mermaid
flowchart TD
LoadEnv["Load .env"] --> SetPort["Set PORT"]
LoadEnv --> SetMongo["Set MONGO_URI"]
LoadEnv --> SetJWT["Set JWT_SECRET"]
LoadEnv --> SetEmail["Set EMAIL_*"]
LoadEnv --> SetRecap["Set RECAPTCHA_SECRET_KEY"]
LoadEnv --> SetGoogle["Set GOOGLE_CLIENT_ID/_SECRET"]
SetPort --> Server["Start Server"]
SetMongo --> DBConn["Connect DB"]
SetJWT --> AuthMW["Auth Middleware"]
```

**Diagram sources**
- [.env](file://backend/.env#L1-L13)
- [index.js](file://backend/index.js#L29-L35)
- [Auth.js](file://backend/Middlewares/Auth.js#L10-L12)

**Section sources**
- [.env](file://backend/.env#L1-L13)
- [index.js](file://backend/index.js#L29-L35)
- [Auth.js](file://backend/Middlewares/Auth.js#L1-L19)

### Health Checks and Monitoring Setup
- Basic health indicator: root GET endpoint returns a simple message.
- Periodic emission of simulated energy data for real-time monitoring.
- Logging of connection/disconnection events and room joins.

Recommended additions (conceptual):
- Dedicated /health endpoint returning status and uptime.
- Metrics exposure via Prometheus-compatible endpoint.
- Winston or similar logger for structured logs.

**Section sources**
- [index.js](file://backend/index.js#L40-L40)
- [index.js](file://backend/index.js#L76-L89)

### Performance Optimization and Resource Cleanup
- Connection pooling: Mongoose manages pools by default; tune options via connection config if needed.
- Request timeout: Configure Express timeout middleware for long-running requests.
- Resource cleanup: Close Socket.IO gracefully on shutdown signals; ensure database disconnect on process exit.

[No sources needed since this section provides general guidance]

## Dependency Analysis
External dependencies include Express, Socket.IO, Mongoose, JWT, bcrypt, body-parser, cookie-parser, cors, dotenv, nodemailer, axios, and google-auth-library. The application uses ES modules with type set to module.

```mermaid
graph TB
P["package.json"]
E["express"]
S["socket.io"]
M["mongoose"]
J["jsonwebtoken"]
B["bcryptjs"]
BP["body-parser"]
CP["cookie-parser"]
C["cors"]
D["dotenv"]
N["nodemailer"]
AX["axios"]
G["google-auth-library"]
P --> E
P --> S
P --> M
P --> J
P --> B
P --> BP
P --> CP
P --> C
P --> D
P --> N
P --> AX
P --> G
```

**Diagram sources**
- [package.json](file://backend/package.json#L13-L26)

**Section sources**
- [package.json](file://backend/package.json#L1-L29)

## Performance Considerations
- Enable compression for responses.
- Use pagination for listing endpoints.
- Index frequently queried fields in MongoDB.
- Implement rate limiting for authentication endpoints.
- Tune Socket.IO transports and ping intervals for production.
- Monitor memory usage and restart unhealthy processes.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common issues and remedies:
- Database connection failures: Verify MONGO_URI and network access; check connection logs.
- Authentication errors: Confirm Authorization header format and JWT_SECRET correctness.
- CORS errors: Ensure frontend origin matches configured origin and credentials are enabled.
- Socket.IO disconnections: Validate client-side room joins and event names.
- Environment variable mismatches: Confirm .env values and dotenv loading order.

**Section sources**
- [db.js](file://backend/DB/db.js#L3-L10)
- [Auth.js](file://backend/Middlewares/Auth.js#L3-L18)
- [index.js](file://backend/index.js#L29-L35)
- [index.js](file://backend/index.js#L48-L73)

## Conclusion
The backend provides a modular, layered architecture with clear separation of concerns. It integrates Express for routing, Mongoose for MongoDB persistence, Socket.IO for real-time features, and JWT for authentication. The design supports RESTful APIs, robust error handling, and extensible middleware. With proper environment configuration, monitoring, and performance tuning, the system can scale effectively.

## Appendices
- Authentication flow highlights:
  - Registration validates reCAPTCHA and user type, hashes password, and persists user.
  - Login verifies credentials, reCAPTCHA, and issues signed JWT.
  - Profile endpoints require authenticated sessions.

**Section sources**
- [AuthController.js](file://backend/Controllers/AuthController.js#L49-L155)
- [Auth.js](file://backend/Middlewares/Auth.js#L1-L19)
- [googleConfig.js](file://backend/utils/googleConfig.js#L1-L14)