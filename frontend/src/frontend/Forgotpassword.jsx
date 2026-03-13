import React, { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { handlesuccess } from "../../utils";
import { API_BASE_URL } from "../config";

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [emailSent, setEmailSent] = useState(false);
    
    const navigate = useNavigate();
    const api = axios.create({
        baseURL: API_BASE_URL,
        withCredentials: true
    });

    const handleResetPassword = async (email) => {
        try {
            const response = await api.post("/user/reset-password", { email });
            return response.data;
        } catch (error) {
            throw error.response?.data?.message || "Password reset request failed. Try again.";
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);
    
        if (!email) {
            setError("Please enter your email address.");
            setIsLoading(false);
            return;
        }
    
        try {
            await handleResetPassword(email);
            setEmailSent(true);
            handlesuccess("Reset code sent to your email");
        } catch (err) {
            console.log(err);
            setError("Failed to process your request. Please try again later.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-r from-green-200 to-green-500 flex items-center justify-center p-4">
            {/* Animated background elements */}
            {[...Array(8)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute text-2xl opacity-30"
                    style={{ 
                        left: `${Math.random() * 100}%`, 
                        top: `${Math.random() * 100}%`,
                        zIndex: 0
                    }}
                    initial={{ opacity: 0, y: -50 }}
                    animate={{ 
                        opacity: [0, 0.3, 0],
                        y: ["0vh", "100vh"],
                        x: i % 2 === 0 ? [0, 50] : [0, -50],
                        rotate: i % 2 === 0 ? 360 : -360
                    }}
                    transition={{ 
                        duration: 15 + i * 2, 
                        repeat: Infinity, 
                        ease: "linear"
                    }}
                >
                    {i % 3 === 0 ? "🍃" : i % 3 === 1 ? "⚡" : "🌱"}
                </motion.div>
            ))}
            
            {/* Sun element */}
            <div className="absolute top-10 right-10 z-0">
                <motion.div
                    className="w-20 h-20 rounded-full bg-yellow-400"
                    animate={{ 
                        boxShadow: [
                            "0 0 10px 5px rgba(255, 236, 25, 0.4)",
                            "0 0 20px 10px rgba(255, 236, 25, 0.6)",
                            "0 0 10px 5px rgba(255, 236, 25, 0.4)"
                        ]
                    }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                />
            </div>
            
            {/* Forgot Password card */}
            <motion.div 
                className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full relative z-10"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                <div className="text-center mb-8">
                    <motion.div
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        <h1 className="text-4xl font-bold text-green-700">EcoGrid</h1>
                        <p className="text-gray-600 mt-2">Reset your password</p>
                    </motion.div>
                </div>
                
                {error && (
                    <motion.div 
                        className="mb-6 p-3 bg-red-100 text-red-700 rounded-lg text-sm"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        {error}
                    </motion.div>
                )}
                
                {!emailSent ? (
                    <>
                        <p className="text-gray-600 mb-6">
                            Enter your email address below and we'll send you a code to reset your password.
                        </p>
                        
                        <form onSubmit={handleSubmit}>
                            <div className="mb-6">
                                <label htmlFor="email" className="block text-gray-700 font-medium mb-2">Email Address</label>
                                <motion.input 
                                    type="email" 
                                    id="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                                    placeholder="your@email.com"
                                    whileFocus={{ scale: 1.01, boxShadow: "0 0 0 2px rgba(0, 128, 0, 0.2)" }}
                                />
                            </div>
                            
                            <motion.button
                                type="submit"
                                className="w-full bg-green-700 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-800 transition duration-200 flex items-center justify-center"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <motion.div 
                                        className="h-5 w-5 border-2 border-white border-t-transparent rounded-full"
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                    />
                                ) : "Send Reset Code"}
                            </motion.button>
                        </form>
                    </>
                ) : (
                    <ResetCodeVerification email={email} />
                )}
                
                <div className="mt-6 text-center">
                    <p className="text-gray-600">
                        <Link
                            to="/login"
                            className="text-green-600 hover:text-green-800 font-medium transition duration-200"
                        >
                            Return to login
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

const ResetCodeVerification = ({ email }) => {
    const [code, setCode] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    
    const navigate = useNavigate();
    const api = axios.create({
            baseURL: API_BASE_URL,
        withCredentials: true
    });

    const handleVerifyCode = async (e) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);
        
        // Validate inputs
        if (!code || !newPassword || !confirmPassword) {
            setError("All fields are required.");
            setIsLoading(false);
            return;
        }
        
        if (newPassword !== confirmPassword) {
            setError("Passwords do not match.");
            setIsLoading(false);
            return;
        }
        
        if (newPassword.length < 8) {
            setError("Password must be at least 8 characters long.");
            setIsLoading(false);
            return;
        }
        
        try {
            await api.post("/user/verify-reset-code", { 
                email, 
                code, 
                newPassword 
            });
            
            handlesuccess("Password reset successful");
            navigate('/login');
        } catch (err) {
            console.log(err);
            setError(err.response?.data?.message || "Code verification failed. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
        >
            <h3 className="text-xl font-bold text-green-700 mb-4">Verify Reset Code</h3>
            <p className="text-gray-600 mb-6">
                Enter the 6-digit code sent to <span className="font-medium">{email}</span> and create a new password.
            </p>
            
            {error && (
                <motion.div 
                    className="mb-6 p-3 bg-red-100 text-red-700 rounded-lg text-sm"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    {error}
                </motion.div>
            )}
            
            <form onSubmit={handleVerifyCode}>
                <div className="mb-6">
                    <label htmlFor="code" className="block text-gray-700 font-medium mb-2">Reset Code</label>
                    <motion.input 
                        type="text" 
                        id="code"
                        value={code}
                        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        required
                        maxLength={6}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                        placeholder="123456"
                        whileFocus={{ scale: 1.01, boxShadow: "0 0 0 2px rgba(0, 128, 0, 0.2)" }}
                    />
                </div>
                
                <div className="mb-6">
                    <label htmlFor="newPassword" className="block text-gray-700 font-medium mb-2">New Password</label>
                    <motion.input 
                        type="password" 
                        id="newPassword"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                        placeholder="••••••••"
                        whileFocus={{ scale: 1.01, boxShadow: "0 0 0 2px rgba(0, 128, 0, 0.2)" }}
                    />
                </div>
                
                <div className="mb-6">
                    <label htmlFor="confirmPassword" className="block text-gray-700 font-medium mb-2">Confirm Password</label>
                    <motion.input 
                        type="password" 
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                        placeholder="••••••••"
                        whileFocus={{ scale: 1.01, boxShadow: "0 0 0 2px rgba(0, 128, 0, 0.2)" }}
                    />
                </div>
                
                <motion.button
                    type="submit"
                    className="w-full bg-green-700 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-800 transition duration-200 flex items-center justify-center"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <motion.div 
                            className="h-5 w-5 border-2 border-white border-t-transparent rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                    ) : "Reset Password"}
                </motion.button>
            </form>
        </motion.div>
    );
};

export default ForgotPasswordPage;
