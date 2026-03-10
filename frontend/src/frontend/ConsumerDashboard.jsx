"use client"

import { useState, useEffect, useContext } from "react"
import { motion } from "framer-motion"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area } from "recharts"
import {
  HomeIcon,
  ZapIcon,
  ShoppingCartIcon,
  WalletIcon,
  TrendingUpIcon,
  BarChart3Icon,
  UserIcon,
  MapPinIcon,
  LightbulbIcon,
  PiggyBankIcon,
  LeafIcon,
  ArrowRightIcon,
} from "lucide-react"
import NavBar from "./NavBar"
import { AuthContext } from "../Context/AuthContext"
import useSocket from "../hooks/useSocket"
import { handlesuccess, handleerror } from "../../utils"

const ConsumerDashboard = () => {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [consumptionData, setConsumptionData] = useState([])
  const { user } = useContext(AuthContext)
  const { isConnected: socketConnected, energyData: liveEnergyData, subscribeToEnergyData } = useSocket()

  // Consumer-specific data states
  const [consumptionStats, setConsumptionStats] = useState({ 
    monthlyUsage: '--', 
    purchased: '--', 
    savings: '--', 
    wallet: '--' 
  })
  const [userProfileData, setUserProfileData] = useState({ 
    location: '--', 
    energySource: '--', 
    sellers: '--',
    carbonFootprint: '--'
  })
  const [energyPrice, setEnergyPrice] = useState(2)
  const [recommendations, setRecommendations] = useState([])
  const [gridReferenceRate, setGridReferenceRate] = useState(0.15)
  const [siteSummary, setSiteSummary] = useState(null)

  // Fetch consumer data
  useEffect(() => {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken')
    if (!token) return
    const headers = { Authorization: `Bearer ${token}` }

    const fetchConsumerData = async () => {
      try {
        // Transactions → purchased kWh and savings
        const txRes = await fetch('http://localhost:8080/api/user/transactions', { headers })
        if (txRes.ok) {
          const txData = await txRes.json()
          if (txData.success) {
            const purchased = txData.transactions
              .filter(t => t.type === 'bought')
              .reduce((sum, t) => sum + (Number(t.energyKwh) || 0), 0)
            const totalSpent = txData.transactions
              .filter(t => t.type === 'bought')
              .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)
            // Estimate savings compared to grid price (~0.15/kWh)
            const estimatedGridCost = purchased * 0.15
            const savings = Math.max(0, estimatedGridCost - totalSpent)
            const sellers = new Set(txData.transactions.filter(t => t.type === 'bought').map(t => t.counterparty)).size
            
            setConsumptionStats(prev => ({ 
              ...prev, 
              purchased: `${purchased.toFixed(1)} kWh`,
              savings: `$${savings.toFixed(2)}`,
              wallet: `${totalSpent.toFixed(2)} ETK spent`
            }))
            setUserProfileData(prev => ({ ...prev, sellers }))
          }
        }
      } catch (err) { console.error('Error fetching transactions:', err) }

      try {
        // Profile → location, energy usage
        const profRes = await fetch('http://localhost:8080/api/user/profile', { headers })
        if (profRes.ok) {
          const prof = await profRes.json()
          const loc = prof.location || 'Not set'
          const source = prof.hasSolarPanels ? 'Solar + Grid' : 'Grid Only'
          const wallet = prof.walletAddress ? prof.walletAddress.slice(0, 6) + '...' : 'Not connected'
          // Estimate carbon footprint (0.4 kg CO2 per kWh from grid)
          const carbonFootprint = (prof.energyUsage || 0) * 0.4 * 12 // yearly estimate
          
          setConsumptionStats(prev => ({ 
            ...prev, 
            monthlyUsage: `${prof.energyUsage || 0} kWh/mo`,
            wallet 
          }))
          setUserProfileData(prev => ({ 
            ...prev, 
            location: loc, 
            energySource: source,
            carbonFootprint: `${carbonFootprint.toFixed(0)} kg/yr`
          }))
        }
      } catch (err) { console.error('Error fetching profile:', err) }
    }

    fetchConsumerData()
  }, [user])

  // Fetch user's energy price
  useEffect(() => {
    const fetchEnergyPrice = async () => {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken')
      if (!token) return
      
      try {
        const res = await fetch('http://localhost:8080/api/dashboard/energy-price', {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          if (data.success && data.energyPrice) {
            setEnergyPrice(data.energyPrice)
          }
          if (data.grid_reference_rate_usd) {
            setGridReferenceRate(data.grid_reference_rate_usd)
          }
        }
      } catch (err) {
        console.error('Error fetching energy price:', err)
      }

      try {
        const res = await fetch('http://localhost:8080/api/dashboard/site-summary', {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          if (data.success) {
            setSiteSummary(data)
          }
        }
      } catch (err) {
        console.error('Error fetching site summary:', err)
      }

      try {
        const res = await fetch('http://localhost:8080/api/dashboard/marketplace-opportunities', {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          if (data.success) {
            setRecommendations(data.opportunities.map((opportunity) => ({
              icon: opportunity.type === 'sell' ? "⚡" : "💡",
              title: opportunity.title,
              desc: opportunity.message
            })))
          }
        }
      } catch (err) {
        console.error('Error fetching energy price:', err)
      }
    }
    
    fetchEnergyPrice()
  }, [user])

  // Subscribe to consumption updates
  useEffect(() => {
    subscribeToEnergyData()
  }, [subscribeToEnergyData])

  // Update consumption chart when we receive real-time updates
  useEffect(() => {
    if (liveEnergyData) {
      const newTimestamp = new Date().toLocaleTimeString('en-US', { hour12: false })
      setConsumptionData((prev) => {
        const newData = [
          ...prev,
          {
            timestamp: newTimestamp,
            "Energy Consumed": liveEnergyData.consumed || 0,
            "Grid Price": 0.15,
            "P2P Price": energyPrice * 0.05, // approximate conversion
          },
        ]
        if (newData.length > 10) {
          return newData.slice(newData.length - 10)
        }
        return newData
      })
    }
  }, [liveEnergyData, energyPrice])

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
      },
    },
  }

  return (
    <>
      <NavBar />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-[#060810] text-[#e8eaf6] min-h-screen p-4 md:p-6 font-sans pt-28 mt-0"
      >
        {/* Header */}
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="flex justify-between items-center mb-8 bg-[#0c0f1a] border border-[#1e2440] rounded-xl p-5 shadow-[0_0_15px_rgba(0,0,0,0.5)]"
        >
          <div className="flex items-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
              className="bg-[#111525] border border-[#4d9fff]/30 p-2 rounded-lg mr-3 shadow-[0_0_10px_rgba(77,159,255,0.2)]"
            >
              <HomeIcon className="w-10 h-10 text-[#4d9fff]" />
            </motion.div>
            <div>
              <span className="text-2xl font-bold font-['Syne'] text-[#e8eaf6] tracking-wide">
                Consumer Dashboard
              </span>
              <p className="text-xs text-[#8892b0] font-mono mt-1">Manage your energy consumption</p>
            </div>
          </div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center bg-[#111525] border border-[#1e2440] px-4 py-2 rounded-lg shadow-sm"
          >
            <div className="mr-3 text-right">
              <span className="text-[10px] text-[#8892b0] uppercase tracking-wider block font-bold">Welcome back,</span>
              <span className="font-semibold text-[#e8eaf6] font-mono text-sm">{user?.user?.name || 'Consumer'}</span>
            </div>
            <div className="relative">
              <div className="w-10 h-10 rounded-full border-2 border-[#1e2440] bg-[#0c0f1a] flex items-center justify-center">
                <UserIcon className="w-5 h-5 text-[#8892b0]" />
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#00e5a0] rounded-full border-2 border-[#111525]"></span>
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-4 gap-6"
        >
          {/* Consumption Overview */}
          <motion.div
            variants={itemVariants}
            className="bg-[#0c0f1a] rounded-xl p-5 border border-[#1e2440] hover:border-[#4d9fff]/50 transition-colors"
          >
            <div className="flex justify-between items-center mb-5 border-b border-[#1e2440] pb-3">
              <h2 className="font-bold text-sm text-[#e8eaf6] flex items-center uppercase tracking-wider">
                <HomeIcon className="mr-2 text-[#4d9fff]" size={18} />
                My Consumption
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  icon: <ZapIcon className="text-[#4d9fff]" size={18} />,
                  value: consumptionStats.monthlyUsage,
                  label: "Monthly Usage",
                  bgColor: "bg-[#4d9fff]/10 border border-[#4d9fff]/30",
                },
                {
                  icon: <ShoppingCartIcon className="text-[#00e5a0]" size={18} />,
                  value: consumptionStats.purchased,
                  label: "Energy Bought",
                  bgColor: "bg-[#00e5a0]/10 border border-[#00e5a0]/30",
                },
                {
                  icon: <PiggyBankIcon className="text-[#ffd166]" size={18} />,
                  value: consumptionStats.savings,
                  label: "Est. Savings",
                  bgColor: "bg-[#ffd166]/10 border border-[#ffd166]/30",
                },
                {
                  icon: <WalletIcon className="text-[#a78bfa]" size={18} />,
                  value: consumptionStats.wallet,
                  label: "Wallet",
                  bgColor: "bg-[#a78bfa]/10 border border-[#a78bfa]/30",
                },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  className="flex flex-col items-start p-3 rounded-lg bg-[#111525] border border-[#1e2440] relative overflow-hidden"
                  whileHover={{ scale: 1.02, backgroundColor: "#1e2440" }}
                >
                  <div className={`absolute -right-4 -top-4 opacity-10 p-4 rounded-full ${item.bgColor.split(' ')[0]}`}>
                    {item.icon}
                  </div>
                  <div className={`mb-2 p-1.5 rounded bg-transparent ${item.bgColor}`}>
                    {item.icon}
                  </div>
                  <div>
                    <p className="font-mono font-bold text-[#e8eaf6] text-lg">{item.value}</p>
                    <p className="text-[10px] text-[#8892b0] uppercase tracking-wider font-bold mt-1">{item.label}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Live Consumption Chart */}
          <motion.div
            variants={itemVariants}
            className="col-span-1 md:col-span-3 bg-[#0c0f1a] rounded-xl p-5 border border-[#1e2440]"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 border-b border-[#1e2440] pb-3">
              <h2 className="font-bold text-sm text-[#e8eaf6] flex items-center mb-2 sm:mb-0 uppercase tracking-wider">
                <BarChart3Icon className="mr-2 text-[#4d9fff]" size={18} />
                Live Energy Consumption
              </h2>
              <div className="flex items-center">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                  className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-[#00e5a0]' : 'bg-[#ffd166]'} mr-2`}
                ></motion.div>
                <span className={`text-[10px] uppercase font-bold tracking-wider ${socketConnected ? 'text-[#00e5a0]' : 'text-[#ffd166]'}`}>
                  {socketConnected ? 'Live Updates' : 'Connecting...'}
                </span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={consumptionData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorConsumed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4d9fff" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#060810" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2440" vertical={false} />
                <XAxis dataKey="timestamp" tick={{ fill: "#8892b0", fontSize: 10, fontFamily: "monospace" }} axisLine={{ stroke: "#1e2440" }} tickLine={{ stroke: "#1e2440" }} />
                <YAxis tick={{ fill: "#8892b0", fontSize: 10, fontFamily: "monospace" }} axisLine={{ stroke: "#1e2440" }} tickLine={{ stroke: "#1e2440" }} unit=" kWh" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#111525",
                    borderColor: "#1e2440",
                    borderRadius: "4px",
                    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.5)",
                    fontFamily: "monospace",
                    fontSize: "12px"
                  }}
                  itemStyle={{ color: "#e8eaf6" }}
                  labelStyle={{ fontWeight: "bold", color: "#8892b0", marginBottom: "4px" }}
                  formatter={(value) => `${value} kWh`}
                />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ paddingTop: "10px", fontSize: "12px", color: "#8892b0" }} />
                <Area
                  type="monotone"
                  dataKey="Energy Consumed"
                  stroke="#4d9fff"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorConsumed)"
                  activeDot={{ r: 6, fill: '#4d9fff', stroke: '#060810', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Smart Recommendations */}
          <motion.div
            variants={itemVariants}
            className="bg-[#0c0f1a] rounded-xl p-5 border border-[#1e2440] hover:border-[#ffd166]/50 transition-colors"
          >
            <div className="border-b border-[#1e2440] pb-3 mb-5">
              <h2 className="font-bold text-sm text-[#e8eaf6] flex items-center uppercase tracking-wider">
                <LightbulbIcon className="mr-2 text-[#ffd166]" size={18} />
                Smart Tips
              </h2>
            </div>
            <div className="space-y-3">
              {recommendations.map((rec, index) => (
                <motion.div
                  key={index}
                  whileHover={{ x: 5 }}
                  className="flex items-start p-3 rounded bg-[#111525] border border-[#1e2440] hover:border-[#1e2440] transition-colors"
                >
                  <span className="text-xl mr-3 bg-[#0c0f1a] p-1.5 rounded border border-[#1e2440]">{rec.icon}</span>
                  <div>
                    <p className="font-bold text-[#e8eaf6] text-xs uppercase tracking-wide mb-1">{rec.title}</p>
                    <p className="text-[10px] text-[#8892b0] leading-tight">{rec.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* User Details */}
          <motion.div
            variants={itemVariants}
            className="bg-[#0c0f1a] rounded-xl p-5 border border-[#1e2440] hover:border-[#1e2440] transition-colors"
          >
            <div className="border-b border-[#1e2440] pb-3 mb-5">
              <h2 className="font-bold text-sm text-[#e8eaf6] flex items-center uppercase tracking-wider">
                <UserIcon className="mr-2 text-[#8892b0]" size={18} />
                Profile
              </h2>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                <motion.div whileHover={{ x: 5 }} className="flex justify-between items-center p-3 rounded bg-[#111525] border border-[#1e2440]">
                  <div className="flex items-center">
                    <MapPinIcon size={14} className="text-[#8892b0] mr-2" />
                    <p className="text-[10px] uppercase font-bold text-[#8892b0] tracking-wider">Location</p>
                  </div>
                  <p className="font-mono text-sm text-[#e8eaf6] truncate max-w-[140px]" title={userProfileData.location}>
                      {userProfileData.location}
                  </p>
                </motion.div>

                <motion.div whileHover={{ x: 5 }} className="flex justify-between items-center p-3 rounded bg-[#111525] border border-[#1e2440]">
                  <div className="flex items-center">
                    <LeafIcon size={14} className="text-[#00e5a0] mr-2" />
                    <p className="text-[10px] uppercase font-bold text-[#8892b0] tracking-wider">Carbon Footprint</p>
                  </div>
                  <p className="font-mono text-[#e8eaf6] text-sm">{userProfileData.carbonFootprint}</p>
                </motion.div>
              </div>

              <div className="mt-4 pt-4 border-t border-[#1e2440]">
                <h3 className="font-bold text-xs text-[#8892b0] uppercase tracking-wider mb-3">Trade Statistics</h3>
                <div className="grid grid-cols-2 gap-3">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="bg-[#111525] border border-[#1e2440] p-3 rounded text-center"
                  >
                    <p className="text-[10px] uppercase tracking-wider font-bold text-[#8892b0] mb-1">Energy Sellers</p>
                    <p className="font-mono font-bold text-xl text-[#e8eaf6]">{userProfileData.sellers}</p>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="bg-[#111525] border border-[#1e2440] p-3 rounded text-center"
                  >
                    <p className="text-[10px] uppercase tracking-wider font-bold text-[#8892b0] mb-1">Source</p>
                    <p className="font-mono font-bold text-xs text-[#00e5a0] mt-1 truncate">{userProfileData.energySource}</p>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Price Comparison */}
          <motion.div
            variants={itemVariants}
            className="col-span-1 md:col-span-2 bg-[#0c0f1a] rounded-xl p-5 border border-[#1e2440] hover:border-[#1e2440] transition-colors"
          >
            <div className="border-b border-[#1e2440] pb-3 mb-5">
              <h2 className="font-bold text-sm text-[#e8eaf6] flex items-center uppercase tracking-wider">
                <TrendingUpIcon className="mr-2 text-[#ff4d6d]" size={18} />
                Rates Breakdown
              </h2>
            </div>
            <div className="space-y-5">
              <div className="bg-[#111525] border border-[#1e2440] p-4 rounded font-mono text-sm">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[#8892b0]">TRADITIONAL_GRID</span>
                  <span className="font-bold text-[#ff4d6d]">${gridReferenceRate.toFixed(3)}/kWh</span>
                </div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[#8892b0]">ECOGRID_P2P</span>
                  <span className="font-bold text-[#00e5a0]">${((siteSummary?.pricing?.display_rate_usd) || (energyPrice * 0.05)).toFixed(3)}/kWh</span>
                </div>
                <div className="border-t border-dashed border-[#1e2440] my-3"></div>
                <div className="flex justify-between items-center">
                  <span className="text-[#e8eaf6] font-bold">EST_SAVINGS_MARGIN</span>
                  <span className="font-bold text-[#00e5a0]">
                    {gridReferenceRate > 0 ? ((1 - (((siteSummary?.pricing?.display_rate_usd) || (energyPrice * 0.05)) / gridReferenceRate)) * 100).toFixed(0) : "0"}%
                  </span>
                </div>
              </div>

              <motion.button
                onClick={() => window.location.href = '/marketplace'}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-[#00e5a0]/10 border border-[#00e5a0]/30 text-[#00e5a0] py-3 rounded text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[#00e5a0]/20 transition-colors"
              >
                Browse Energy Listings
                <ArrowRightIcon size={14} />
              </motion.button>
            </div>
          </motion.div>
        </motion.div>

        {/* Footer */}
        <motion.footer
          className="bg-[#0c0f1a] border border-[#1e2440] text-[#8892b0] py-6 mt-10 rounded-xl"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          <div className="container mx-auto px-6">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="text-center md:text-left mb-4 md:mb-0">
                <h3 className="text-sm font-bold text-[#e8eaf6] uppercase tracking-wider font-['Syne'] flex items-center"><span className="text-[#00e5a0]">Eco</span>Grid Consumer</h3>
                <p className="text-[10px] text-[#8892b0] mt-1 font-mono uppercase tracking-widest max-w-md">
                  Smart energy consumption.
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-[#8892b0] font-mono tracking-wider">&copy; {new Date().getFullYear()} EcoGrid. All Rights Reserved.</p>
              </div>
            </div>
          </div>
        </motion.footer>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-[10px] uppercase tracking-wider text-[#8892b0] text-right mt-4 font-mono fixed bottom-4 right-4 bg-[#111525] border border-[#1e2440] px-3 py-1.5 rounded shadow-lg z-50"
        >
          SYS_TIME: {currentTime.toLocaleTimeString()}
        </motion.div>
      </motion.div>
    </>
  )
}

export default ConsumerDashboard
