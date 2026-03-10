"use client"

import { useState, useEffect, useContext } from "react"
import { motion } from "framer-motion"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, PieChart, Pie, Cell } from "recharts"
import {
  Building2Icon,
  ZapIcon,
  UsersIcon,
  TrendingUpIcon,
  BarChart3Icon,
  ActivityIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  MapPinIcon,
  ArrowRightIcon,
  DollarSignIcon,
  GaugeIcon,
} from "lucide-react"
import NavBar from "./NavBar"
import { AuthContext } from "../Context/AuthContext"
import useSocket from "../hooks/useSocket"
import { handlesuccess, handleerror } from "../../utils"
import { apiUrl } from "../config"

const UtilityDashboard = () => {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [gridData, setGridData] = useState([])
  const { user } = useContext(AuthContext)
  const { isConnected: socketConnected, energyData: liveEnergyData, subscribeToEnergyData } = useSocket()

  // Utility-specific data states
  const [gridStats, setGridStats] = useState({ 
    totalProducers: '--', 
    totalConsumers: '--', 
    gridLoad: '--', 
    revenue: '--' 
  })
  const [alerts, setAlerts] = useState([])
  const [energyMix, setEnergyMix] = useState([
    { name: 'Solar', value: 35, color: '#fbbf24' },
    { name: 'Wind', value: 25, color: '#3b82f6' },
    { name: 'Hydro', value: 20, color: '#06b6d4' },
    { name: 'Grid', value: 20, color: '#6b7280' },
  ])
  const [transactions, setTransactions] = useState([])
  const [siteSummary, setSiteSummary] = useState(null)

  // Fetch utility data
  useEffect(() => {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken')
    if (!token) return
    const headers = { Authorization: `Bearer ${token}` }

    const fetchUtilityData = async () => {
      try {
        // Fetch all transactions for grid overview
        const txRes = await fetch(apiUrl('/dashboard/transactions'))
        if (txRes.ok) {
          const txData = await txRes.json()
          const totalVolume = txData.reduce((sum, t) => sum + (Number(t.energyKwh) || 0), 0)
          const totalRevenue = txData.reduce((sum, t) => sum + (Number(t.amount) || 0), 0)
          
          setGridStats(prev => ({ 
            ...prev, 
            revenue: `$${totalRevenue.toFixed(2)}`,
            gridLoad: `${totalVolume.toFixed(1)} kWh`
          }))
          setTransactions(txData.slice(0, 5))
        }
      } catch (err) { console.error('Error fetching transactions:', err) }

      try {
        // Fetch listings to count producers
        const listingsRes = await fetch(apiUrl('/listings'))
        if (listingsRes.ok) {
          const listingsData = await listingsRes.json()
          if (listingsData.success) {
            const uniqueProducers = new Set(listingsData.listings.map(l => l.producer?._id || l.producer)).size
            setGridStats(prev => ({ ...prev, totalProducers: uniqueProducers }))
          }
        }
      } catch (err) { console.error('Error fetching listings:', err) }

      try {
        const summaryRes = await fetch(apiUrl('/dashboard/site-summary'), { headers })
        if (summaryRes.ok) {
          const summaryData = await summaryRes.json()
          if (summaryData.success) {
            setSiteSummary(summaryData)
            setGridStats(prev => ({
              ...prev,
              totalConsumers: summaryData.market?.totalConsumers ?? prev.totalConsumers,
              totalProducers: summaryData.market?.totalProducers ?? prev.totalProducers,
              gridLoad: `${(summaryData.totals?.total_energy_today_kwh || 0).toFixed(3)} kWh`
            }))
            setAlerts(summaryData.alerts || [])
            setEnergyMix(summaryData.energyMix || [])
          }
        }
      } catch (err) { console.error('Error fetching site summary:', err) }
    }

    fetchUtilityData()
    // Refresh every 30 seconds
    const interval = setInterval(fetchUtilityData, 30000)
    return () => clearInterval(interval)
  }, [user])

  // Subscribe to grid updates
  useEffect(() => {
    subscribeToEnergyData()
  }, [subscribeToEnergyData])

  // Update grid chart when we receive real-time updates
  useEffect(() => {
    if (liveEnergyData) {
      const newTimestamp = new Date().toLocaleTimeString('en-US', { hour12: false })
      setGridData((prev) => {
        const newData = [
          ...prev,
          {
            timestamp: newTimestamp,
            "Production": liveEnergyData.produced || 0,
            "Consumption": liveEnergyData.consumed || 0,
            "Grid Balance": (liveEnergyData.produced || 0) - (liveEnergyData.consumed || 0),
          },
        ]
        if (newData.length > 10) {
          return newData.slice(newData.length - 10)
        }
        return newData
      })
    }
  }, [liveEnergyData])

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
              className="bg-[#111525] border border-[#a78bfa]/30 p-2 rounded-lg mr-3 shadow-[0_0_10px_rgba(167,139,250,0.2)]"
            >
              <Building2Icon className="w-10 h-10 text-[#a78bfa]" />
            </motion.div>
            <div>
              <span className="text-2xl font-bold font-['Syne'] text-[#e8eaf6] tracking-wide">
                Utility Dashboard
              </span>
              <p className="text-xs text-[#8892b0] font-mono mt-1">Grid Management & Analytics</p>
            </div>
          </div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center bg-[#111525] border border-[#1e2440] px-4 py-2 rounded-lg shadow-sm"
          >
            <div className="mr-3 text-right">
              <span className="text-[10px] text-[#8892b0] uppercase tracking-wider block font-bold">Grid Operator,</span>
              <span className="font-semibold text-[#e8eaf6] font-mono text-sm">{user?.user?.name || 'Utility'}</span>
            </div>
            <div className="relative">
              <div className="w-10 h-10 rounded-full border-2 border-[#1e2440] bg-[#0c0f1a] flex items-center justify-center">
                <UsersIcon className="w-5 h-5 text-[#8892b0]" />
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
          {/* Grid Overview */}
          <motion.div
            variants={itemVariants}
            className="bg-[#0c0f1a] rounded-xl p-5 border border-[#1e2440] hover:border-[#a78bfa]/50 transition-colors"
          >
            <div className="flex justify-between items-center mb-5 border-b border-[#1e2440] pb-3">
              <h2 className="font-bold text-sm text-[#e8eaf6] flex items-center uppercase tracking-wider">
                <GaugeIcon className="mr-2 text-[#a78bfa]" size={18} />
                Grid Overview
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  icon: <ZapIcon className="text-[#ffd166]" size={18} />,
                  value: gridStats.totalProducers,
                  label: "Producers",
                  bgColor: "bg-[#ffd166]/10 border border-[#ffd166]/30",
                },
                {
                  icon: <UsersIcon className="text-[#4d9fff]" size={18} />,
                  value: gridStats.totalConsumers,
                  label: "Consumers",
                  bgColor: "bg-[#4d9fff]/10 border border-[#4d9fff]/30",
                },
                {
                  icon: <ActivityIcon className="text-[#00e5a0]" size={18} />,
                  value: gridStats.gridLoad,
                  label: "Grid Load",
                  bgColor: "bg-[#00e5a0]/10 border border-[#00e5a0]/30",
                },
                {
                  icon: <DollarSignIcon className="text-[#a78bfa]" size={18} />,
                  value: gridStats.revenue,
                  label: "Revenue",
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

          {/* Live Grid Status */}
          <motion.div
            variants={itemVariants}
            className="col-span-1 md:col-span-3 bg-[#0c0f1a] rounded-xl p-5 border border-[#1e2440]"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 border-b border-[#1e2440] pb-3">
              <h2 className="font-bold text-sm text-[#e8eaf6] flex items-center mb-2 sm:mb-0 uppercase tracking-wider">
                <BarChart3Icon className="mr-2 text-[#a78bfa]" size={18} />
                Live Grid Status
              </h2>
              <div className="flex items-center">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                  className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-[#00e5a0]' : 'bg-[#ffd166]'} mr-2`}
                ></motion.div>
                <span className={`text-[10px] uppercase font-bold tracking-wider ${socketConnected ? 'text-[#00e5a0]' : 'text-[#ffd166]'}`}>
                  {socketConnected ? 'Grid Online' : 'Connecting...'}
                </span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={gridData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
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
                <Line type="monotone" dataKey="Production" stroke="#00e5a0" strokeWidth={2} dot={{ fill: "#0c0f1a", stroke: "#00e5a0", strokeWidth: 2, r: 4 }} activeDot={{ r: 6, fill: '#00e5a0', stroke: '#060810' }} />
                <Line type="monotone" dataKey="Consumption" stroke="#4d9fff" strokeWidth={2} dot={{ fill: "#0c0f1a", stroke: "#4d9fff", strokeWidth: 2, r: 4 }} activeDot={{ r: 6, fill: '#4d9fff', stroke: '#060810' }} />
                <Line type="monotone" dataKey="Grid Balance" stroke="#a78bfa" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Alerts & Notifications */}
          <motion.div
            variants={itemVariants}
            className="bg-[#0c0f1a] rounded-xl p-5 border border-[#1e2440] hover:border-[#1e2440] transition-colors"
          >
            <div className="border-b border-[#1e2440] pb-3 mb-5">
              <h2 className="font-bold text-sm text-[#e8eaf6] flex items-center uppercase tracking-wider">
                <AlertTriangleIcon className="mr-2 text-[#ff4d6d]" size={18} />
                Grid Alerts
              </h2>
            </div>
            <div className="space-y-3">
              {alerts.map((alert) => (
                <motion.div
                  key={alert.id}
                  whileHover={{ x: 5 }}
                  className={`flex items-start p-3 rounded bg-[#111525] border ${
                    alert.type === 'warning' ? 'border-[#ffd166]/30' :
                    alert.type === 'success' ? 'border-[#00e5a0]/30' :
                    'border-[#4d9fff]/30'
                  }`}
                >
                  {alert.type === 'warning' ? <AlertTriangleIcon className="w-4 h-4 text-[#ffd166] mr-2 mt-0.5 flex-shrink-0" /> :
                   alert.type === 'success' ? <CheckCircleIcon className="w-4 h-4 text-[#00e5a0] mr-2 mt-0.5 flex-shrink-0" /> :
                   <ActivityIcon className="w-4 h-4 text-[#4d9fff] mr-2 mt-0.5 flex-shrink-0" />}
                  <div className="flex-1">
                    <p className="font-bold text-[#e8eaf6] text-xs uppercase tracking-wide mb-1 leading-tight">{alert.message}</p>
                    <p className="text-[10px] text-[#8892b0] font-mono">{alert.time}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Energy Mix */}
          <motion.div
            variants={itemVariants}
            className="bg-[#0c0f1a] rounded-xl p-5 border border-[#1e2440] hover:border-[#1e2440] transition-colors"
          >
            <div className="border-b border-[#1e2440] pb-3 mb-5">
              <h2 className="font-bold text-sm text-[#e8eaf6] flex items-center uppercase tracking-wider">
                <ZapIcon className="mr-2 text-[#ffd166]" size={18} />
                Energy Mix
              </h2>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={energyMix}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {energyMix.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#111525",
                    borderColor: "#1e2440",
                    borderRadius: "4px",
                    fontFamily: "monospace",
                    fontSize: "12px",
                    color: "#e8eaf6"
                  }}
                  itemStyle={{ color: "#e8eaf6" }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-2 mt-2 font-mono text-xs">
              {energyMix.map((item) => (
                <div key={item.name} className="flex items-center text-[#8892b0]">
                  <div className="w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: item.color }}></div>
                  <span>{item.name} <span className="text-[#e8eaf6]">{item.value}%</span></span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Recent Transactions */}
          <motion.div
            variants={itemVariants}
            className="col-span-1 md:col-span-2 bg-[#0c0f1a] rounded-xl p-5 border border-[#1e2440] hover:border-[#1e2440] transition-colors"
          >
            <div className="border-b border-[#1e2440] pb-3 mb-5">
              <h2 className="font-bold text-sm text-[#e8eaf6] flex items-center uppercase tracking-wider">
                <TrendingUpIcon className="mr-2 text-[#a78bfa]" size={18} />
                Recent Grid Transactions
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[10px] uppercase font-mono tracking-wider">
                <thead className="bg-[#111525] border-b border-[#1e2440] text-[#8892b0]">
                  <tr>
                    <th className="px-4 py-3 text-left font-bold">Time</th>
                    <th className="px-4 py-3 text-left font-bold">Type</th>
                    <th className="px-4 py-3 text-right font-bold">Energy</th>
                    <th className="px-4 py-3 text-right font-bold">Amount</th>
                  </tr>
                </thead>
                <tbody className="bg-[#0c0f1a]">
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-4 py-4 text-center text-[#8892b0]">No recent transactions</td>
                    </tr>
                  ) : transactions.map((tx, i) => (
                    <tr key={i} className="border-b border-[#1e2440] hover:bg-[#111525] transition-colors text-[#e8eaf6]">
                      <td className="px-4 py-3 text-[#8892b0]">
                        {new Date(tx.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 flex w-max border rounded ${tx.type === 'sold' ? 'bg-[#00e5a0]/10 border-[#00e5a0]/30 text-[#00e5a0]' : 'bg-[#4d9fff]/10 border-[#4d9fff]/30 text-[#4d9fff]'}`}>
                          {tx.type === 'sold' ? 'SALE' : 'PURCHASE'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold">{tx.energyKwh} kWh</td>
                      <td className="px-4 py-3 text-right font-bold text-[#a78bfa]">{tx.amount} ETK</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
                <h3 className="text-sm font-bold text-[#e8eaf6] uppercase tracking-wider font-['Syne'] flex items-center"><span className="text-[#00e5a0]">Eco</span>Grid Utility</h3>
                <p className="text-[10px] text-[#8892b0] mt-1 font-mono uppercase tracking-widest max-w-md">
                  Grid management & analytics.
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

export default UtilityDashboard
