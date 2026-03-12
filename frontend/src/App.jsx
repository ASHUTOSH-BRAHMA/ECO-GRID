import React, { useState, useEffect, useContext } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./frontend/HomePage";
import LoginPage from "./frontend/Loginpage";
import RegisterPage from "./frontend/RegisterPage";
import Dashboard from "./frontend/Dashboard";
import ConsumerDashboard from "./frontend/ConsumerDashboard";
import UtilityDashboard from "./frontend/UtilityDashboard";
import AboutUs from "./frontend/AboutUs";
import RefreshHandler from "./RefreshHandler";
import Blog from "./frontend/Blog";
import { AuthContext } from "./Context/AuthContext";
import EnergyForecast from "./frontend/EnergyForecast"; // ← New unified page
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import MarketplacePage from "./frontend/Marketplace";
import Profile from "./frontend/Profile";
import ForgotPasswordPage from "./frontend/Forgotpassword";
import NotFound from "./frontend/NotFound";
import PricingPage from "./frontend/Pricingpage";
import OnboardingPage from "./frontend/OnboardingPage";
import NotificationSystem from "./components/NotificationSystem";
import { handlesuccess, intermediate } from "../utils";
import useBlockchain from "./hooks/useBlockchain";

const BlockchainEventListener = () => {
  const { isConnected, subscribeToEnergyEvents, unsubscribeFromEnergyEvents } = useBlockchain();

  useEffect(() => {
    if (isConnected) {
      subscribeToEnergyEvents(
        (boughtEvent) => {
          if (window.addNotification) {
            window.addNotification({
              type: 'success',
              title: 'Global Network Trade',
              description: `Network Address ${boughtEvent.buyer.slice(0,6)}... just bought ${boughtEvent.amount} kWh of energy!`,
            });
          }
        },
        (soldEvent) => {
          if (window.addNotification) {
             window.addNotification({
              type: 'trade',
              title: 'Global Network Trade',
              description: `Network Address ${soldEvent.seller.slice(0,6)}... just sold ${soldEvent.amount} kWh of energy!`,
            });
          }
        }
      );
    }
    return () => {
      unsubscribeFromEnergyEvents();
    };
  }, [isConnected, subscribeToEnergyEvents, unsubscribeFromEnergyEvents]);

  return null;
}

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated, user } = useContext(AuthContext);

  useEffect(() => {
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  const getUserType = () => user?.user?.userType || user?.userType || null;
  const needsOnboarding = isAuthenticated && user && !(user?.onboardingCompleted ?? user?.user?.onboardingCompleted ?? false);

  const getDashboardPath = (type) => {
    if (type === "consumer") return "/consumer-dashboard";
    if (type === "utility") return "/utility-dashboard";
    return "/dashboard";
  };

  // Redirect /dashboard to the role-specific dashboard
  const DashboardRoute = () => {
    const type = getUserType();
    if (!isAuthenticated) {
      if (sessionStorage.getItem("justLoggedOut") !== "true") intermediate("Pls Login to access the page");
      return <Navigate to="/" />;
    }
    if (needsOnboarding) return <Navigate to="/onboarding" replace />;
    if (type === "consumer") return <Navigate to={getDashboardPath(type)} replace />;
    if (type === "utility") return <Navigate to={getDashboardPath(type)} replace />;
    return <Dashboard />; // prosumer / default
  };

  const PrivateRoute = ({ element, allowedTypes = null, allowIncomplete = false }) => {
    const type = getUserType();
    if (!isAuthenticated) {
      if (sessionStorage.getItem("justLoggedOut") !== "true") intermediate("Pls Login to access the page");
      return <Navigate to="/" />;
    }
    if (!allowIncomplete && needsOnboarding) {
      return <Navigate to="/onboarding" replace />;
    }
    // If the route is type-restricted and user is wrong type, send to their dashboard
    if (allowedTypes && !allowedTypes.includes(type)) {
      return <Navigate to={getDashboardPath(type)} replace />;
    }
    return element;
  };

  return (
    <>
      <Router>
        <ToastContainer
          theme="dark"
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          pauseOnHover
          toastStyle={{
            background: "#0c0f1a",
            border: "1px solid #1e2440",
            color: "#e8eaf6",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "13px",
            borderRadius: "6px",
          }}
        />
        <NotificationSystem />
        <BlockchainEventListener />
        <RefreshHandler />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/onboarding" element={<PrivateRoute element={<OnboardingPage />} allowIncomplete />} />
          <Route path="/dashboard" element={<DashboardRoute />} />
          <Route path="/consumer-dashboard" element={<PrivateRoute element={<ConsumerDashboard />} allowedTypes={["consumer"]} />} />
          <Route path="/utility-dashboard" element={<PrivateRoute element={<UtilityDashboard />} allowedTypes={["utility"]} />} />
          <Route path="/about" element={<AboutUs />} />

          {/* Unified Energy Forecast page — covers both /forecast and /prosumer */}
          <Route path="/forecast" element={<PrivateRoute element={<EnergyForecast />} />} />
          <Route path="/prosumer" element={<PrivateRoute element={<EnergyForecast />} />} />

          <Route path="/marketplace" element={<MarketplacePage />} />
          <Route path="/profile" element={<PrivateRoute element={<Profile />} />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/pricing" element={<PricingPage />} />

          {/* Catch-all — custom 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
