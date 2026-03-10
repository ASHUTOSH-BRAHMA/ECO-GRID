import { createContext, useMemo, useState, useEffect } from "react";
import axios from "axios";
import { handleerror } from "../../utils";
import { API_BASE_URL } from "../config";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const api = useMemo(() => axios.create({
        baseURL: API_BASE_URL,
        withCredentials: true
    }), []);

    const clearAuthStorage = () => {
        localStorage.removeItem("authToken");
        sessionStorage.removeItem("authToken");
    };

    const login = ({ token, persist = true, userData = null, user: userCompat = null }) => {
        if (!token || token === "undefined" || token === "null") return;
        if (persist) localStorage.setItem("authToken", token);
        else sessionStorage.setItem("authToken", token);
        const resolvedUser = userData || userCompat;
        if (resolvedUser) setUser(resolvedUser);
        setIsAuthenticated(true);
    };

    const logout = () => {
        clearAuthStorage();
        setUser(null);
        setIsAuthenticated(false);
    };

    useEffect(() => {
        const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");

        const fetchUser = async () => {
            setIsLoading(true);
            try {
                if (token && token !== "undefined" && token !== "null") {
                    const response = await api.get('/user/profile', {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setUser(response.data);
                    setIsAuthenticated(true);
                } else {
                    setIsAuthenticated(false);
                }
            } catch (error) {
                console.error('Error fetching user');
                setUser(null)
                handleerror("Error fetching user details");
                setIsAuthenticated(false);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUser();
    }, [api]);

    return (
        <AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated, user, setUser, isLoading, login, logout }}>
            {isLoading ? <LoadingScreen /> : children}
        </AuthContext.Provider>
    );
};

// 🔥 Custom Sexy Loading Screen
const LoadingScreen = () => {
    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-900">
            <div className="flex flex-col items-center">
                {/* Animated Gradient Text */}
                <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 animate-pulse">
                    Authenticating...
                </h2>
                {/* Cool Spinning Loader */}
                <div className="mt-6 w-16 h-16 border-4 border-t-transparent border-blue-500 rounded-full animate-spin"></div>
            </div>
        </div>
    );
};
