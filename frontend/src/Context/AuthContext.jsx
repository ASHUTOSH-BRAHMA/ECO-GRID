import { createContext, useMemo, useState, useEffect } from "react";
import axios from "axios";
import { handleerror } from "../../utils";
import { API_BASE_URL } from "../config";

export const AuthContext = createContext();

/**
 * Normalises whatever shape the backend returns into a consistent object:
 *   { _id, name, email, userType, onboardingCompleted, ... }
 *
 * Two possible incoming shapes:
 *  A) From /user/profile  → { location, energyUsage, ..., user: { _id, email, ... } }
 *  B) From /auth/google or login → { _id, email, userType, name, ... }  (flat User doc)
 */
const normalizeUser = (data) => {
    if (!data) return null;
    // Shape A – UserProfile doc with populated .user reference
    if (data.user && typeof data.user === "object" && data.user.email) {
        return {
            // Spread the nested User doc fields first …
            ...data.user,
            // … then attach the profile-level fields under a `profile` key
            profile: {
                location: data.location,
                energyUsage: data.energyUsage,
                hasSolarPanels: data.hasSolarPanels,
                energySources: data.energySources,
                walletAddress: data.walletAddress,
                forecastEngine: data.forecastEngine,
                forecastZone: data.forecastZone,
            },
        };
    }
    // Shape B – flat User doc (Google / JWT login response)
    return data;
};

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);          // always normalised shape
    const [isLoading, setIsLoading] = useState(true);

    const api = useMemo(() => axios.create({
        baseURL: API_BASE_URL,
        withCredentials: true,
    }), []);

    const clearAuthStorage = () => {
        localStorage.removeItem("authToken");
        sessionStorage.removeItem("authToken");
    };

    /**
     * Call this after any successful login (email/password or Google).
     * Accepts the same payload shapes both callers already pass.
     */
    const login = ({ token, persist = true, userData = null, user: userCompat = null }) => {
        if (!token || token === "undefined" || token === "null") return;
        clearAuthStorage();
        if (persist) localStorage.setItem("authToken", token);
        else sessionStorage.setItem("authToken", token);

        const resolvedUser = userData || userCompat;
        if (resolvedUser) setUser(normalizeUser(resolvedUser));
        setIsAuthenticated(true);
    };

    const logout = () => {
        clearAuthStorage();
        setUser(null);
        setIsAuthenticated(false);
    };

    // On mount: verify stored token and hydrate user from profile endpoint
    useEffect(() => {
        const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");

        const fetchUser = async () => {
            setIsLoading(true);
            try {
                if (token && token !== "undefined" && token !== "null") {
                    const response = await api.get("/user/profile", {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    // Normalise so the rest of the app always sees the same shape
                    setUser(normalizeUser(response.data));
                    setIsAuthenticated(true);
                } else {
                    setUser(null);
                    setIsAuthenticated(false);
                }
            } catch (error) {
                console.error("Error fetching user", error);
                setUser(null);
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

const LoadingScreen = () => (
    <div className="flex justify-center items-center min-h-screen bg-gray-900">
        <div className="flex flex-col items-center">
            <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 animate-pulse">
                Authenticating...
            </h2>
            <div className="mt-6 w-16 h-16 border-4 border-t-transparent border-blue-500 rounded-full animate-spin" />
        </div>
    </div>
);
