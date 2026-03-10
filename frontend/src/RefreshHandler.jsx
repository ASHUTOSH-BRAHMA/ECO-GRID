import { useContext, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "./Context/AuthContext.jsx";

const RefreshHandler = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated } = useContext(AuthContext);
    
    // Use a ref to track if this is the initial login
    const isInitialMount = useRef(true);
    const lastPathRef = useRef(location.pathname);
    
    useEffect(() => {
        // Skip check on initial mount
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }
        
        // Skip the check if we're in the process of navigating away from login/register
        if ((lastPathRef.current === "/login" || lastPathRef.current === "/register") && 
            location.pathname !== "/login" && location.pathname !== "/register") {
            return;
        }
        
        // Update the last path for future comparisons
        lastPathRef.current = location.pathname;
        
        // Only check if actively navigating TO login/register from another page
        if (isAuthenticated && (location.pathname === "/login" || location.pathname === "/register")) {
            // Ensure user is redirected properly
            navigate("/dashboard"); // Redirect to dashboard instead of login/register
        }
    }, [isAuthenticated, location.pathname, navigate]);
    
    return null;
};

export default RefreshHandler;
