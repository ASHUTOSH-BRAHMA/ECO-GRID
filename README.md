# EcoGrid - Sustainable Energy Management Platform

EcoGrid is a web application for sustainable energy management, forecasting, and marketplace trading. This will provide you an overview of the project structure and the key components.

## Project Structure
```
ecogrid/
├── backend/                        # Backend server code
│   ├── Controllers/                 # Request handlers
│   │   └── AuthController.js          # Authentication and user profile logic
│   ├── DB/                          # Database connection
│   │   └── db.js                      # MongoDB connection setup
│   ├── Middlewares/                 # Express middlewares
│   │   └── Auth.js                    # JWT authentication middleware
│   ├── Models/                      # Mongoose data models
│   │   ├── UserProfile.js             # User profile data schema
│   │   └── Users.js                   # User authentication schema
│   ├── Routes/                      # API route definitions
│   │   └── AuthRouter.js              # Authentication routes
│   ├── .env                         # Environment variables (not tracked in git)
│   ├── .gitignore                   # Git ignore file
│   ├── index.js                     # Main server entry point
│   └── package.json                 # Node.js dependencies
│
├── frontend/
│   ├── public/              # Static assets
│   ├── pythonfiles/         # Energy forecasting Python backend
│   │   ├── app.py            # Flask API for forecasting
│   │   ├── model.py          # Energy forecasting model
│   │   └── routes.py         # Flask API routes
│   ├── src/
│   │   ├── assets/           # Images and static resources
│   │   ├── Context/          # React context providers
│   │   │   └── AuthContext.jsx # Authentication state management
│   │   ├── frontend/         # Main application components
│   │   │   ├── AboutUs.jsx     # About page
│   │   │   ├── Blog.jsx        # Blog page
│   │   │   ├── Dashboard.jsx   # User dashboard
│   │   │   ├── Forecasting.jsx # Energy forecasting page
│   │   │   ├── HomePage.jsx    # Landing page
│   │   │   ├── Loginpage.jsx   # Authentication page
│   │   │   ├── Marketplace.jsx # Energy trading marketplace
│   │   │   ├── NavBar.jsx      # Navigation component
│   │   │   └── Profile.jsx     # User profile page
│   │   ├── App.jsx           # Main application component
│   │   ├── RefreshHandler.jsx # Authentication refresh logic
│   │   └── main.jsx          # Application entry point
│   ├── .env                 # Environment variables (contains API endpoints)
│   ├── .gitignore           # Git ignore file (needs updating)
│   ├── index.html           # HTML entry point
│   ├── package.json         # Node.js dependencies
│   └── requirements.txt     # Python dependencies for forecasting
│
└── blockchain/
    ├── artifacts/           # Compiled smart contract artifacts
    ├── cache/               # Hardhat cache
    ├── contracts/           # Solidity smart contracts
    │   └── EnergyTrading.sol # Energy token and trading contracts
    ├── scripts/             # Deployment scripts
    │   └── deploy.js         # Contract deployment script
    ├── .env                 # Environment variables (contains private key)
    ├── hardhat.config.js    # Hardhat configuration
    ├── package.json         # Node.js dependencies
    └── README.md            # Blockchain documentation
```

### Root Files
- `.env` - Environment variables configuration (API URL)
- `.gitignore` - Git ignore configuration
- `app.py` - Flask application entry point
- `eslint.config.js` - ESLint configuration for code quality
- `index.html` - Main HTML entry point for the React application
- `model.py` - Energy forecasting model implementation
- `package.json` - NPM package configuration
- `requirements.txt` - Python dependencies
- `routes.py` - Flask API routes

### Source Code (`src/`)

#### Core Files
- `main.jsx` - React application entry point
- `App.jsx` - Main React component with routing
- `RefreshHandler.jsx` - Handles authentication state on page refresh
- `index.css` - Global CSS styles...

#### Context (`src/Context/`)
- `AuthContext.jsx` - Authentication context provider for user sessions

#### Frontend Pages (`src/frontend/`)
- `AboutUs.jsx` - Company information and mission
- `Dashboard.jsx` - User dashboard with energy monitoring
- `Forecasting.jsx` - Energy demand forecasting interface
- `HomePage.jsx` - Landing page
- `Loginpage.jsx` - User login with onboarding flow
- `Marketplace.jsx` - Energy trading marketplace
- `NavBar.jsx` - Navigation component
- `RegisterPage.jsx` - User registration

