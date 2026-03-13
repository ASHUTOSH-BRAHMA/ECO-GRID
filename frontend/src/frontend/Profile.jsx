import React, { useState, useEffect, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../Context/AuthContext";
import { useWallet } from "../Context/WalletContext";
import NavBar from "./NavBar";
import {
  Edit, Save, User, MapPin, Zap, SunIcon, X, Loader2,
  Mail, UserCheck, Wallet, ExternalLink, Calendar, Shield,
  BadgeCheck, BarChart3, TrendingUp, TrendingDown, Settings,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend,
} from "recharts";
import { handleerror, handlesuccess } from "../../utils";
import axios from "axios";
import { API_BASE_URL, apiUrl } from "../config";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * After AuthContext.normalizeUser runs, `user` is always a flat User doc:
 *   { _id, name, email, userType, onboardingCompleted, profile: { location, ... } }
 *
 * These small helpers read from that shape safely everywhere.
 */
const userName  = (u) => u?.name  ?? "User";
const userEmail = (u) => u?.email ?? "";
const userType  = (u) => u?.userType ?? "consumer";
const userCreatedAt = (u) => u?.createdAt ?? null;

// ─── Component ────────────────────────────────────────────────────────────────
const Profile = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
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
    walletAddress: "",
    forecastEngine: "grid",
    forecastZone: "Northern",
  });

  const { isConnected, walletAddress, connect, refreshBalances } = useWallet();
  const [isConnecting, setIsConnecting] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [userStats, setUserStats] = useState({
    totalTrades: 0, kwhSold: 0, kwhBought: 0, carbonSaved: 0, recentTx: [],
  });
  const [tradeAnalytics, setTradeAnalytics] = useState({
    monthlyData: [], tradeTypeDistribution: [], priceHistory: [],
  });

  const api = axios.create({ baseURL: API_BASE_URL, withCredentials: true });

  // ── Fetch profile ────────────────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
    if (!token) { setLoading(false); return; }

    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await api.get("/user/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = response.data;
        setProfile(data);

        // data here is the raw UserProfile doc { location, energyUsage, user: {...} }
        // We do NOT rely on data.user for email/userType — we read from AuthContext
        // which is already normalised (flat shape) via normalizeUser().
        setFormData({
          location:       data.location        ?? "",
          energyUsage:    data.energyUsage      ?? 0,
          hasSolarPanels: data.hasSolarPanels   ?? false,
          walletAddress:  data.walletAddress    ?? "",
          forecastEngine: data.forecastEngine   ?? "grid",
          forecastZone:   data.forecastZone     ?? "Northern",
          // Always read identity fields from the normalised AuthContext user
          email:    userEmail(user),
          userType: userType(user),
        });
      } catch (err) {
        if (err.response?.status === 404) {
          // New Google user – no profile doc exists yet, that's fine
          setProfile(null);
          setFormData((prev) => ({
            ...prev,
            email:    userEmail(user),
            userType: userType(user),
          }));
        } else {
          setError(err.message);
          handleerror(err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]); // re-run if context user changes (e.g. after Google login)

  // ── Fetch transaction stats ──────────────────────────────────────────────────
  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
        if (!token) return;

        const res = await fetch(apiUrl("/user/transactions"), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;

        const data = await res.json();
        if (!data.success) return;

        const txs = data.transactions;
        const kwhSold   = txs.filter((t) => t.type === "sold").reduce((s, t) => s + (Number(t.energyKwh) || 0), 0);
        const kwhBought = txs.filter((t) => t.type === "bought").reduce((s, t) => s + (Number(t.energyKwh) || 0), 0);
        const carbonSaved = (kwhSold * 0.62).toFixed(1);

        setUserStats({
          totalTrades: txs.length,
          kwhSold:  kwhSold.toFixed(1),
          kwhBought: kwhBought.toFixed(1),
          carbonSaved,
          recentTx: txs.slice(0, 3),
        });

        const monthlyMap = new Map();
        txs.forEach((tx) => {
          const monthKey = new Date(tx.timestamp).toLocaleDateString("en-US", { month: "short", year: "numeric" });
          if (!monthlyMap.has(monthKey))
            monthlyMap.set(monthKey, { month: monthKey, sold: 0, bought: 0, revenue: 0, spent: 0 });
          const m = monthlyMap.get(monthKey);
          if (tx.type === "sold") { m.sold += Number(tx.energyKwh) || 0; m.revenue += Number(tx.amount) || 0; }
          else                    { m.bought += Number(tx.energyKwh) || 0; m.spent += Number(tx.amount) || 0; }
        });

        setTradeAnalytics({
          monthlyData: Array.from(monthlyMap.values()).slice(-6),
          tradeTypeDistribution: [
            { name: "Sold",   value: kwhSold,   color: "#10b981" },
            { name: "Bought", value: kwhBought, color: "#3b82f6" },
          ],
          priceHistory: txs.slice(-10).map((tx) => ({
            date:  new Date(tx.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            price: tx.energyKwh > 0 ? (tx.amount / tx.energyKwh).toFixed(3) : 0,
            type:  tx.type,
          })),
        });
      } catch (err) {
        console.error("Error fetching user stats:", err);
      }
    };

    // user._id is available on the normalised shape directly
    if (user?._id) fetchUserStats();
  }, [user]);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    try {
      setLoading(true);
      const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
      const response = await api.put("/user/profile", formData, {
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      setProfile(response.data);
      setIsEditing(false);
      handlesuccess("Profile updated successfully");
    } catch (err) {
      handleerror(err.message);
    } finally {
      setLoading(false);
    }
  };

  const connectWallet = async () => {
    try {
      setIsConnecting(true);
      await connect();
      handlesuccess("Wallet connected successfully!");
      const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
      if (walletAddress) {
        await api.put("/user/profile", { walletAddress }, {
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        });
      }
    } catch (error) {
      console.error("Error connecting wallet:", error);
      handleerror("Failed to connect wallet.");
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    handleerror("Please disconnect your wallet directly from the MetaMask extension.");
  };

  // ── Animation variants ───────────────────────────────────────────────────────
  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.6 } },
    exit:    { opacity: 0, y: 20, transition: { duration: 0.3 } },
  };
  const cardVariants = {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1, transition: { duration: 0.5, delay: 0.2 } },
  };
  const tabVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit:    { opacity: 0, y: 10, transition: { duration: 0.2 } },
  };

  // ── Loading / error states ────────────────────────────────────────────────────
  if (loading && !profile) {
    return (
      <>
        <NavBar />
        <div className="min-h-screen pt-24 bg-[#060810] flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="h-16 w-16 rounded-full bg-[#111525] border border-[#1e2440] flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-[#00e5a0] animate-spin" />
              </div>
              <div className="absolute -bottom-1 -right-1 h-6 w-6 bg-[#0c0f1a] rounded-full flex items-center justify-center border border-[#1e2440]">
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
            <p className="text-[#8892b0] text-sm mb-4 font-mono">{error || "Please log in again."}</p>
            <button
              onClick={() => navigate("/login")}
              className="px-6 py-2 bg-[#00e5a0]/10 border border-[#00e5a0]/50 text-[#00e5a0] rounded-lg font-mono text-sm tracking-wider uppercase hover:bg-[#00e5a0]/20 transition-colors"
            >
              Go to Login
            </button>
          </div>
        </div>
      </>
    );
  }

  // ── Derived display values (all from normalised user) ────────────────────────
  const displayName      = userName(user);
  const displayEmail     = userEmail(user);
  const displayUserType  = userType(user);
  const displayCreatedAt = userCreatedAt(user);
  const onboardingDone   = user?.onboardingCompleted ?? false;

  const createdAtFormatted = displayCreatedAt
    ? new Date(displayCreatedAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
    : "Unknown";

  const createdAtShort = displayCreatedAt
    ? new Date(displayCreatedAt).toLocaleDateString("en-US", { year: "numeric", month: "short" })
    : "Unknown";

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <>
      <NavBar />
      <motion.div
        className="min-h-screen bg-[#060810] text-[#e8eaf6] pt-24 pb-16 px-4"
        variants={pageVariants} initial="initial" animate="animate" exit="exit"
      >
        <div className="max-w-5xl mx-auto">
          <motion.div
            className="bg-[#0c0f1a] rounded-2xl shadow-[0_0_20px_rgba(0,0,0,0.5)] overflow-hidden border border-[#1e2440]"
            variants={cardVariants}
          >
            {/* ── Profile Header ─────────────────────────────────────────────── */}
            <div className="bg-[#111525] p-8 text-[#e8eaf6] relative overflow-hidden border-b border-[#1e2440]">
              <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-[#00e5a0] opacity-5 filter blur-[100px]" />
              <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-[#4d9fff] opacity-5 filter blur-[100px]" />

              <div className="relative z-10 flex flex-col md:flex-row md:items-center">
                <div className="bg-[#0c0f1a] p-1.5 rounded-full mb-4 md:mb-0 md:mr-6 shadow-[0_0_15px_rgba(0,229,160,0.1)] border border-[#1e2440]">
                  <div className="bg-[#111525] rounded-full h-24 w-24 flex items-center justify-center">
                    <User size={48} className="text-[#00e5a0]" />
                  </div>
                </div>

                <div className="flex-1">
                  <h1 className="text-3xl font-bold tracking-tight font-['Syne']">{displayName}</h1>
                  <p className="text-[#8892b0] flex items-center mt-1 font-mono text-sm">
                    <Mail className="h-4 w-4 mr-2" /> {displayEmail}
                  </p>

                  <div className="flex mt-3 items-center flex-wrap gap-2">
                    <span className="px-3 py-1 bg-[#1e2440] border border-[#a78bfa]/30 rounded text-xs font-mono uppercase tracking-wider font-bold text-[#a78bfa] flex items-center">
                      <BadgeCheck className="h-4 w-4 mr-1" />
                      {displayUserType.charAt(0).toUpperCase() + displayUserType.slice(1)}
                    </span>

                    {!onboardingDone && (
                      <span className="px-3 py-1 bg-[#ffb703]/10 border border-[#ffb703]/30 text-[#ffb703] rounded text-xs font-mono uppercase tracking-wider font-bold flex items-center">
                        <Shield className="h-4 w-4 mr-1" /> Complete Onboarding
                      </span>
                    )}

                    <span className="px-3 py-1 bg-[#111525] border border-[#1e2440] text-[#8892b0] rounded text-xs font-mono uppercase tracking-wider font-bold flex items-center">
                      <Calendar className="h-4 w-4 mr-1" /> {createdAtShort}
                    </span>
                  </div>
                </div>

                {!isEditing ? (
                  <motion.button
                    onClick={() => setIsEditing(true)}
                    className="mt-4 md:mt-0 px-4 py-2 bg-[#111525] border border-[#1e2440] text-[#00e5a0] rounded-lg flex items-center font-mono text-sm uppercase tracking-wider hover:bg-[#1e2440] transition-colors"
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  >
                    <Edit size={16} className="mr-2" /> Edit Profile
                  </motion.button>
                ) : (
                  <motion.button
                    onClick={() => setIsEditing(false)}
                    className="mt-4 md:mt-0 px-4 py-2 bg-[#ff4d6d]/10 border border-[#ff4d6d]/30 text-[#ff4d6d] rounded-lg flex items-center font-mono text-sm uppercase tracking-wider hover:bg-[#ff4d6d]/20 transition-colors"
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  >
                    <X size={16} className="mr-2" /> Cancel
                  </motion.button>
                )}
              </div>
            </div>

            {/* ── Tab Navigation ─────────────────────────────────────────────── */}
            <div className="border-b border-[#1e2440] bg-[#0c0f1a]">
              <div className="flex space-x-1 px-6 overflow-x-auto">
                {[
                  { id: "profile",   label: "Profile Information" },
                  { id: "wallet",    label: "Wallet" },
                  { id: "energy",    label: "Energy Statistics" },
                  { id: "analytics", label: "Analytics",  icon: <BarChart3 className="w-4 h-4" /> },
                  { id: "settings",  label: "Settings",   icon: <Settings className="w-4 h-4" /> },
                ].map(({ id, label, icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`py-4 px-4 font-mono text-xs uppercase tracking-wider transition-colors relative whitespace-nowrap ${
                      activeTab === id ? "text-[#00e5a0] font-bold" : "text-[#8892b0] hover:text-[#e8eaf6]"
                    }`}
                  >
                    <span className="flex items-center gap-1">
                      {icon} {label}
                    </span>
                    {activeTab === id && (
                      <motion.div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00e5a0]" layoutId="activeTab" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Tab Content ────────────────────────────────────────────────── */}
            <div className="p-8">
              {!isEditing ? (
                <AnimatePresence mode="wait">

                  {/* PROFILE TAB */}
                  {activeTab === "profile" && (
                    <motion.div key="profile" variants={tabVariants} initial="initial" animate="animate" exit="exit" className="space-y-8">
                      <section>
                        <h2 className="text-sm font-bold text-[#e8eaf6] mb-6 flex items-center uppercase tracking-wider">
                          <UserCheck className="mr-3 h-5 w-5 text-[#00e5a0]" /> Profile Information
                        </h2>
                        <div className="grid md:grid-cols-2 gap-6">
                          {/* User Type */}
                          <InfoCard icon={<UserCheck className="text-[#a78bfa] h-5 w-5" />} accentColor="[#a78bfa]" label="User Type"
                            value={displayUserType.charAt(0).toUpperCase() + displayUserType.slice(1) || "Consumer"} />
                          {/* Email */}
                          <InfoCard icon={<Mail className="text-[#4d9fff] h-5 w-5" />} accentColor="[#4d9fff]" label="Email"
                            value={displayEmail || "No email provided"} />
                          {/* Location */}
                          <InfoCard icon={<MapPin className="text-[#ffb703] h-5 w-5" />} accentColor="[#ffb703]" label="Location"
                            value={profile?.location || "Not specified"} />
                          {/* Energy Usage */}
                          <InfoCard icon={<Zap className="text-[#00e5a0] h-5 w-5" />} accentColor="[#00e5a0]" label="Energy Usage"
                            value={<>{profile?.energyUsage || "0"} <span className="text-[#8892b0] text-sm font-mono">kWh/m</span></>} />
                          {/* Solar Panels */}
                          <InfoCard icon={<SunIcon className="text-[#ffd166] h-5 w-5" />} accentColor="[#ffd166]" label="Solar Panels"
                            value={
                              <div className="flex items-center mt-1">
                                <span className={`inline-block w-2 h-2 rounded-full mr-2 ${profile?.hasSolarPanels ? "bg-[#00e5a0]" : "bg-[#1e2440]"}`} />
                                {profile?.hasSolarPanels ? "Installed" : "None"}
                              </div>
                            } />
                          {/* Member Since */}
                          <InfoCard icon={<Calendar className="text-[#ff4d6d] h-5 w-5" />} accentColor="[#ff4d6d]" label="Member Since"
                            value={createdAtFormatted} />
                        </div>
                      </section>
                    </motion.div>
                  )}

                  {/* WALLET TAB */}
                  {activeTab === "wallet" && (
                    <motion.div key="wallet" variants={tabVariants} initial="initial" animate="animate" exit="exit">
                      <section>
                        <h2 className="text-sm font-bold text-[#e8eaf6] mb-6 flex items-center uppercase tracking-wider">
                          <Wallet className="mr-3 h-5 w-5 text-[#00e5a0]" /> Metamask Wallet
                        </h2>
                        <div className="bg-[#111525] p-8 rounded-xl border border-[#1e2440]">
                          {isConnected ? (
                            <div className="space-y-6">
                              <div className="flex flex-col md:flex-row md:items-center gap-6">
                                <div className="bg-[#ffb703]/10 border border-[#ffb703]/30 p-4 rounded-xl">
                                  <Wallet className="h-12 w-12 text-[#ffb703]" />
                                </div>
                                <div className="flex-1">
                                  <h3 className="text-xl font-bold text-[#e8eaf6] mb-1 font-['Syne']">Connected Wallet</h3>
                                  <div className="bg-[#0c0f1a] p-3 rounded-lg border border-[#1e2440]">
                                    <p className="text-sm text-[#8892b0] font-mono break-all">{walletAddress}</p>
                                  </div>
                                </div>
                              </div>
                              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                <a href={`https://amoy.polygonscan.com/address/${walletAddress}`} target="_blank" rel="noopener noreferrer"
                                  className="text-[10px] font-mono uppercase tracking-wider font-bold bg-[#4d9fff]/10 border border-[#4d9fff]/30 text-[#4d9fff] hover:bg-[#4d9fff]/20 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
                                  View on Polygonscan <ExternalLink className="h-4 w-4" />
                                </a>
                                <motion.button onClick={disconnectWallet}
                                  className="px-4 py-2 bg-[#ff4d6d]/10 border border-[#ff4d6d]/30 text-[#ff4d6d] rounded-lg flex items-center font-mono text-[10px] uppercase tracking-wider font-bold hover:bg-[#ff4d6d]/20 transition-colors"
                                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                  <X size={16} className="mr-2" /> Disconnect Wallet
                                </motion.button>
                              </div>
                              <div className="bg-[#4d9fff]/5 border border-[#4d9fff]/30 rounded-lg p-4 text-[#4d9fff] text-xs font-mono uppercase tracking-widest leading-relaxed">
                                <p className="flex items-start"><Shield className="h-5 w-5 mr-3 mt-0.5" />Your wallet is securely connected. You can now participate in energy trading on the blockchain.</p>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-6">
                              <div className="flex flex-col md:flex-row md:items-center gap-6">
                                <div className="bg-[#1e2440] p-4 rounded-xl border border-[#1e2440]">
                                  <Wallet className="h-12 w-12 text-[#8892b0]" />
                                </div>
                                <div className="flex-1">
                                  <h3 className="text-xl font-bold text-[#e8eaf6] mb-2 font-['Syne']">No Wallet Connected</h3>
                                  <p className="text-[#8892b0] text-sm font-mono">Connect your Metamask wallet to participate in energy trading on the blockchain.</p>
                                </div>
                              </div>
                              <motion.button onClick={connectWallet} disabled={isConnecting}
                                className="w-full sm:w-auto px-6 py-3 bg-[#ffb703]/10 border border-[#ffb703]/30 text-[#ffb703] rounded-lg flex items-center justify-center font-mono text-[10px] font-bold uppercase tracking-wider hover:bg-[#ffb703]/20 transition-colors"
                                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                {isConnecting ? <><Loader2 size={18} className="mr-2 animate-spin" />Connecting...</> : <><Wallet size={18} className="mr-2" />Connect Metamask</>}
                              </motion.button>
                            </div>
                          )}
                        </div>
                      </section>
                    </motion.div>
                  )}

                  {/* ENERGY STATISTICS TAB */}
                  {activeTab === "energy" && (
                    <motion.div key="energy" variants={tabVariants} initial="initial" animate="animate" exit="exit">
                      <section className="space-y-6">
                        <h2 className="text-sm font-bold text-[#e8eaf6] mb-6 flex items-center uppercase tracking-wider">
                          <Zap className="mr-3 h-5 w-5 text-[#00e5a0]" /> Energy Statistics
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <StatCard label="Monthly Consumption" value={profile?.energyUsage || "0"} sub="kWh used" color="[#00e5a0]" Icon={Zap} />
                          <StatCard label="Energy Produced" value={userStats.kwhSold} sub="kWh sold this period" color="[#ffd166]" Icon={SunIcon} />
                          <StatCard label="Total Trades" value={userStats.totalTrades} sub="completed trades" color="[#4d9fff]" Icon={Wallet} />
                          <StatCard label="Carbon Saved" value={userStats.carbonSaved} sub="kg CO₂" color="[#a78bfa]" Icon={Shield} />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div className="bg-[#0c0f1a] p-6 rounded-xl border border-[#1e2440]">
                            <h3 className="text-sm font-bold text-[#e8eaf6] mb-4 uppercase tracking-wider">Trading Activity</h3>
                            <div className="space-y-4">
                              {[
                                { emoji: "☀️", label: "Solar", sub: profile?.hasSolarPanels ? "Active" : "Not Installed", kwh: profile?.hasSolarPanels ? "45 kWh" : "0 kWh", pct: profile?.hasSolarPanels ? "65%" : "0%", color: "[#ffd166]" },
                                { emoji: "💨", label: "Wind", sub: "Community Grid", kwh: "15 kWh", pct: "22%", color: "[#4d9fff]" },
                                { emoji: "💧", label: "Hydro", sub: "Regional Grid", kwh: "9 kWh", pct: "13%", color: "[#00e5a0]" },
                              ].map(({ emoji, label, sub, kwh, pct, color }) => (
                                <div key={label} className="flex items-center justify-between border-b border-[#1e2440] pb-3 last:border-0 last:pb-0">
                                  <div className="flex items-center">
                                    <div className={`w-10 h-10 bg-${color}/10 border border-${color}/30 rounded-full flex items-center justify-center mr-3`}>
                                      <span className="text-xl">{emoji}</span>
                                    </div>
                                    <div>
                                      <p className="font-bold text-[#e8eaf6] font-['Syne']">{label}</p>
                                      <p className="text-[10px] font-mono text-[#8892b0] uppercase tracking-wider">{sub}</p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className={`font-bold text-${color} text-sm font-mono`}>{kwh}</p>
                                    <p className="text-[10px] text-[#8892b0]">{pct}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="bg-[#0c0f1a] p-6 rounded-xl border border-[#1e2440]">
                            <h3 className="text-sm font-bold text-[#e8eaf6] mb-4 uppercase tracking-wider">Recent Activity</h3>
                            <div className="space-y-3">
                              {userStats.recentTx.length === 0 ? (
                                <p className="text-[#8892b0] text-sm font-mono">No recent transactions yet.</p>
                              ) : userStats.recentTx.map((tx, i) => (
                                <div key={tx._id || i} className={`flex items-center p-3 rounded border ${tx.type === "sold" ? "bg-[#00e5a0]/5 border-[#00e5a0]/20" : "bg-[#4d9fff]/5 border-[#4d9fff]/20"}`}>
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 border ${tx.type === "sold" ? "bg-[#00e5a0]/10 border-[#00e5a0]/30" : "bg-[#4d9fff]/10 border-[#4d9fff]/30"}`}>
                                    <Zap className={`h-4 w-4 ${tx.type === "sold" ? "text-[#00e5a0]" : "text-[#4d9fff]"}`} />
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-xs font-bold font-mono uppercase tracking-wider text-[#e8eaf6]">{tx.type === "sold" ? "Energy Sold" : "Energy Purchased"}</p>
                                    <p className="text-[10px] text-[#8892b0] font-mono">{new Date(tx.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                                  </div>
                                  <span className={`text-sm font-bold font-mono ${tx.type === "sold" ? "text-[#00e5a0]" : "text-[#4d9fff]"}`}>
                                    {tx.type === "sold" ? "+" : "-"}{tx.energyKwh} kWh
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="bg-[#111525] p-6 rounded-xl border border-[#1e2440]">
                          <h3 className="text-sm font-bold text-[#e8eaf6] mb-4 uppercase tracking-wider">Monthly Energy Goals</h3>
                          <div className="space-y-4">
                            {[
                              { label: "Consumption Target", value: `${profile?.energyUsage || 0}/${(profile?.energyUsage || 0) + 50} kWh`, pct: Math.min(((profile?.energyUsage || 0) / ((profile?.energyUsage || 0) + 50)) * 100, 100), color: "bg-[#00e5a0] shadow-[0_0_10px_rgba(0,229,160,0.8)]" },
                              { label: "Production Goal", value: profile?.hasSolarPanels ? "45/60 kWh" : "0/0 kWh", pct: profile?.hasSolarPanels ? 75 : 0, color: "bg-[#ffd166] shadow-[0_0_10px_rgba(255,209,102,0.8)]" },
                              { label: "Carbon Reduction", value: profile?.hasSolarPanels ? "28/40 kg" : "0/0 kg", pct: profile?.hasSolarPanels ? 70 : 0, color: "bg-[#a78bfa] shadow-[0_0_10px_rgba(167,139,250,0.8)]" },
                            ].map(({ label, value, pct, color }) => (
                              <div key={label}>
                                <div className="flex justify-between text-[10px] font-mono uppercase tracking-wider mb-1">
                                  <span className="text-[#8892b0]">{label}</span>
                                  <span className="font-bold text-[#00e5a0]">{value}</span>
                                </div>
                                <div className="w-full bg-[#1e2440] rounded-full h-1.5 overflow-hidden">
                                  <div className={`${color} h-1.5 rounded-full`} style={{ width: `${pct}%` }} />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </section>
                    </motion.div>
                  )}

                  {/* ANALYTICS TAB */}
                  {activeTab === "analytics" && (
                    <motion.div key="analytics" variants={tabVariants} initial="initial" animate="animate" exit="exit">
                      <section className="space-y-6">
                        <h2 className="text-sm font-bold text-[#e8eaf6] mb-6 flex items-center uppercase tracking-wider">
                          <BarChart3 className="mr-3 h-5 w-5 text-[#00e5a0]" /> Trading Analytics
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <StatCard label="Total Energy Traded" value={(parseFloat(userStats.kwhSold) + parseFloat(userStats.kwhBought)).toFixed(1)} sub="kWh" color="[#00e5a0]" Icon={TrendingUp} />
                          <StatCard label="Net Position" value={(parseFloat(userStats.kwhSold) - parseFloat(userStats.kwhBought)).toFixed(1)} sub="kWh" color="[#4d9fff]" Icon={Zap} />
                          <StatCard label="Trade Ratio" value={userStats.kwhBought > 0 ? (parseFloat(userStats.kwhSold) / parseFloat(userStats.kwhBought)).toFixed(2) : "0.00"} sub="Sold/Bought" color="[#a78bfa]" Icon={TrendingDown} />
                        </div>

                        <div className="bg-[#0c0f1a] p-6 rounded-xl border border-[#1e2440]">
                          <h3 className="text-sm font-bold text-[#e8eaf6] mb-4 uppercase tracking-wider">Monthly Trading Volume</h3>
                          {tradeAnalytics.monthlyData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={250}>
                              <BarChart data={tradeAnalytics.monthlyData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e2440" vertical={false} />
                                <XAxis dataKey="month" tick={{ fill: "#8892b0", fontSize: 12, fontFamily: "monospace" }} axisLine={{ stroke: "#1e2440" }} tickLine={false} />
                                <YAxis tick={{ fill: "#8892b0", fontSize: 12, fontFamily: "monospace" }} axisLine={{ stroke: "#1e2440" }} tickLine={false} />
                                <Tooltip contentStyle={{ backgroundColor: "#111525", borderColor: "#1e2440", color: "#e8eaf6", fontFamily: "monospace" }} />
                                <Legend wrapperStyle={{ fontFamily: "monospace", fontSize: "12px", color: "#8892b0" }} />
                                <Bar dataKey="sold" name="Energy Sold (kWh)" fill="#00e5a0" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="bought" name="Energy Bought (kWh)" fill="#4d9fff" radius={[4, 4, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          ) : (
                            <div className="h-64 flex items-center justify-center text-[#8892b0] font-mono text-sm">No trading data available yet</div>
                          )}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div className="bg-[#0c0f1a] p-6 rounded-xl border border-[#1e2440] overflow-hidden">
                            <h3 className="text-sm font-bold text-[#e8eaf6] mb-4 uppercase tracking-wider">Trade Distribution</h3>
                            {tradeAnalytics.tradeTypeDistribution.some((t) => t.value > 0) ? (
                              <ResponsiveContainer width="100%" height={200}>
                                <PieChart>
                                  <Pie data={tradeAnalytics.tradeTypeDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                                    {tradeAnalytics.tradeTypeDistribution.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={entry.name === "Bought" ? "#4d9fff" : "#00e5a0"} />
                                    ))}
                                  </Pie>
                                  <Tooltip contentStyle={{ backgroundColor: "#111525", borderColor: "#1e2440", color: "#e8eaf6", fontFamily: "monospace" }} />
                                  <Legend wrapperStyle={{ fontFamily: "monospace", fontSize: "12px", color: "#8892b0" }} />
                                </PieChart>
                              </ResponsiveContainer>
                            ) : (
                              <div className="h-48 flex items-center justify-center text-[#8892b0] font-mono text-sm">No trade data available</div>
                            )}
                          </div>

                          <div className="bg-[#0c0f1a] p-6 rounded-xl border border-[#1e2440] overflow-hidden">
                            <h3 className="text-sm font-bold text-[#e8eaf6] mb-4 uppercase tracking-wider">Recent Trade Prices</h3>
                            {tradeAnalytics.priceHistory.length > 0 ? (
                              <ResponsiveContainer width="100%" height={200}>
                                <LineChart data={tradeAnalytics.priceHistory}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2440" vertical={false} />
                                  <XAxis dataKey="date" tick={{ fill: "#8892b0", fontSize: 10, fontFamily: "monospace" }} axisLine={{ stroke: "#1e2440" }} tickLine={false} />
                                  <YAxis tick={{ fill: "#8892b0", fontSize: 12, fontFamily: "monospace" }} axisLine={{ stroke: "#1e2440" }} tickLine={false} />
                                  <Tooltip contentStyle={{ backgroundColor: "#111525", borderColor: "#1e2440", color: "#e8eaf6", fontFamily: "monospace" }} />
                                  <Line type="monotone" dataKey="price" stroke="#a78bfa" strokeWidth={2} dot={{ fill: "#a78bfa", strokeWidth: 0, r: 4 }} activeDot={{ r: 6, fill: "#e8eaf6" }} />
                                </LineChart>
                              </ResponsiveContainer>
                            ) : (
                              <div className="h-48 flex items-center justify-center text-[#8892b0] font-mono text-sm">No price history available</div>
                            )}
                          </div>
                        </div>
                      </section>
                    </motion.div>
                  )}

                  {/* SETTINGS TAB */}
                  {activeTab === "settings" && (
                    <motion.div key="settings" variants={tabVariants} initial="initial" animate="animate" exit="exit">
                      <section className="space-y-6">
                        <h2 className="text-sm font-bold text-[#e8eaf6] mb-6 flex items-center uppercase tracking-wider">
                          <Settings className="mr-3 h-5 w-5 text-[#00e5a0]" /> Application Settings
                        </h2>
                        <div className="bg-[#111525] p-6 rounded-xl border border-[#1e2440]">
                          <h3 className="text-[#8892b0] font-mono text-xs uppercase tracking-wider font-bold mb-4 flex items-center">
                            <Zap className="h-4 w-4 mr-2 text-[#00e5a0]" /> Energy Forecast Preferences
                          </h3>
                          <p className="text-[#8892b0] text-sm mb-6 font-mono">Configure your default parameters for the Energy Forecast engine.</p>
                          <div className="space-y-5">
                            <div>
                              <label htmlFor="forecastEngine" className="block text-[#e8eaf6] font-medium font-['Syne'] mb-2">Default Forecasting Engine</label>
                              <select id="forecastEngine" name="forecastEngine" value={formData.forecastEngine} onChange={handleChange}
                                className="w-full p-3 border border-[#1e2440] rounded-lg focus:ring-2 focus:ring-[#00e5a0] focus:outline-none bg-[#0c0f1a] text-[#e8eaf6] font-mono text-sm">
                                <option value="grid">Grid Analytics Engine (Zone LSTM)</option>
                                <option value="city">City Climate Engine (Weather LSTM)</option>
                                <option value="xgb">Historical Analytics Engine (XGBoost)</option>
                              </select>
                            </div>
                            <div>
                              <label htmlFor="forecastZone" className="block text-[#e8eaf6] font-medium font-['Syne'] mb-2">Preferred Predictive Zone</label>
                              <select id="forecastZone" name="forecastZone" value={formData.forecastZone} onChange={handleChange}
                                className="w-full p-3 border border-[#1e2440] rounded-lg focus:ring-2 focus:ring-[#00e5a0] focus:outline-none bg-[#0c0f1a] text-[#e8eaf6] font-mono text-sm">
                                {["Northern", "Southern", "Eastern", "Western", "Central"].map((z) => (
                                  <option key={z} value={z}>{z} Zone</option>
                                ))}
                              </select>
                            </div>
                            <div className="pt-4">
                              <motion.button type="button" onClick={handleSubmit} disabled={loading}
                                className="px-6 py-3 bg-[#00e5a0]/10 border border-[#00e5a0]/50 text-[#00e5a0] rounded-lg flex items-center justify-center font-mono text-[10px] font-bold uppercase tracking-wider hover:bg-[#00e5a0]/20 transition-colors"
                                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : <><Save className="mr-2 h-4 w-4" />Save Preferences</>}
                              </motion.button>
                            </div>
                          </div>
                        </div>
                      </section>
                    </motion.div>
                  )}

                </AnimatePresence>
              ) : (
                /* EDIT FORM */
                <form onSubmit={handleSubmit} className="space-y-6">
                  <h2 className="text-sm font-bold text-[#e8eaf6] mb-6 flex items-center uppercase tracking-wider">
                    <Edit className="mr-3 h-5 w-5 text-[#00e5a0]" /> Edit Profile
                  </h2>
                  <div className="space-y-5">
                    {[
                      { id: "email", label: "Email", type: "email", icon: <Mail />, placeholder: "Enter your email" },
                      { id: "location", label: "Location", type: "text", icon: <MapPin />, placeholder: "Enter your location" },
                    ].map(({ id, label, type, icon, placeholder }) => (
                      <div key={id} className="bg-[#111525] p-6 rounded-xl border border-[#1e2440]">
                        <label htmlFor={id} className="block text-[#8892b0] font-mono text-[10px] uppercase tracking-wider font-bold mb-2 flex items-center">
                          {React.cloneElement(icon, { className: "h-4 w-4 mr-2" })} {label}
                        </label>
                        <input type={type} id={id} name={id} value={formData[id]} onChange={handleChange} placeholder={placeholder}
                          className="w-full p-3 border border-[#1e2440] rounded-lg focus:ring-2 focus:ring-[#00e5a0] focus:outline-none bg-[#0c0f1a] text-[#e8eaf6] font-mono text-sm" />
                      </div>
                    ))}

                    <div className="bg-[#111525] p-6 rounded-xl border border-[#1e2440]">
                      <label htmlFor="userType" className="block text-[#8892b0] font-mono text-[10px] uppercase tracking-wider font-bold mb-2 flex items-center">
                        <UserCheck className="h-4 w-4 mr-2" /> User Type
                      </label>
                      <select id="userType" name="userType" value={formData.userType} onChange={handleChange}
                        className="w-full p-3 border border-[#1e2440] rounded-lg focus:ring-2 focus:ring-[#00e5a0] focus:outline-none bg-[#0c0f1a] text-[#e8eaf6] font-mono text-sm">
                        <option value="consumer">Consumer</option>
                        <option value="prosumer">Prosumer</option>
                        <option value="utility">Utility</option>
                      </select>
                    </div>

                    <div className="bg-[#111525] p-6 rounded-xl border border-[#1e2440]">
                      <label htmlFor="energyUsage" className="block text-[#8892b0] font-mono text-[10px] uppercase tracking-wider font-bold mb-2 flex items-center">
                        <Zap className="h-4 w-4 mr-2" /> Energy Usage (kWh/month)
                      </label>
                      <input type="number" id="energyUsage" name="energyUsage" value={formData.energyUsage} onChange={handleChange} placeholder="0" min="0"
                        className="w-full p-3 border border-[#1e2440] rounded-lg focus:ring-2 focus:ring-[#00e5a0] focus:outline-none bg-[#0c0f1a] text-[#e8eaf6] font-mono text-sm" />
                    </div>

                    <div className="bg-[#111525] p-6 rounded-xl border border-[#1e2440]">
                      <div className="flex items-center">
                        <input type="checkbox" id="hasSolarPanels" name="hasSolarPanels" checked={formData.hasSolarPanels} onChange={handleChange}
                          className="h-5 w-5 bg-[#0c0f1a] border-[#1e2440] rounded text-[#00e5a0] focus:ring-[#00e5a0]" />
                        <label htmlFor="hasSolarPanels" className="ml-3 block text-[#e8eaf6] font-medium flex items-center font-['Syne']">
                          <SunIcon className="h-4 w-4 mr-2 text-[#ffd166]" /> I have solar panels installed
                        </label>
                      </div>
                    </div>

                    {walletAddress && (
                      <div className="bg-[#111525] p-6 rounded-xl border border-[#1e2440]">
                        <label className="block text-[#8892b0] font-mono text-[10px] uppercase tracking-wider font-bold mb-2 flex items-center">
                          <Wallet className="h-4 w-4 mr-2" /> Connected Wallet
                        </label>
                        <input type="text" value={walletAddress} readOnly className="w-full p-3 border border-[#1e2440] rounded-lg bg-[#0c0f1a]/50 text-[#8892b0] font-mono text-sm cursor-not-allowed" />
                        <p className="text-[10px] text-[#8892b0] font-mono mt-2 flex items-center uppercase tracking-wider">
                          <Shield className="h-3 w-3 mr-1 text-[#ffb703]" /> To change your wallet, disconnect from MetaMask directly.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 mt-8 pt-4 border-t border-[#1e2440]">
                    <motion.button type="button" onClick={() => setIsEditing(false)}
                      className="px-6 py-3 bg-[#0c0f1a] border border-[#1e2440] text-[#e8eaf6] rounded-lg font-mono text-[10px] font-bold uppercase tracking-wider hover:bg-[#1e2440] transition-colors"
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      Cancel
                    </motion.button>
                    <motion.button type="submit" disabled={loading}
                      className="px-6 py-3 bg-[#00e5a0]/10 border border-[#00e5a0]/50 text-[#00e5a0] rounded-lg flex items-center justify-center font-mono text-[10px] font-bold uppercase tracking-wider hover:bg-[#00e5a0]/20 transition-colors"
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : <><Save className="mr-2 h-4 w-4" />Save Changes</>}
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

// ─── Small reusable sub-components ────────────────────────────────────────────

const InfoCard = ({ icon, label, value }) => (
  <div className="bg-[#111525] p-6 rounded-xl border border-[#1e2440] hover:border-[#a78bfa]/30 transition-colors group">
    <div className="flex items-start">
      <div className="bg-[#0c0f1a] border border-[#1e2440] p-3 rounded-lg mr-4">{icon}</div>
      <div>
        <h3 className="text-[#8892b0] font-mono text-[10px] uppercase tracking-wider font-bold">{label}</h3>
        <div className="text-lg mt-1 text-[#e8eaf6] font-semibold font-['Syne']">{value}</div>
      </div>
    </div>
  </div>
);

const StatCard = ({ label, value, sub, color, Icon }) => (
  <motion.div whileHover={{ scale: 1.02 }} className={`bg-[#111525] p-6 rounded-xl border border-[#1e2440] hover:border-${color}/50 transition-colors`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-[#8892b0] font-mono text-[10px] uppercase tracking-wider font-bold">{label}</p>
        <p className={`text-3xl font-bold mt-1 font-['Syne'] text-${color}`}>{value}</p>
        <p className="text-[#8892b0] text-[10px] mt-1 font-mono uppercase tracking-wider">{sub}</p>
      </div>
      <div className={`bg-${color}/10 p-3 rounded-full border border-${color}/30`}>
        <Icon className={`h-6 w-6 text-${color}`} />
      </div>
    </div>
  </motion.div>
);

export default Profile;
