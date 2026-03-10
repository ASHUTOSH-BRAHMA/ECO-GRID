# Frontend Application

<cite>
**Referenced Files in This Document**
- [App.jsx](file://frontend/src/App.jsx)
- [main.jsx](file://frontend/src/main.jsx)
- [AuthContext.jsx](file://frontend/src/Context/AuthContext.jsx)
- [api.js](file://frontend/src/api.js)
- [package.json](file://frontend/package.json)
- [Dashboard.jsx](file://frontend/src/frontend/Dashboard.jsx)
- [EnergyForecast.jsx](file://frontend/src/frontend/EnergyForecast.jsx)
- [Marketplace.jsx](file://frontend/src/frontend/Marketplace.jsx)
- [NavBar.jsx](file://frontend/src/frontend/NavBar.jsx)
- [useSocket.js](file://frontend/src/hooks/useSocket.js)
- [TradeModal.jsx](file://frontend/src/components/TradeModal.jsx)
- [blockchain.js](file://frontend/src/services/blockchain.js)
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

## Introduction
This document explains the React-based EcoGrid frontend application. It covers the component architecture, state management with the Context API, routing, authentication with JWT tokens and protected routes, real-time monitoring and visualization dashboards, the marketplace interface for energy trading, forecasting integration with Python ML services, responsive design with Tailwind CSS, component composition patterns, event handling strategies, and real-time communication via Socket.IO.

## Project Structure
The frontend is a Vite-powered React application with:
- A strict provider hierarchy rooted in main.jsx
- Centralized authentication via AuthContext
- Route-based navigation with private route protection
- Feature pages for dashboard, forecasting, marketplace, and shared UI components
- Real-time integrations via Socket.IO and blockchain services

```mermaid
graph TB
subgraph "Runtime"
M["main.jsx<br/>Root render"]
A["App.jsx<br/>Routing + PrivateRoute"]
NC["NavBar.jsx<br/>Header + Auth UI"]
end
subgraph "Auth"
AC["AuthContext.jsx<br/>JWT-based auth state"]
end
subgraph "Pages"
D["Dashboard.jsx<br/>Real-time charts + tiles"]
F["EnergyForecast.jsx<br/>ML forecasts + weather"]
MP["Marketplace.jsx<br/>Listings + analytics"]
end
subgraph "Integrations"
WS["useSocket.js<br/>Socket.IO client"]
BL["blockchain.js<br/>Ethers + contracts"]
AX["api.js<br/>Google OAuth helper"]
end
M --> A
A --> NC
A --> D
A --> F
A --> MP
A --> AC
D --> WS
MP --> BL
MP --> WS
AX --> A
```

**Diagram sources**
- [main.jsx](file://frontend/src/main.jsx#L8-L14)
- [App.jsx](file://frontend/src/App.jsx#L20-L77)
- [AuthContext.jsx](file://frontend/src/Context/AuthContext.jsx#L7-L53)
- [Dashboard.jsx](file://frontend/src/frontend/Dashboard.jsx#L25-L131)
- [EnergyForecast.jsx](file://frontend/src/frontend/EnergyForecast.jsx#L80-L178)
- [Marketplace.jsx](file://frontend/src/frontend/Marketplace.jsx#L8-L115)
- [useSocket.js](file://frontend/src/hooks/useSocket.js#L6-L88)
- [blockchain.js](file://frontend/src/services/blockchain.js#L42-L101)
- [api.js](file://frontend/src/api.js#L7-L10)

**Section sources**
- [main.jsx](file://frontend/src/main.jsx#L8-L14)
- [App.jsx](file://frontend/src/App.jsx#L20-L77)

## Core Components
- App: Declares routes, defines a PrivateRoute wrapper, and renders pages. Uses AuthContext to gate protected routes.
- AuthContext: Centralizes authentication state, loads user profile via JWT, and exposes loading state.
- NavBar: Provides navigation, scroll-aware styling, and user dropdown with logout.
- Dashboard: Real-time energy visualization, user tiles, and live meter updates via Socket.IO.
- EnergyForecast: Live ML predictions and demand forecasting with weather integration.
- Marketplace: Listings browsing, filtering, analytics for prosumers, and trade modal with blockchain integration.
- useSocket: Hook encapsulating Socket.IO connection, subscriptions, and notifications.
- TradeModal: Wallet connection, dynamic pricing, and on-chain purchase flow.
- blockchain.js: Ethers-based service for wallet connect, balances, dynamic pricing, and contract interactions.
- api.js: Helper for Google OAuth code exchange.

**Section sources**
- [App.jsx](file://frontend/src/App.jsx#L38-L47)
- [AuthContext.jsx](file://frontend/src/Context/AuthContext.jsx#L7-L53)
- [NavBar.jsx](file://frontend/src/frontend/NavBar.jsx#L21-L66)
- [Dashboard.jsx](file://frontend/src/frontend/Dashboard.jsx#L25-L131)
- [EnergyForecast.jsx](file://frontend/src/frontend/EnergyForecast.jsx#L80-L178)
- [Marketplace.jsx](file://frontend/src/frontend/Marketplace.jsx#L8-L115)
- [useSocket.js](file://frontend/src/hooks/useSocket.js#L6-L88)
- [TradeModal.jsx](file://frontend/src/components/TradeModal.jsx#L6-L80)
- [blockchain.js](file://frontend/src/services/blockchain.js#L42-L101)
- [api.js](file://frontend/src/api.js#L7-L10)

## Architecture Overview
The application follows a layered architecture:
- Presentation layer: Pages and shared UI components
- State layer: AuthContext for JWT-based authentication
- Integration layer: Socket.IO for real-time updates, Ethers for blockchain, Axios for HTTP
- Routing layer: React Router DOM with private route protection

```mermaid
graph TB
subgraph "Presentation"
P1["NavBar"]
P2["Dashboard"]
P3["EnergyForecast"]
P4["Marketplace"]
P5["TradeModal"]
end
subgraph "State"
S1["AuthContext"]
end
subgraph "Integration"
I1["Socket.IO Client (useSocket)"]
I2["Ethers + Contracts (blockchain.js)"]
I3["HTTP (Axios)"]
end
P1 --> S1
P2 --> S1
P3 --> S1
P4 --> S1
P5 --> S1
P2 --> I1
P4 --> I1
P5 --> I2
P1 --> I3
P2 --> I3
P3 --> I3
P4 --> I3
```

**Diagram sources**
- [NavBar.jsx](file://frontend/src/frontend/NavBar.jsx#L27-L28)
- [Dashboard.jsx](file://frontend/src/frontend/Dashboard.jsx#L28-L29)
- [EnergyForecast.jsx](file://frontend/src/frontend/EnergyForecast.jsx#L100-L178)
- [Marketplace.jsx](file://frontend/src/frontend/Marketplace.jsx#L8-L115)
- [useSocket.js](file://frontend/src/hooks/useSocket.js#L12-L88)
- [TradeModal.jsx](file://frontend/src/components/TradeModal.jsx#L6-L17)
- [blockchain.js](file://frontend/src/services/blockchain.js#L42-L101)
- [AuthContext.jsx](file://frontend/src/Context/AuthContext.jsx#L12-L46)

## Detailed Component Analysis

### Authentication and Protected Routes
- AuthContext initializes an Axios instance with credentials and loads user profile using a stored JWT token.
- App wraps protected routes with a PrivateRoute that checks authentication and redirects unauthenticated users to the home page with a toast prompt.
- NavBar handles logout by clearing tokens and updating context state.

```mermaid
sequenceDiagram
participant U as "User"
participant R as "App/PrivateRoute"
participant C as "AuthContext"
participant B as "Backend"
U->>R : Navigate to protected route
R->>C : Read isAuthenticated
alt Not authenticated
R-->>U : Redirect to "/"
R-->>U : Show "Please login" toast
else Authenticated
R-->>U : Render protected page
U->>C : On mount, fetch user via token
C->>B : GET /user/profile (with Bearer token)
B-->>C : User profile
C-->>R : Update context state
end
```

**Diagram sources**
- [App.jsx](file://frontend/src/App.jsx#L38-L47)
- [AuthContext.jsx](file://frontend/src/Context/AuthContext.jsx#L17-L46)
- [NavBar.jsx](file://frontend/src/frontend/NavBar.jsx#L46-L66)

**Section sources**
- [AuthContext.jsx](file://frontend/src/Context/AuthContext.jsx#L7-L53)
- [App.jsx](file://frontend/src/App.jsx#L38-L47)
- [NavBar.jsx](file://frontend/src/frontend/NavBar.jsx#L46-L66)

### Dashboard: Real-Time Monitoring and Visualization
- Dashboard displays user tiles (usage, sold/purchased kWh, buyers/sellers), live smart meter data, and energy pricing controls.
- Real-time updates are received via Socket.IO; the chart auto-scrolls to maintain a rolling window of the latest 10 data points.
- Historical data is fetched on mount to seed the chart.

```mermaid
sequenceDiagram
participant D as "Dashboard"
participant S as "useSocket"
participant B as "Backend"
participant U as "User"
D->>S : subscribeToEnergyData()
S->>B : Emit "subscribe-energy-data"
B-->>S : "energy-data" events
S-->>D : energyData update
D->>D : Append new point to chart data
D-->>U : Re-render chart with live data
```

**Diagram sources**
- [Dashboard.jsx](file://frontend/src/frontend/Dashboard.jsx#L80-L125)
- [useSocket.js](file://frontend/src/hooks/useSocket.js#L104-L109)

**Section sources**
- [Dashboard.jsx](file://frontend/src/frontend/Dashboard.jsx#L25-L131)
- [useSocket.js](file://frontend/src/hooks/useSocket.js#L6-L88)

### Energy Forecasting: ML Integration
- Two tabs: Live ML Predictions and Demand Forecast.
- Live tab integrates with a Flask ML service (/predict) for hourly/daily production, demand, surplus, and pricing.
- Demand tab integrates with a Python ML service (/api/forecast) to generate plots and peak alerts.
- Weather integration enriches predictions; geolocation detection is supported.

```mermaid
flowchart TD
Start(["Open EnergyForecast"]) --> Tab{"Active Tab"}
Tab --> |Live ML Predictions| Live["Fetch /predict (Flask)"]
Tab --> |Demand Forecast| Demand["Fetch /api/forecast (Python)"]
Live --> RenderLive["Render stats + charts"]
Demand --> RenderDemand["Render plot + alerts"]
RenderLive --> End(["Done"])
RenderDemand --> End
```

**Diagram sources**
- [EnergyForecast.jsx](file://frontend/src/frontend/EnergyForecast.jsx#L80-L178)
- [EnergyForecast.jsx](file://frontend/src/frontend/EnergyForecast.jsx#L152-L173)

**Section sources**
- [EnergyForecast.jsx](file://frontend/src/frontend/EnergyForecast.jsx#L80-L178)

### Marketplace: Trading and Listings
- Marketplace supports browsing, filtering, and searching listings.
- Prosumers can manage their listings (create, edit, delete) and view analytics and transaction history.
- TradeModal enables wallet connection, dynamic pricing calculation, and on-chain purchase via blockchain service.
- Real-time notifications for listings, trades, and price updates are handled via Socket.IO.

```mermaid
sequenceDiagram
participant U as "User"
participant MP as "Marketplace"
participant TM as "TradeModal"
participant BL as "blockchain.js"
participant WS as "useSocket"
participant BE as "Backend"
U->>MP : Click "Trade Energy"
MP->>TM : Open modal with selected listing
TM->>BL : connect() if needed
TM->>BL : getDynamicPrice(amount)
TM->>BL : buyEnergy(amount)
BL-->>TM : txHash
TM->>BE : POST /transactions (with JWT)
BE-->>TM : Acknowledge
TM-->>MP : onTradeComplete(txHash)
WS-->>MP : "trade-completed" notification
```

**Diagram sources**
- [Marketplace.jsx](file://frontend/src/frontend/Marketplace.jsx#L780-L814)
- [TradeModal.jsx](file://frontend/src/components/TradeModal.jsx#L39-L80)
- [blockchain.js](file://frontend/src/services/blockchain.js#L164-L176)
- [useSocket.js](file://frontend/src/hooks/useSocket.js#L62-L82)

**Section sources**
- [Marketplace.jsx](file://frontend/src/frontend/Marketplace.jsx#L8-L115)
- [TradeModal.jsx](file://frontend/src/components/TradeModal.jsx#L6-L80)
- [blockchain.js](file://frontend/src/services/blockchain.js#L42-L101)
- [useSocket.js](file://frontend/src/hooks/useSocket.js#L6-L88)

### Real-Time Communication with Socket.IO
- useSocket manages connection lifecycle, event listeners, and subscription helpers.
- Components can join rooms and subscribe to topics (e.g., energy data, marketplace, user-specific updates).
- Notifications are accumulated and surfaced to users.

```mermaid
flowchart TD
Init["Initialize socket"] --> Events["Attach listeners:<br/>connect/disconnect/connect_error<br/>energy-data<br/>listing-created/updated<br/>trade-completed<br/>price-update"]
Events --> Rooms["join-user-room(userId)<br/>join-marketplace()"]
Rooms --> Subscribe["subscribe-to-energy-data()"]
Subscribe --> Cleanup["Disconnect on unmount"]
```

**Diagram sources**
- [useSocket.js](file://frontend/src/hooks/useSocket.js#L12-L88)

**Section sources**
- [useSocket.js](file://frontend/src/hooks/useSocket.js#L6-L88)

### Responsive Design and Tailwind CSS
- Mobile-first approach with responsive grids and spacing.
- Motion animations via Framer Motion enhance UX transitions.
- Tailwind utilities define gradients, shadows, and responsive breakpoints across components.

[No sources needed since this section provides general guidance]

## Dependency Analysis
- Runtime dependencies include React, React Router DOM, Axios, Socket.IO client, Recharts, Tailwind CSS, and Ethers.
- Internal dependencies:
  - App depends on AuthContext and NavBar
  - Dashboard and Marketplace depend on useSocket
  - TradeModal depends on blockchain service
  - api.js provides Google OAuth integration

```mermaid
graph LR
Pkg["package.json"] --> RR["react-router-dom"]
Pkg --> AX["axios"]
Pkg --> SO["socket.io-client"]
Pkg --> RC["recharts"]
Pkg --> FW["framer-motion"]
Pkg --> ET["ethers"]
App["App.jsx"] --> RR
App --> AX
App --> NC["NavBar.jsx"]
App --> AC["AuthContext.jsx"]
Dash["Dashboard.jsx"] --> SO
Dash --> AX
MP["Marketplace.jsx"] --> SO
MP --> AX
TM["TradeModal.jsx"] --> ET
TM --> AX
AF["api.js"] --> AX
```

**Diagram sources**
- [package.json](file://frontend/package.json#L12-L32)
- [App.jsx](file://frontend/src/App.jsx#L1-L18)
- [Dashboard.jsx](file://frontend/src/frontend/Dashboard.jsx#L1-L25)
- [Marketplace.jsx](file://frontend/src/frontend/Marketplace.jsx#L1-L6)
- [TradeModal.jsx](file://frontend/src/components/TradeModal.jsx#L1-L5)
- [api.js](file://frontend/src/api.js#L1-L10)

**Section sources**
- [package.json](file://frontend/package.json#L12-L32)

## Performance Considerations
- Prefer lazy loading for heavy pages (e.g., forecasting) to reduce initial bundle size.
- Debounce or throttle real-time chart updates to avoid excessive re-renders.
- Use virtualized lists for large transaction/history tables.
- Cache frequently accessed data (e.g., user profile, listings) to minimize API calls.
- Optimize image assets and leverage SVGs for icons.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
- Authentication issues:
  - Verify token presence in local/session storage and expiration.
  - Check backend CORS and credential handling for Axios.
- Socket.IO errors:
  - Inspect connection events and logs; ensure server URL matches environment.
  - Confirm rooms and subscriptions are emitted after connection.
- Blockchain integration:
  - Ensure MetaMask is installed and on the correct network (Polygon Amoy).
  - Verify contract addresses are configured in environment variables.
- API failures:
  - Confirm base URLs and headers; handle 401/403 gracefully with redirects.

**Section sources**
- [AuthContext.jsx](file://frontend/src/Context/AuthContext.jsx#L17-L46)
- [useSocket.js](file://frontend/src/hooks/useSocket.js#L12-L34)
- [blockchain.js](file://frontend/src/services/blockchain.js#L52-L101)

## Conclusion
EcoGrid’s frontend combines robust state management, secure routing, real-time updates, and blockchain integration to deliver a modern, responsive energy trading platform. The modular component architecture and clear separation of concerns enable maintainability and scalability as new features are introduced.