#### Assets (`src/assets/`)
- `react.svg` - React logo

### Public Assets (`public/`)
- `vite.svg` - Vite logo

### Blockchain Components (`blockchain/`)
- `contracts/EnergyTrading.sol` - Smart contracts for energy token and trading
- `scripts/deploy.js` - Deployment script for smart contracts
- `hardhat.config.js` - Hardhat configuration for blockchain development

## Key Features

1. **Authentication System**
   - User registration and login
   - Profile management
   - Session persistence

2. **Energy Dashboard**
   - Real-time energy monitoring
   - Usage statistics and visualization
   - System settings

3. **Energy Forecasting**
   - AI-driven demand prediction
   - XGBoost model integration
   - Customizable forecast periods

4. **Energy Marketplace**
   - P2P energy trading
   - Real-time energy production data
   - Multiple energy source categories
   - Blockchain-based token system for secure transactions

5. **Responsive Design**
   - Mobile-friendly interface
   - Animated UI components
   - Intuitive navigation

## Technology Stack

### Frontend
- React.js
- Tailwind CSS
- Framer Motion (animations)
- React Router
- Axios (API requests)

### Backend
- Flask (Python)
- XGBoost (ML model)
- Pandas/NumPy (data processing)
- Matplotlib (visualization)

### Blockchain
- Solidity (Smart Contracts)
- Hardhat (Development Framework)
- OpenZeppelin (Contract Libraries)
- Polygon Amoy Testnet

## Getting Started

1. Install dependencies:
   ```
   npm install
   pip install -r requirements.txt
   cd blockchain && npm install
   ```

2. Start the development server:
   ```
   npm run dev
   ```

3. Start the Flask backend:
   ```
   python app.py
   ```

4. Deploy blockchain contracts (requires Polygon Amoy testnet tokens):
   ```
   cd blockchain
   npx hardhat run scripts/deploy.js --network amoy
   ```

## API Endpoints

- `/api/forecast` - Generate energy demand forecasts
- `/api/model-info` - Get information about the forecasting model

## Environment Configuration

The application uses environment variables for configuration:
- `REACT_APP_API_URL` - Backend API URL (default: "http://localhost:8080/api")
- `POLYGON_AMOY_URL` - Polygon Amoy testnet RPC URL
- `PRIVATE_KEY` - Ethereum wallet private key for contract deployment

---
---
---

## Backend Components

### Controllers

- **AuthController.js**: Handles user authentication (signup, login) and profile management. Includes functions for:
  - User registration with different user types (prosumer, consumer, utility)
  - User login with JWT token generation
  - User profile creation and retrieval
  - Onboarding process management

### Database

- **db.js**: Establishes connection to MongoDB using the connection string from environment variables.

### Middlewares

- **Auth.js**: JWT authentication middleware that verifies user tokens and attaches user data to requests.

### Models

- **Users.js**: Defines the user schema with fields for authentication and user type.
  - Includes name, email, password, userType (prosumer/consumer/utility)
  - Tracks onboarding completion status

- **UserProfile.js**: Stores user-specific energy information:
  - Location
  - Energy usage metrics
  - Solar panel availability

### Routes

- **AuthRouter.js**: Defines API endpoints for:
  - User registration (`/api/register`)
  - User login (`/api/login`)
  - Profile management (`/api/user/profile`)

### Server Configuration

- **index.js**: Main application entry point that:
  - Sets up Express server
  - Configures CORS for frontend communication
  - Connects to MongoDB
  - Registers API routes

### Environment Variables

The backend uses the following environment variables:
- `PORT`: Server port (default: 8080)
- `MONGO_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT token generation/validation

## Blockchain Components

### Smart Contracts

- **EnergyToken.sol**: ERC20 token implementation for energy trading
  - Represents energy units as tradable tokens
  - Standard ERC20 functionality (transfer, approve, etc.)

- **EnergyTrading.sol**: Marketplace contract for P2P energy trading
  - Create energy trade listings with amount and price
  - Execute trades between buyers and sellers
  - Track active and completed trades

### Deployment

The blockchain component is deployed on the Polygon Amoy testnet, which requires POL tokens for gas fees.
