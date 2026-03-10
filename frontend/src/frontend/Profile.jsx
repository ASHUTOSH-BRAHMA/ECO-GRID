import React, { useState, useEffect, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AuthContext } from "../Context/AuthContext";
import NavBar from "./NavBar";
import { Edit, Save, User, MapPin, Zap, SunIcon, X, Loader2, Mail, UserCheck, Wallet, ExternalLink, Calendar, ChevronRight, Shield, BadgeCheck, BarChart3, TrendingUp, TrendingDown } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import { handleerror, handlesuccess } from "../../utils";
import axios from "axios";

const Profile = () => {
  const { user } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    location: "",
    energyUsage: 0,
    hasSolarPanels: false,
    email: "",
    userType: "",
    walletAddress: "" 
  });
  
  const [walletAddress, setWalletAddress] = useState("");
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [userDisconnected, setUserDisconnected] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [userStats, setUserStats] = useState({ totalTrades: 0, kwhSold: 0, kwhBought: 0, carbonSaved: 0, recentTx: [] });
  const [tradeAnalytics, setTradeAnalytics] = useState({
    monthlyData: [],
    tradeTypeDistribution: [],
    priceHistory: []
  });

  const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080/api",
    withCredentials: true
  });

  // Fetch user profile data
  useEffect(() => {
    const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");

    if (!token) {
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/user/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const data = response.data;
        setProfile(data);

        // Backend returns either a UserProfile doc (with populated .user)
        // or a plain object (when no profile exists yet). Handle both shapes.
        const userDoc = data.user || {};
        setFormData({
          location: data.location || "",
          energyUsage: data.energyUsage || 0,
          hasSolarPanels: data.hasSolarPanels || false,
          email: userDoc.email || user?.user?.email || user?.email || "",
          userType: userDoc.userType || user?.user?.userType || user?.userType || "consumer",
          walletAddress: data.walletAddress || ""
        });

        if (data.walletAddress) {
          setWalletAddress(data.walletAddress);
          setIsWalletConnected(true);
        }
      } catch (err) {
        setError(err.message);
        handleerror(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  // Fetch real transaction stats for Energy Statistics tab
  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
        if (!token) return;
        const res = await fetch('http://localhost:8080/api/user/transactions', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data.success) {
          const txs = data.transactions;
          const kwhSold = txs.filter(t => t.type === 'sold').reduce((s, t) => s + (Number(t.energyKwh) || 0), 0);
          const kwhBought = txs.filter(t => t.type === 'bought').reduce((s, t) => s + (Number(t.energyKwh) || 0), 0);
          const totalSoldValue = txs.filter(t => t.type === 'sold').reduce((s, t) => s + (Number(t.amount) || 0), 0);
          const totalBoughtValue = txs.filter(t => t.type === 'bought').reduce((s, t) => s + (Number(t.amount) || 0), 0);
          // ~0.62 kg CO₂ saved per kWh of renewable energy produced & sold
          const carbonSaved = (kwhSold * 0.62).toFixed(1);
          setUserStats({
            totalTrades: txs.length,
            kwhSold: kwhSold.toFixed(1),
            kwhBought: kwhBought.toFixed(1),
            carbonSaved,
            recentTx: txs.slice(0, 3)
          });
          
          // Process analytics data
          const monthlyMap = new Map();
          txs.forEach(tx => {
            const date = new Date(tx.timestamp);
            const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            if (!monthlyMap.has(monthKey)) {
              monthlyMap.set(monthKey, { month: monthKey, sold: 0, bought: 0, revenue: 0, spent: 0 });
            }
            const month = monthlyMap.get(monthKey);
            if (tx.type === 'sold') {
              month.sold += Number(tx.energyKwh) || 0;
              month.revenue += Number(tx.amount) || 0;
            } else {
              month.bought += Number(tx.energyKwh) || 0;
              month.spent += Number(tx.amount) || 0;
            }
          });
          
          setTradeAnalytics({
            monthlyData: Array.from(monthlyMap.values()).slice(-6),
            tradeTypeDistribution: [
              { name: 'Sold', value: kwhSold, color: '#10b981' },
              { name: 'Bought', value: kwhBought, color: '#3b82f6' }
            ],
            priceHistory: txs.slice(-10).map(tx => ({
              date: new Date(tx.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              price: tx.energyKwh > 0 ? (tx.amount / tx.energyKwh).toFixed(3) : 0,
              type: tx.type
            }))
          });
        }
      } catch (err) {
        console.error('Error fetching user stats:', err);
      }
    };
    if (user?.user?._id) fetchUserStats();
  }, [user]);
  
  // Check if wallet is already connected on component mount
  useEffect(() => {
    const checkWalletConnection = async () => {
      // Check if user has explicitly disconnected
      const hasDisconnected = localStorage.getItem("walletDisconnected") === "true";
      
      // If user explicitly disconnected, don't auto-connect
      if (hasDisconnected) {
        setUserDisconnected(true);
        setIsWalletConnected(false);
        setWalletAddress("");
        return;
      }
      
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setWalletAddress(accounts[0]);
            setIsWalletConnected(true);
            
            // Update form data if profile exists
            if (profile && (!profile.walletAddress || profile.walletAddress !== accounts[0])) {
              setFormData(prev => ({
                ...prev,
                walletAddress: accounts[0]
              }));
            }
          }
        } catch (error) {
          console.error("Error checking wallet connection:", error);
        }
      }
    };
    
    checkWalletConnection();
  }, [profile]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
      
      const response = await api.put(`/user/profile`, formData, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log(response);
      const updatedProfile = response.data;
      setProfile(updatedProfile);
      setIsEditing(false);
      handlesuccess("Profile updated successfully");
    } catch (err) {
        console.log(err);
      handleerror(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Connect to Metamask wallet
  const connectWallet = async () => {
    if (!window.ethereum) {
      handleerror("Metamask not detected! Please install Metamask extension.");
      return;
    }
    
    setIsConnecting(true);
    
    try {
      // Clear the disconnected flag when connecting
      localStorage.removeItem("walletDisconnected");
      setUserDisconnected(false);
      
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setWalletAddress(accounts[0]);
      setIsWalletConnected(true);
      
      // Update form data
      setFormData(prev => ({
        ...prev,
        walletAddress: accounts[0]
      }));
      
      handlesuccess("Wallet connected successfully!");
      
      // Save wallet address to profile
      const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
      await api.put(`/user/profile`, { walletAddress: accounts[0] }, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });
    } catch (error) {
      console.error("Error connecting wallet:", error);
      handleerror("Failed to connect wallet. Please try again.");
    } finally {
      setIsConnecting(false);
    }
  };
  
  // Disconnect wallet
  const disconnectWallet = async () => {
    try {
      // Set disconnected flag in localStorage
      localStorage.setItem("walletDisconnected", "true");
      setUserDisconnected(true);
      
      setWalletAddress("");
      setIsWalletConnected(false);
      
      // Update form data
      setFormData(prev => ({
        ...prev,
        walletAddress: ""
      }));
      
      // Save empty wallet address to profile
      const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
      await api.put(`/user/profile`, { walletAddress: "" }, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });
      
      handlesuccess("Wallet disconnected successfully!");
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
      handleerror("Failed to disconnect wallet. Please try again.");
    }
  };

  // Animation variants
  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.6 } },
    exit: { opacity: 0, y: 20, transition: { duration: 0.3 } }
  };

  const cardVariants = {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1, transition: { duration: 0.5, delay: 0.2 } }
  };

  const tabVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: 10, transition: { duration: 0.2 } }
  };

  // User type to badge color mapping
  const userTypeBadge = {
    prosumer: "bg-gradient-to-r from-yellow-400 to-green-400 text-green-900",
    consumer: "bg-gradient-to-r from-blue-400 to-cyan-400 text-blue-900",
    utility: "bg-gradient-to-r from-purple-400 to-indigo-400 text-purple-900"
  };

  if (loading && !profile) {
    return (
      <>
        <NavBar />
        <div className="min-h-screen pt-24 bg-[#060810] flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="h-16 w-16 rounded-full bg-[#111525] border border-[#1e2440] flex items-center justify-center shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                <Loader2 className="h-8 w-8 text-[#00e5a0] animate-spin" />
              </div>
              <div className="absolute -bottom-1 -right-1 h-6 w-6 bg-[#0c0f1a] rounded-full flex items-center justify-center shadow-md border border-[#1e2440]">
                <User className="h-4 w-4 text-[#00e5a0]" />
              </div>
            </div>
            <p className="mt-4 text-[#8892b0] font-mono uppercase tracking-wider text-sm">Loading your profile...</p>
          </div>
        </div>
      </>
    );
  }

  if (!loading && error && !profile) {
    return (
      <>
        <NavBar />
        <div className="min-h-screen pt-24 bg-[#060810] flex items-center justify-center">
          <div className="flex flex-col items-center text-center max-w-md px-4">
            <div className="h-16 w-16 rounded-full bg-[#ff4d6d]/10 border border-[#ff4d6d]/30 flex items-center justify-center mb-4">
              <User className="h-8 w-8 text-[#ff4d6d]" />
            </div>
            <h2 className="text-xl font-bold text-[#e8eaf6] mb-2 font-['Syne']">Couldn't load profile</h2>
            <p className="text-[#8892b0] text-sm mb-4 font-mono">{error || "Please log in again to view your profile."}</p>
            <button
              onClick={() => window.location.href = "/login"}
              className="px-6 py-2 bg-[#00e5a0]/10 border border-[#00e5a0]/50 text-[#00e5a0] rounded-lg font-mono text-sm tracking-wider uppercase hover:bg-[#00e5a0]/20 transition-colors"
            >
              Go to Login
            </button>
          </div>
        </div>
      </>
    );
  }


  return (
    <>
      <NavBar />
      <motion.div
        className="min-h-screen bg-[#060810] text-[#e8eaf6] pt-24 pb-16 px-4"
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <div className="max-w-5xl mx-auto">
          <motion.div
            className="bg-[#0c0f1a] rounded-2xl shadow-[0_0_20px_rgba(0,0,0,0.5)] overflow-hidden border border-[#1e2440]"
            variants={cardVariants}
          >
            {/* Profile Header */}
            <div className="bg-[#111525] p-8 text-[#e8eaf6] relative overflow-hidden border-b border-[#1e2440]">
              
              {/* Decorative circles */}
              <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-[#00e5a0] opacity-5 filter blur-[100px]"></div>
              <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-[#4d9fff] opacity-5 filter blur-[100px]"></div>
              
              <div className="relative z-10 flex flex-col md:flex-row md:items-center">
                <div className="bg-[#0c0f1a] p-1.5 rounded-full mb-4 md:mb-0 md:mr-6 shadow-[0_0_15px_rgba(0,229,160,0.1)] border border-[#1e2440]">
                  <div className="bg-[#111525] rounded-full h-24 w-24 flex items-center justify-center relative overflow-hidden">
                    <User size={48} className="text-[#00e5a0]" />
                  </div>
                </div>
                <div className="flex-1">
                  <h1 className="text-3xl font-bold tracking-tight font-['Syne']">{user?.user?.name || "User"}</h1>
                  <p className="text-[#8892b0] flex items-center mt-1 font-mono text-sm">
                    <Mail className="h-4 w-4 mr-2" />
                    {user?.user?.email}
                  </p>
                  
                  <div className="flex mt-3 items-center flex-wrap gap-2">
                    <span className={`px-3 py-1 bg-[#1e2440] border border-[#a78bfa]/30 rounded text-xs font-mono uppercase tracking-wider font-bold shadow-sm text-[#a78bfa] flex items-center`}>
                      <BadgeCheck className="h-4 w-4 mr-1" />
                      {user?.user?.userType?.charAt(0).toUpperCase() + user?.user?.userType?.slice(1) || "User"}
                    </span>
                    
                    {!user?.user?.onboardingCompleted && (
                      <span className="px-3 py-1 bg-[#ffb703]/10 border border-[#ffb703]/30 text-[#ffb703] rounded text-xs font-mono uppercase tracking-wider font-bold shadow-sm flex items-center">
                        <Shield className="h-4 w-4 mr-1" />
                        Complete Onboarding
                      </span>
                    )}
                    
                    <span className="px-3 py-1 bg-[#111525] border border-[#1e2440] text-[#8892b0] rounded text-xs font-mono uppercase tracking-wider font-bold shadow-sm flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {(profile?.user?.createdAt || user?.user?.createdAt || user?.createdAt)
                        ? new Date(profile?.user?.createdAt || user?.user?.createdAt || user?.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short'
                          })
                        : "Unknown"}
                    </span>
                  </div>
                </div>
                
                {!isEditing ? (
                  <motion.button
                    onClick={() => setIsEditing(true)}
                    className="mt-4 md:mt-0 px-4 py-2 bg-[#111525] border border-[#1e2440] text-[#00e5a0] rounded-lg flex items-center font-mono text-sm uppercase tracking-wider shadow-lg hover:bg-[#1e2440] transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Edit size={16} className="mr-2" />
                    Edit Profile
                  </motion.button>
                ) : (
                  <motion.button
                    onClick={() => setIsEditing(false)}
                    className="mt-4 md:mt-0 px-4 py-2 bg-[#ff4d6d]/10 border border-[#ff4d6d]/30 text-[#ff4d6d] rounded-lg flex items-center font-mono text-sm uppercase tracking-wider shadow-lg hover:bg-[#ff4d6d]/20 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <X size={16} className="mr-2" />
                    Cancel
                  </motion.button>
                )}
              </div>
            </div>
            
            {/* Tab Navigation */}
            <div className="border-b border-[#1e2440] bg-[#0c0f1a]">
              <div className="flex space-x-1 px-6 scrollbar-hide overflow-x-auto">
                <button
                  onClick={() => setActiveTab("profile")}
                  className={`py-4 px-4 font-mono text-xs uppercase tracking-wider transition-colors relative whitespace-nowrap ${
                    activeTab === "profile" ? "text-[#00e5a0] font-bold" : "text-[#8892b0] hover:text-[#e8eaf6]"
                  }`}
                >
                  Profile Information
                  {activeTab === "profile" && (
                    <motion.div 
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00e5a0]"
                      layoutId="activeTab"
                    />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab("wallet")}
                  className={`py-4 px-4 font-mono text-xs uppercase tracking-wider transition-colors relative whitespace-nowrap ${
                    activeTab === "wallet" ? "text-[#00e5a0] font-bold" : "text-[#8892b0] hover:text-[#e8eaf6]"
                  }`}
                >
                  Wallet
                  {activeTab === "wallet" && (
                    <motion.div 
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00e5a0]"
                      layoutId="activeTab"
                    />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab("energy")}
                  className={`py-4 px-4 font-mono text-xs uppercase tracking-wider transition-colors relative whitespace-nowrap ${
                    activeTab === "energy" ? "text-[#00e5a0] font-bold" : "text-[#8892b0] hover:text-[#e8eaf6]"
                  }`}
                >
                  Energy Statistics
                  {activeTab === "energy" && (
                    <motion.div 
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00e5a0]"
                      layoutId="activeTab"
                    />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab("analytics")}
                  className={`py-4 px-4 font-mono text-xs uppercase tracking-wider transition-colors relative whitespace-nowrap ${
                    activeTab === "analytics" ? "text-[#00e5a0] font-bold" : "text-[#8892b0] hover:text-[#e8eaf6]"
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <BarChart3 className="w-4 h-4" />
                    Analytics
                  </span>
                  {activeTab === "analytics" && (
                    <motion.div 
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00e5a0]"
                      layoutId="activeTab"
                    />
                  )}
                </button>
              </div>
            </div>
            
            {/* Profile Content */}
            <div className="p-8">
              {!isEditing ? (
                <AnimatePresence mode="wait">
                  {activeTab === "profile" && (
                    <motion.div
                      key="profile"
                      variants={tabVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      className="space-y-8"
                    >
                      {/* Profile Info Section */}
                      <section>
                        <h2 className="text-sm font-bold text-[#e8eaf6] mb-6 flex items-center uppercase tracking-wider">
                          <UserCheck className="mr-3 h-5 w-5 text-[#00e5a0]" />
                          Profile Information
                        </h2>
                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="bg-[#111525] p-6 rounded-xl border border-[#1e2440] hover:border-[#a78bfa]/50 transition-colors group">
                            <div className="flex items-start">
                              <div className="bg-[#0c0f1a] border border-[#1e2440] p-3 rounded-lg mr-4 group-hover:border-[#a78bfa]/50 transition-colors">
                                <UserCheck className="text-[#a78bfa] h-5 w-5" />
                              </div>
                              <div>
                                <h3 className="text-[#8892b0] font-mono text-[10px] uppercase tracking-wider font-bold">User Type</h3>
                                <p className="text-lg mt-1 text-[#e8eaf6] font-semibold font-['Syne']">
                                  {user?.user?.userType?.charAt(0).toUpperCase() + user?.user?.userType?.slice(1) || "Consumer"}
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="bg-[#111525] p-6 rounded-xl border border-[#1e2440] hover:border-[#4d9fff]/50 transition-colors group">
                            <div className="flex items-start">
                              <div className="bg-[#0c0f1a] border border-[#1e2440] p-3 rounded-lg mr-4 group-hover:border-[#4d9fff]/50 transition-colors">
                                <Mail className="text-[#4d9fff] h-5 w-5" />
                              </div>
                              <div>
                                <h3 className="text-[#8892b0] font-mono text-[10px] uppercase tracking-wider font-bold">Email</h3>
                                <p className="text-lg mt-1 text-[#e8eaf6] font-semibold font-['Syne'] break-all">{user?.user?.email || "No email provided"}</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="bg-[#111525] p-6 rounded-xl border border-[#1e2440] hover:border-[#ffb703]/50 transition-colors group">
                            <div className="flex items-start">
                              <div className="bg-[#0c0f1a] border border-[#1e2440] p-3 rounded-lg mr-4 group-hover:border-[#ffb703]/50 transition-colors">
                                <MapPin className="text-[#ffb703] h-5 w-5" />
                              </div>
                              <div>
                                <h3 className="text-[#8892b0] font-mono text-[10px] uppercase tracking-wider font-bold">Location</h3>
                                <p className="text-lg mt-1 text-[#e8eaf6] font-semibold font-['Syne']">{profile?.location || "Not specified"}</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="bg-[#111525] p-6 rounded-xl border border-[#1e2440] hover:border-[#00e5a0]/50 transition-colors group">
                            <div className="flex items-start">
                              <div className="bg-[#0c0f1a] border border-[#1e2440] p-3 rounded-lg mr-4 group-hover:border-[#00e5a0]/50 transition-colors">
                                <Zap className="text-[#00e5a0] h-5 w-5" />
                              </div>
                              <div>
                                <h3 className="text-[#8892b0] font-mono text-[10px] uppercase tracking-wider font-bold">Energy Usage</h3>
                                <p className="text-lg mt-1 text-[#e8eaf6] font-semibold font-['Syne']">{profile?.energyUsage || "0"} <span className="text-[#8892b0] text-sm font-mono">kWh/m</span></p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="bg-[#111525] p-6 rounded-xl border border-[#1e2440] hover:border-[#ffd166]/50 transition-colors group">
                            <div className="flex items-start">
                              <div className="bg-[#0c0f1a] border border-[#1e2440] p-3 rounded-lg mr-4 group-hover:border-[#ffd166]/50 transition-colors">
                                <SunIcon className="text-[#ffd166] h-5 w-5" />
                              </div>
                              <div>
                                <h3 className="text-[#8892b0] font-mono text-[10px] uppercase tracking-wider font-bold">Solar Panels</h3>
                                <div className="flex items-center mt-1">
                                  <span className={`inline-block w-2 h-2 rounded-full mr-2 ${profile?.hasSolarPanels ? "bg-[#00e5a0]" : "bg-[#1e2440]"}`}></span>
                                  <p className="text-lg text-[#e8eaf6] font-semibold font-['Syne']">{profile?.hasSolarPanels ? "Installed" : "None"}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="bg-[#111525] p-6 rounded-xl border border-[#1e2440] hover:border-[#ff4d6d]/50 transition-colors group">
                            <div className="flex items-start">
                              <div className="bg-[#0c0f1a] border border-[#1e2440] p-3 rounded-lg mr-4 group-hover:border-[#ff4d6d]/50 transition-colors">
                                <Calendar className="text-[#ff4d6d] h-5 w-5" />
                              </div>
                              <div>
                                <h3 className="text-[#8892b0] font-mono text-[10px] uppercase tracking-wider font-bold">Member Since</h3>
                                <p className="text-lg mt-1 text-[#e8eaf6] font-semibold font-['Syne']">
                                  {(profile?.user?.createdAt || user?.user?.createdAt || user?.createdAt)
                                    ? new Date(profile?.user?.createdAt || user?.user?.createdAt || user?.createdAt).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric'
                                      })
                                    : "Unknown"}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </section>
                    </motion.div>
                  )}
                  
                  {activeTab === "wallet" && (
                    <motion.div
                      key="wallet"
                      variants={tabVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                    >
                      {/* Wallet Section */}
                      <section>
                        <h2 className="text-sm font-bold text-[#e8eaf6] mb-6 flex items-center uppercase tracking-wider">
                          <Wallet className="mr-3 h-5 w-5 text-[#00e5a0]" />
                          Metamask Wallet
                        </h2>
                        <div className="bg-[#111525] p-8 rounded-xl border border-[#1e2440] shadow-sm">
                          {isWalletConnected ? (
                            <div className="space-y-6">
                              <div className="flex flex-col md:flex-row md:items-center gap-6">
                                <div className="bg-[#ffb703]/10 border border-[#ffb703]/30 p-4 rounded-xl shadow-sm">
                                  <Wallet className="h-12 w-12 text-[#ffb703]" />
                                </div>
                                <div className="flex-1">
                                  <h3 className="text-xl font-bold text-[#e8eaf6] mb-1 font-['Syne']">Connected Wallet</h3>
                                  <div className="bg-[#0c0f1a] p-3 rounded-lg border border-[#1e2440] shadow-inner">
                                    <p className="text-sm text-[#8892b0] font-mono break-all">{walletAddress}</p>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                <a 
                                  href={`https://amoy.polygonscan.com/address/${walletAddress}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] font-mono uppercase tracking-wider font-bold bg-[#4d9fff]/10 border border-[#4d9fff]/30 text-[#4d9fff] hover:bg-[#4d9fff]/20 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
                                >
                                  View on Polygonscan <ExternalLink className="h-4 w-4" />
                                </a>
                                
                                <motion.button
                                  onClick={disconnectWallet}
                                  className="px-4 py-2 bg-[#ff4d6d]/10 border border-[#ff4d6d]/30 text-[#ff4d6d] rounded-lg flex items-center font-mono text-[10px] uppercase tracking-wider font-bold shadow-sm hover:bg-[#ff4d6d]/20 transition-colors"
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                >
                                  <X size={16} className="mr-2" />
                                  Disconnect Wallet
                                </motion.button>
                              </div>
                              
                              <div className="bg-[#4d9fff]/5 border border-[#4d9fff]/30 rounded-lg p-4 text-[#4d9fff] text-xs font-mono uppercase tracking-widest leading-relaxed">
                                <p className="flex items-start">
                                  <Shield className="h-5 w-5 mr-3 mt-0.5 text-[#4d9fff]" />
                                  Your wallet is securely connected to our platform. You can now participate in energy trading and transactions on the blockchain.
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-6">
                              <div className="flex flex-col md:flex-row md:items-center gap-6">
                                <div className="bg-[#1e2440] p-4 rounded-xl shadow-sm border border-[#1e2440]">
                                  <Wallet className="h-12 w-12 text-[#8892b0]" />
                                </div>
                                <div className="flex-1">
                                  <h3 className="text-xl font-bold text-[#e8eaf6] mb-2 font-['Syne']">No Wallet Connected</h3>
                                  <p className="text-[#8892b0] text-sm font-mono">Connect your Metamask wallet to participate in energy trading on the blockchain.</p>
                                </div>
                              </div>
                              
                              <motion.button
                                onClick={connectWallet}
                                disabled={isConnecting}
                                className="w-full sm:w-auto px-6 py-3 bg-[#ffb703]/10 border border-[#ffb703]/30 text-[#ffb703] rounded-lg flex items-center justify-center font-mono text-[10px] font-bold uppercase tracking-wider shadow-md hover:bg-[#ffb703]/20 transition-colors"
                                whileHover={{ scale: 1.02, boxShadow: "0px 8px 20px rgba(255,183,3,0.1)" }}
                                whileTap={{ scale: 0.98 }}
                              >
                                {isConnecting ? (
                                  <>
                                    <Loader2 size={18} className="mr-2 animate-spin" />
                                    Connecting...
                                  </>
                                ) : (
                                  <>
                                    <Wallet size={18} className="mr-2" />
                                    Connect Metamask
                                  </>
                                )}
                              </motion.button>
                              
                              <div className="bg-[#ffb703]/5 border border-[#ffb703]/30 rounded-lg p-4 text-[#ffb703] text-xs font-mono uppercase tracking-widest leading-relaxed">
                                <p className="flex items-start">
                                  <Shield className="h-5 w-5 mr-3 mt-0.5 text-[#ffb703]" />
                                  Connecting your wallet enables you to participate in energy trading, earn rewards, and manage your energy assets on the blockchain.
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </section>
                    </motion.div>
                  )}
                  
                  {activeTab === "energy" && (
                    <motion.div
                      key="energy"
                      variants={tabVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                    >
                      {/* Energy Statistics Section */}
                      <section className="space-y-6">
                        <h2 className="text-sm font-bold text-[#e8eaf6] mb-6 flex items-center uppercase tracking-wider">
                          <Zap className="mr-3 h-5 w-5 text-[#00e5a0]" />
                          Energy Statistics
                        </h2>
                        
                        {/* Main Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <motion.div 
                            whileHover={{ scale: 1.02 }}
                            className="bg-[#111525] p-6 rounded-xl text-[#e8eaf6] border border-[#1e2440] shadow-sm hover:border-[#00e5a0]/50 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-[#8892b0] font-mono text-[10px] uppercase tracking-wider font-bold">Monthly Consumption</p>
                                <p className="text-3xl font-bold mt-1 font-['Syne'] text-[#00e5a0]">{profile?.energyUsage || "0"}</p>
                                <p className="text-[#8892b0] text-[10px] mt-1 font-mono uppercase tracking-wider">kWh used</p>
                              </div>
                              <div className="bg-[#00e5a0]/10 p-3 rounded-full border border-[#00e5a0]/30 shadow-sm">
                                <Zap className="h-6 w-6 text-[#00e5a0]" />
                              </div>
                            </div>
                          </motion.div>
                          
                          <motion.div 
                            whileHover={{ scale: 1.02 }}
                            className="bg-[#111525] p-6 rounded-xl text-[#e8eaf6] border border-[#1e2440] shadow-sm hover:border-[#ffd166]/50 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-[#8892b0] font-mono text-[10px] uppercase tracking-wider font-bold">Energy Produced</p>
                                <p className="text-3xl font-bold mt-1 font-['Syne'] text-[#ffd166]">{userStats.kwhSold}</p>
                                <p className="text-[#8892b0] text-[10px] mt-1 font-mono uppercase tracking-wider">kWh sold this period</p>
                              </div>
                              <div className="bg-[#ffd166]/10 p-3 rounded-full border border-[#ffd166]/30 shadow-sm">
                                <SunIcon className="h-6 w-6 text-[#ffd166]" />
                              </div>
                            </div>
                          </motion.div>
                          
                          <motion.div 
                            whileHover={{ scale: 1.02 }}
                            className="bg-[#111525] p-6 rounded-xl text-[#e8eaf6] border border-[#1e2440] shadow-sm hover:border-[#4d9fff]/50 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-[#8892b0] font-mono text-[10px] uppercase tracking-wider font-bold">Total Trades</p>
                                <p className="text-3xl font-bold mt-1 font-['Syne'] text-[#4d9fff]">{userStats.totalTrades}</p>
                                <p className="text-[#8892b0] text-[10px] mt-1 font-mono uppercase tracking-wider">completed trades</p>
                              </div>
                              <div className="bg-[#4d9fff]/10 p-3 rounded-full border border-[#4d9fff]/30 shadow-sm">
                                <Wallet className="h-6 w-6 text-[#4d9fff]" />
                              </div>
                            </div>
                          </motion.div>
                          
                          <motion.div 
                            whileHover={{ scale: 1.02 }}
                            className="bg-[#111525] p-6 rounded-xl text-[#e8eaf6] border border-[#1e2440] shadow-sm hover:border-[#a78bfa]/50 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-[#8892b0] font-mono text-[10px] uppercase tracking-wider font-bold">Carbon Saved</p>
                                <p className="text-3xl font-bold mt-1 font-['Syne'] text-[#a78bfa]">{userStats.carbonSaved}</p>
                                <p className="text-[#8892b0] text-[10px] mt-1 font-mono uppercase tracking-wider">kg CO₂</p>
                              </div>
                              <div className="bg-[#a78bfa]/10 p-3 rounded-full border border-[#a78bfa]/30 shadow-sm">
                                <Shield className="h-6 w-6 text-[#a78bfa]" />
                              </div>
                            </div>
                          </motion.div>
                        </div>
                        
                        {/* Energy Breakdown */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div className="bg-[#0c0f1a] p-6 rounded-xl border border-[#1e2440] shadow-sm">
                            <h3 className="text-sm font-bold text-[#e8eaf6] mb-4 uppercase tracking-wider">Energy Sources</h3>
                            <div className="space-y-4">
                              <div className="flex items-center justify-between border-b border-[#1e2440] pb-3 last:border-0 last:pb-0">
                                <div className="flex items-center">
                                  <div className="w-10 h-10 bg-[#ffd166]/10 border border-[#ffd166]/30 rounded-full flex items-center justify-center mr-3 shadow-sm">
                                    <span className="text-xl">☀️</span>
                                  </div>
                                  <div>
                                    <p className="font-bold text-[#e8eaf6] font-['Syne']">Solar</p>
                                    <p className="text-[10px] font-mono text-[#8892b0] uppercase tracking-wider">{profile?.hasSolarPanels ? "Active" : "Not Installed"}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-[#ffd166] text-sm font-mono">{profile?.hasSolarPanels ? "45 kWh" : "0 kWh"}</p>
                                  <p className="text-[10px] text-[#8892b0]">{profile?.hasSolarPanels ? "65%" : "0%"}</p>
                                </div>
                              </div>
                              
                              <div className="flex items-center justify-between border-b border-[#1e2440] pb-3 last:border-0 last:pb-0">
                                <div className="flex items-center">
                                  <div className="w-10 h-10 bg-[#4d9fff]/10 border border-[#4d9fff]/30 rounded-full flex items-center justify-center mr-3 shadow-sm">
                                    <span className="text-xl">💨</span>
                                  </div>
                                  <div>
                                    <p className="font-bold text-[#e8eaf6] font-['Syne']">Wind</p>
                                    <p className="text-[10px] font-mono text-[#8892b0] uppercase tracking-wider">Community Grid</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-[#4d9fff] text-sm font-mono">15 kWh</p>
                                  <p className="text-[10px] text-[#8892b0]">22%</p>
                                </div>
                              </div>
                              
                              <div className="flex items-center justify-between border-b border-[#1e2440] pb-3 last:border-0 last:pb-0">
                                <div className="flex items-center">
                                  <div className="w-10 h-10 bg-[#00e5a0]/10 border border-[#00e5a0]/30 rounded-full flex items-center justify-center mr-3 shadow-sm">
                                    <span className="text-xl">💧</span>
                                  </div>
                                  <div>
                                    <p className="font-bold text-[#e8eaf6] font-['Syne']">Hydro</p>
                                    <p className="text-[10px] font-mono text-[#8892b0] uppercase tracking-wider">Regional Grid</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-[#00e5a0] text-sm font-mono">9 kWh</p>
                                  <p className="text-[10px] text-[#8892b0]">13%</p>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="bg-[#0c0f1a] p-6 rounded-xl border border-[#1e2440] shadow-sm">
                            <h3 className="text-sm font-bold text-[#e8eaf6] mb-4 uppercase tracking-wider">Recent Activity</h3>
                            <div className="space-y-3">
                              {userStats.recentTx.length === 0 ? (
                                <p className="text-[#8892b0] text-sm font-mono">No recent transactions yet.</p>
                              ) : userStats.recentTx.map((tx, i) => (
                                <div key={tx._id || i} className={`flex items-center p-3 rounded border ${tx.type === 'sold' ? 'bg-[#00e5a0]/5 border-[#00e5a0]/20' : 'bg-[#4d9fff]/5 border-[#4d9fff]/20'}`}>
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 border ${tx.type === 'sold' ? 'bg-[#00e5a0]/10 border-[#00e5a0]/30' : 'bg-[#4d9fff]/10 border-[#4d9fff]/30'}`}>
                                    <Zap className={`h-4 w-4 ${tx.type === 'sold' ? 'text-[#00e5a0]' : 'text-[#4d9fff]'}`} />
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-xs font-bold font-mono uppercase tracking-wider text-[#e8eaf6]">{tx.type === 'sold' ? 'Energy Sold' : 'Energy Purchased'}</p>
                                    <p className="text-[10px] text-[#8892b0] font-mono">{new Date(tx.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                                  </div>
                                  <span className={`text-sm font-bold font-mono ${tx.type === 'sold' ? 'text-[#00e5a0]' : 'text-[#4d9fff]'}`}>
                                    {tx.type === 'sold' ? '+' : '-'}{tx.energyKwh} kWh
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        {/* Monthly Progress */}
                        <div className="bg-[#111525] p-6 rounded-xl border border-[#1e2440] shadow-sm">
                          <h3 className="text-sm font-bold text-[#e8eaf6] mb-4 uppercase tracking-wider">Monthly Energy Goals</h3>
                          <div className="space-y-4">
                            <div>
                              <div className="flex justify-between text-[10px] font-mono uppercase tracking-wider mb-1">
                                <span className="text-[#8892b0]">Consumption Target</span>
                                <span className="font-bold text-[#00e5a0]">{profile?.energyUsage || 0}/{(profile?.energyUsage || 0) + 50} kWh</span>
                              </div>
                              <div className="w-full bg-[#1e2440] rounded-full h-1.5 overflow-hidden">
                                <div 
                                  className="bg-[#00e5a0] h-1.5 rounded-full shadow-[0_0_10px_rgba(0,229,160,0.8)]" 
                                  style={{ width: `${Math.min(((profile?.energyUsage || 0) / ((profile?.energyUsage || 0) + 50)) * 100, 100)}%` }}
                                ></div>
                              </div>
                            </div>
                            
                            <div>
                              <div className="flex justify-between text-[10px] font-mono uppercase tracking-wider mb-1">
                                <span className="text-[#8892b0]">Production Goal</span>
                                <span className="font-bold text-[#ffd166]">{profile?.hasSolarPanels ? "45/60 kWh" : "0/0 kWh"}</span>
                              </div>
                              <div className="w-full bg-[#1e2440] rounded-full h-1.5 overflow-hidden">
                                <div 
                                  className="bg-[#ffd166] h-1.5 rounded-full shadow-[0_0_10px_rgba(255,209,102,0.8)]" 
                                  style={{ width: profile?.hasSolarPanels ? "75%" : "0%" }}
                                ></div>
                              </div>
                            </div>
                            
                            <div>
                              <div className="flex justify-between text-[10px] font-mono uppercase tracking-wider mb-1">
                                <span className="text-[#8892b0]">Carbon Reduction</span>
                                <span className="font-bold text-[#a78bfa]">{profile?.hasSolarPanels ? "28/40 kg" : "0/0 kg"}</span>
                              </div>
                              <div className="w-full bg-[#1e2440] rounded-full h-1.5 overflow-hidden">
                                <div 
                                  className="bg-[#a78bfa] h-1.5 rounded-full shadow-[0_0_10px_rgba(167,139,250,0.8)]" 
                                  style={{ width: profile?.hasSolarPanels ? "70%" : "0%" }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </section>
                    </motion.div>
                  )}
                  
                  {activeTab === "analytics" && (
                    <motion.div
                      key="analytics"
                      variants={tabVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                    >
                      {/* Trading Analytics Section */}
                      <section className="space-y-6">
                        <h2 className="text-sm font-bold text-[#e8eaf6] mb-6 flex items-center uppercase tracking-wider">
                          <BarChart3 className="mr-3 h-5 w-5 text-[#00e5a0]" />
                          Trading Analytics
                        </h2>
                        
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <motion.div 
                            whileHover={{ scale: 1.02 }}
                            className="bg-[#111525] p-6 rounded-xl border border-[#1e2440] shadow-sm hover:border-[#00e5a0]/50 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-[#8892b0] font-mono text-[10px] uppercase tracking-wider font-bold">Total Energy Traded</p>
                                <p className="text-3xl font-bold mt-1 font-['Syne'] text-[#00e5a0]">
                                  {(parseFloat(userStats.kwhSold) + parseFloat(userStats.kwhBought)).toFixed(1)}
                                </p>
                                <p className="text-[#8892b0] text-[10px] mt-1 font-mono uppercase tracking-wider">kWh</p>
                              </div>
                              <div className="bg-[#00e5a0]/10 p-3 rounded-full border border-[#00e5a0]/30 shadow-sm">
                                <TrendingUp className="h-6 w-6 text-[#00e5a0]" />
                              </div>
                            </div>
                          </motion.div>
                          
                          <motion.div 
                            whileHover={{ scale: 1.02 }}
                            className="bg-[#111525] p-6 rounded-xl border border-[#1e2440] shadow-sm hover:border-[#4d9fff]/50 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-[#8892b0] font-mono text-[10px] uppercase tracking-wider font-bold">Net Position</p>
                                <p className="text-3xl font-bold mt-1 font-['Syne'] text-[#4d9fff]">
                                  {(parseFloat(userStats.kwhSold) - parseFloat(userStats.kwhBought)).toFixed(1)}
                                </p>
                                <p className="text-[#8892b0] text-[10px] mt-1 font-mono uppercase tracking-wider">kWh</p>
                              </div>
                              <div className="bg-[#4d9fff]/10 p-3 rounded-full border border-[#4d9fff]/30 shadow-sm">
                                <Zap className="h-6 w-6 text-[#4d9fff]" />
                              </div>
                            </div>
                          </motion.div>
                          
                          <motion.div 
                            whileHover={{ scale: 1.02 }}
                            className="bg-[#111525] p-6 rounded-xl border border-[#1e2440] shadow-sm hover:border-[#a78bfa]/50 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-[#8892b0] font-mono text-[10px] uppercase tracking-wider font-bold">Trade Ratio</p>
                                <p className="text-3xl font-bold mt-1 font-['Syne'] text-[#a78bfa]">
                                  {userStats.kwhBought > 0 
                                    ? (parseFloat(userStats.kwhSold) / parseFloat(userStats.kwhBought)).toFixed(2)
                                    : '0.00'}
                                </p>
                                <p className="text-[#8892b0] text-[10px] mt-1 font-mono uppercase tracking-wider">Sold/Bought</p>
                              </div>
                              <div className="bg-[#a78bfa]/10 p-3 rounded-full border border-[#a78bfa]/30 shadow-sm">
                                <TrendingDown className="h-6 w-6 text-[#a78bfa]" />
                              </div>
                            </div>
                          </motion.div>
                        </div>
                        
                        {/* Monthly Trading Chart */}
                        <div className="bg-[#0c0f1a] p-6 rounded-xl border border-[#1e2440] shadow-sm">
                          <h3 className="text-sm font-bold text-[#e8eaf6] mb-4 uppercase tracking-wider">Monthly Trading Volume</h3>
                          {tradeAnalytics.monthlyData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={250}>
                              <BarChart data={tradeAnalytics.monthlyData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e2440" vertical={false} />
                                <XAxis dataKey="month" tick={{ fill: '#8892b0', fontSize: 12, fontFamily: 'monospace' }} axisLine={{ stroke: '#1e2440' }} tickLine={false} />
                                <YAxis tick={{ fill: '#8892b0', fontSize: 12, fontFamily: 'monospace' }} axisLine={{ stroke: '#1e2440' }} tickLine={false} />
                                <Tooltip 
                                  contentStyle={{ backgroundColor: '#111525', borderColor: '#1e2440', color: '#e8eaf6', fontFamily: 'monospace' }} 
                                  itemStyle={{ color: '#00e5a0' }}
                                />
                                <Legend wrapperStyle={{ fontFamily: 'monospace', fontSize: '12px', color: '#8892b0' }} />
                                <Bar dataKey="sold" name="Energy Sold (kWh)" fill="#00e5a0" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="bought" name="Energy Bought (kWh)" fill="#4d9fff" radius={[4, 4, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          ) : (
                            <div className="h-64 flex items-center justify-center text-[#8892b0] font-mono text-sm">
                              <p>No trading data available yet</p>
                            </div>
                          )}
                        </div>
                        
                        {/* Two Column Layout */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Trade Type Distribution */}
                          <div className="bg-[#0c0f1a] p-6 rounded-xl border border-[#1e2440] shadow-sm">
                            <h3 className="text-sm font-bold text-[#e8eaf6] mb-4 uppercase tracking-wider">Trade Distribution</h3>
                            {tradeAnalytics.tradeTypeDistribution.some(t => t.value > 0) ? (
                              <ResponsiveContainer width="100%" height={200}>
                                <PieChart>
                                  <Pie
                                    data={tradeAnalytics.tradeTypeDistribution.map(entry => ({
                                      ...entry,
                                      color: entry.name === 'Buy' ? '#4d9fff' : entry.name === 'Sell' ? '#00e5a0' : '#1e2440'
                                    }))}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                  >
                                    {tradeAnalytics.tradeTypeDistribution.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={entry.name === 'Buy' ? '#4d9fff' : '#00e5a0'} />
                                    ))}
                                  </Pie>
                                  <Tooltip 
                                    contentStyle={{ backgroundColor: '#111525', borderColor: '#1e2440', color: '#e8eaf6', fontFamily: 'monospace' }}
                                  />
                                  <Legend wrapperStyle={{ fontFamily: 'monospace', fontSize: '12px', color: '#8892b0' }} />
                                </PieChart>
                              </ResponsiveContainer>
                            ) : (
                              <div className="h-48 flex items-center justify-center text-[#8892b0] font-mono text-sm">
                                <p>No trade data available</p>
                              </div>
                            )}
                          </div>
                          
                          {/* Price History */}
                          <div className="bg-[#0c0f1a] p-6 rounded-xl border border-[#1e2440] shadow-sm">
                            <h3 className="text-sm font-bold text-[#e8eaf6] mb-4 uppercase tracking-wider">Recent Trade Prices</h3>
                            {tradeAnalytics.priceHistory.length > 0 ? (
                              <ResponsiveContainer width="100%" height={200}>
                                <LineChart data={tradeAnalytics.priceHistory}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2440" vertical={false} />
                                  <XAxis dataKey="date" tick={{ fill: '#8892b0', fontSize: 10, fontFamily: 'monospace' }} axisLine={{ stroke: '#1e2440' }} tickLine={false} />
                                  <YAxis tick={{ fill: '#8892b0', fontSize: 12, fontFamily: 'monospace' }} axisLine={{ stroke: '#1e2440' }} tickLine={false} />
                                  <Tooltip 
                                    contentStyle={{ backgroundColor: '#111525', borderColor: '#1e2440', color: '#e8eaf6', fontFamily: 'monospace' }}
                                  />
                                  <Line 
                                    type="monotone" 
                                    dataKey="price" 
                                    stroke="#a78bfa" 
                                    strokeWidth={2}
                                    dot={{ fill: "#a78bfa", strokeWidth: 0, r: 4 }}
                                    activeDot={{ r: 6, fill: "#e8eaf6" }}
                                  />
                                </LineChart>
                              </ResponsiveContainer>
                            ) : (
                              <div className="h-48 flex items-center justify-center text-[#8892b0] font-mono text-sm">
                                <p>No price history available</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </section>
                    </motion.div>
                  )}
                </AnimatePresence>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <h2 className="text-sm font-bold text-[#e8eaf6] mb-6 flex items-center uppercase tracking-wider">
                    <Edit className="mr-3 h-5 w-5 text-[#00e5a0]" />
                    Edit Profile
                  </h2>
                  
                  <div className="space-y-5">
                    <div className="bg-[#111525] p-6 rounded-xl border border-[#1e2440] shadow-sm">
                      <label htmlFor="email" className="block text-[#8892b0] font-mono text-[10px] uppercase tracking-wider font-bold mb-2 flex items-center">
                        <Mail className="h-4 w-4 mr-2" />
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full p-3 border border-[#1e2440] rounded-lg focus:ring-2 focus:ring-[#00e5a0] focus:border-transparent focus:outline-none transition-all bg-[#0c0f1a] text-[#e8eaf6] shadow-inner font-mono text-sm"
                        placeholder="Enter your email"
                      />
                    </div>
                    
                    <div className="bg-[#111525] p-6 rounded-xl border border-[#1e2440] shadow-sm">
                      <label htmlFor="userType" className="block text-[#8892b0] font-mono text-[10px] uppercase tracking-wider font-bold mb-2 flex items-center">
                        <UserCheck className="h-4 w-4 mr-2" />
                        User Type
                      </label>
                      <select
                        id="userType"
                        name="userType"
                        value={formData.userType}
                        onChange={handleChange}
                        className="w-full p-3 border border-[#1e2440] rounded-lg focus:ring-2 focus:ring-[#00e5a0] focus:border-transparent focus:outline-none transition-all bg-[#0c0f1a] text-[#e8eaf6] shadow-inner font-mono text-sm"
                      >
                        <option value="consumer">Consumer</option>
                        <option value="prosumer">Prosumer</option>
                        <option value="utility">Utility</option>
                      </select>
                    </div>
                    
                    <div className="bg-[#111525] p-6 rounded-xl border border-[#1e2440] shadow-sm">
                      <label htmlFor="location" className="block text-[#8892b0] font-mono text-[10px] uppercase tracking-wider font-bold mb-2 flex items-center">
                        <MapPin className="h-4 w-4 mr-2" />
                        Location
                      </label>
                      <input
                        type="text"
                        id="location"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        className="w-full p-3 border border-[#1e2440] rounded-lg focus:ring-2 focus:ring-[#00e5a0] focus:border-transparent focus:outline-none transition-all bg-[#0c0f1a] text-[#e8eaf6] shadow-inner font-mono text-sm"
                        placeholder="Enter your location"
                      />
                    </div>
                    
                    <div className="bg-[#111525] p-6 rounded-xl border border-[#1e2440] shadow-sm">
                      <label htmlFor="energyUsage" className="block text-[#8892b0] font-mono text-[10px] uppercase tracking-wider font-bold mb-2 flex items-center">
                        <Zap className="h-4 w-4 mr-2" />
                        Energy Usage (kWh/month)
                      </label>
                      <input
                        type="number"
                        id="energyUsage"
                        name="energyUsage"
                        value={formData.energyUsage}
                        onChange={handleChange}
                        className="w-full p-3 border border-[#1e2440] rounded-lg focus:ring-2 focus:ring-[#00e5a0] focus:border-transparent focus:outline-none transition-all bg-[#0c0f1a] text-[#e8eaf6] shadow-inner font-mono text-sm"
                        placeholder="0"
                        min="0"
                      />
                    </div>
                    
                    <div className="bg-[#111525] p-6 rounded-xl border border-[#1e2440] shadow-sm">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="hasSolarPanels"
                          name="hasSolarPanels"
                          checked={formData.hasSolarPanels}
                          onChange={handleChange}
                          className="h-5 w-5 bg-[#0c0f1a] border-[#1e2440] rounded text-[#00e5a0] focus:ring-[#00e5a0] focus:ring-offset-[#111525]"
                        />
                        <label htmlFor="hasSolarPanels" className="ml-3 block text-[#e8eaf6] font-medium flex items-center font-['Syne']">
                          <SunIcon className="h-4 w-4 mr-2 text-[#ffd166]" />
                          I have solar panels installed
                        </label>
                      </div>
                    </div>
                    
                    {/* Wallet Address (read-only in edit form) */}
                    {walletAddress && (
                      <div className="bg-[#111525] p-6 rounded-xl border border-[#1e2440] shadow-sm">
                        <label className="block text-[#8892b0] font-mono text-[10px] uppercase tracking-wider font-bold mb-2 flex items-center">
                          <Wallet className="h-4 w-4 mr-2" />
                          Connected Wallet
                        </label>
                        <div className="flex items-center">
                          <input
                            type="text"
                            value={walletAddress}
                            readOnly
                            className="w-full p-3 border border-[#1e2440] rounded-lg bg-[#0c0f1a]/50 text-[#8892b0] font-mono text-sm cursor-not-allowed"
                          />
                        </div>
                        <p className="text-[10px] text-[#8892b0] font-mono mt-2 flex items-center uppercase tracking-wider">
                          <Shield className="h-3 w-3 mr-1 text-[#ffb703]" />
                          To change your wallet, disconnect from the profile page.
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 mt-8 pt-4 border-t border-[#1e2440]">
                    <motion.button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-6 py-3 bg-[#0c0f1a] border border-[#1e2440] text-[#e8eaf6] rounded-lg font-mono text-[10px] font-bold uppercase tracking-wider shadow-sm hover:bg-[#1e2440] transition-colors"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Cancel
                    </motion.button>
                    
                    <motion.button
                      type="submit"
                      className="px-6 py-3 bg-[#00e5a0]/10 border border-[#00e5a0]/50 text-[#00e5a0] rounded-lg flex items-center justify-center font-mono text-[10px] font-bold uppercase tracking-wider shadow-sm hover:bg-[#00e5a0]/20 transition-colors"
                      whileHover={{ scale: 1.02, boxShadow: "0px 0px 15px rgba(0,229,160,0.2)" }}
                      whileTap={{ scale: 0.98 }}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </motion.button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </>
  );
};

export default Profile;
