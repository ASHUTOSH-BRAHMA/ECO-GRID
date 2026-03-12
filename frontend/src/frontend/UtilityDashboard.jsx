"use client"

import { useState, useEffect, useContext } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, Cell, PieChart, Pie } from "recharts"
import {
  Building2Icon, ZapIcon, UsersIcon, TrendingUpIcon, BarChart3Icon, ActivityIcon,
  AlertTriangleIcon, CheckCircleIcon, ArrowRightIcon, DollarSignIcon, GaugeIcon,
  WifiIcon, ShieldCheckIcon, ListIcon, RefreshCwIcon, MapPinIcon, WalletIcon, UserCircleIcon,
} from "lucide-react"
import NavBar from "./NavBar"
import { AuthContext } from "../Context/AuthContext"
import { useWallet } from "../Context/WalletContext"
import useSocket from "../hooks/useSocket"
import { apiUrl } from "../config"

const C = {
  bg: "#060810", bg2: "#0c0f1a", bg3: "#111525",
  border: "#1e2440", border2: "#2a3155",
  text: "#e8eaf6", text2: "#8892b0", text3: "#4a5568",
  green: "#00e5a0", red: "#ff4d6d", yellow: "#ffd166",
  blue: "#4d9fff", purple: "#a78bfa",
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=JetBrains+Mono:wght@300;400;500&display=swap');
  @keyframes pulse2{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.8)}}
  *{box-sizing:border-box}
  ::-webkit-scrollbar{width:3px}
  ::-webkit-scrollbar-thumb{background:#2a3155;border-radius:2px}
`

const Card = ({ title, badge, children, style = {}, accent = C.border }) => (
  <div style={{ background: C.bg3, border: `1px solid ${accent}`, borderRadius: 8, padding: 14, ...style }}>
    {(title || badge) && (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, paddingBottom: 8, borderBottom: `1px solid ${C.border}` }}>
        <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 11, fontWeight: 700, color: C.text2, letterSpacing: "1.5px", textTransform: "uppercase" }}>{title}</span>
        {badge}
      </div>
    )}
    {children}
  </div>
)

const Badge = ({ children, color = C.green, bg = "rgba(0,229,160,.12)" }) => (
  <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 3, letterSpacing: ".5px", textTransform: "uppercase", background: bg, color, border: `1px solid ${color}40` }}>{children}</span>
)

const KpiTile = ({ label, value, icon, color = C.green, sub }) => (
  <motion.div whileHover={{ y: -2 }}
    style={{ background: C.bg2, border: `1px solid ${color}30`, borderRadius: 6, padding: "12px 14px", position: "relative", overflow: "hidden" }}>
    <div style={{ position: "absolute", right: -6, top: -6, opacity: .07, fontSize: 48 }}>{icon}</div>
    <p style={{ fontSize: 9, color: C.text3, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>{label}</p>
    <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 20, color, lineHeight: 1 }}>{value}</p>
    {sub && <p style={{ fontSize: 9, color: C.text3, marginTop: 4 }}>{sub}</p>}
  </motion.div>
)

// Grid Health Score (0–100) derived from stability + device status + load trend
const calcHealthScore = (siteSummary, socketConnected) => {
  if (!siteSummary) return 0
  const stability = (siteSummary.totals?.stability_score || 0) * 40
  const device = socketConnected ? 30 : 0
  const trend = siteSummary.current?.load_trend === "stable" ? 20 : siteSummary.current?.load_trend === "falling" ? 15 : 8
  const alert = siteSummary.alertState === "normal" ? 10 : siteSummary.alertState === "elevated_load" ? 5 : 0
  return Math.min(100, Math.round(stability + device + trend + alert))
}

const healthColor = score => score >= 75 ? C.green : score >= 45 ? C.yellow : C.red

const UtilityDashboard = () => {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [gridHistory, setGridHistory] = useState([])
  const { user } = useContext(AuthContext)
  const navigate = useNavigate()
  const { isConnected: walletConnected, walletAddress } = useWallet()
  const { isConnected: socketConnected, energyData: liveEnergyData, subscribeToEnergyData } = useSocket()

  const [siteSummary, setSiteSummary] = useState(null)
  const [profileData, setProfileData] = useState({
    location: "Not set",
    energyUsage: 0,
    hasSolarPanels: false,
  })
  const [allTransactions, setAllTransactions] = useState([])
  const [allListings, setAllListings] = useState([])
  const [userStats, setUserStats] = useState([]) // per-user aggregate
  const [alerts, setAlerts] = useState([])
  const [energyMix, setEnergyMix] = useState([])
  const [forecast, setForecast] = useState([])
  const [refreshing, setRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState(null)

  const healthScore = calcHealthScore(siteSummary, socketConnected)
  const walletDisplay = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : walletConnected
      ? "Connected"
      : "N/A"

  const fetchAll = async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true)
    const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken")
    const h = { Authorization: `Bearer ${token}` }

    // Site summary — grid-level aggregates
    try {
      const r = await fetch(apiUrl("/dashboard/site-summary"), { headers: h })
      if (r.ok) {
        const d = await r.json()
        if (d.success) {
          setSiteSummary(d)
          setAlerts(d.alerts || [])
          setEnergyMix(d.energyMix || [])
        }
      }
    } catch {}

    // Logged-in utility profile
    try {
      const r = await fetch(apiUrl("/user/profile"), { headers: h })
      if (r.ok) {
        const d = await r.json()
        setProfileData({
          location: d.location || "Not set",
          energyUsage: Number(d.energyUsage || 0),
          hasSolarPanels: Boolean(d.hasSolarPanels),
        })
      }
    } catch {}

    // All transactions (no auth required)
    try {
      const r = await fetch(apiUrl("/dashboard/transactions"))
      if (r.ok) {
        const d = await r.json()
        setAllTransactions(Array.isArray(d) ? d : [])
      }
    } catch {}

    // All listings — gives us per-producer data
    try {
      const r = await fetch(apiUrl("/listings"))
      if (r.ok) {
        const d = await r.json()
        if (d.success && d.listings) {
          setAllListings(d.listings)
          // Build per-user stats from listings
          const byUser = {}
          d.listings.forEach(l => {
            const uid = l.producer?._id || l.producer || "unknown"
            const name = l.producer?.name || `User-${String(uid).slice(-4)}`
            const utype = l.producer?.userType || "prosumer"
            if (!byUser[uid]) byUser[uid] = { uid, name, userType: utype, listings: 0, totalKwh: 0, active: 0 }
            byUser[uid].listings++
            byUser[uid].totalKwh += Number(l.energyAmount || 0)
            if (l.status === "active") byUser[uid].active++
          })
          setUserStats(Object.values(byUser).sort((a, b) => b.totalKwh - a.totalKwh))
        }
      }
    } catch {}

    // Forecast
    try {
      const r = await fetch(apiUrl("/dashboard/site-forecast?hours=24"), { headers: h })
      if (r.ok) { const d = await r.json(); if (d.success) setForecast(d.forecast) }
    } catch {}

    setLastRefresh(new Date())
    if (showSpinner) setTimeout(() => setRefreshing(false), 600)
  }

  useEffect(() => {
    fetchAll()
    const iv = setInterval(() => fetchAll(), 30000)
    return () => clearInterval(iv)
  }, [user])

  useEffect(() => { subscribeToEnergyData() }, [subscribeToEnergyData])

  useEffect(() => {
    if (!liveEnergyData) return
    const ts = new Date().toLocaleTimeString("en-US", { hour12: false })
    setGridHistory(prev => {
      const next = [...prev, {
        timestamp: ts,
        Production: Number(liveEnergyData.site_supply_kwh || liveEnergyData.produced || 0),
        Consumption: Number(liveEnergyData.site_demand_kwh || liveEnergyData.consumed || 0),
        Balance: Number(liveEnergyData.grid_balance_kwh || 0),
        Power: Number(liveEnergyData.power_w || 0),
      }]
      return next.length > 20 ? next.slice(next.length - 20) : next
    })

    // Imbalance alert: if consumption > production for last reading
    if (liveEnergyData.site_demand_kwh > liveEnergyData.site_supply_kwh * 1.2) {
      const imbalAlert = { id: "live-imbalance", type: "warning", message: "Grid imbalance: demand exceeds supply by >20%", time: ts }
      setAlerts(prev => {
        if (prev.find(a => a.id === "live-imbalance")) return prev
        return [imbalAlert, ...prev]
      })
    } else {
      setAlerts(prev => prev.filter(a => a.id !== "live-imbalance"))
    }
  }, [liveEnergyData])

  useEffect(() => { const t = setInterval(() => setCurrentTime(new Date()), 1000); return () => clearInterval(t) }, [])

  // Computed grid metrics
  const totalKwhTraded = allTransactions.reduce((s, t) => s + (Number(t.energyKwh) || 0), 0)
  const totalRevenue = allTransactions.reduce((s, t) => s + (Number(t.amount) || 0), 0)
  const totalProducers = siteSummary?.market?.totalProducers || userStats.length
  const totalConsumers = siteSummary?.market?.totalConsumers || 0
  const activeListings = allListings.filter(l => l.status === "active").length

  // Peak demand hours from forecast
  const peakHour = forecast.length > 0 ? forecast.reduce((mx, x) => x.demand_kwh > mx.demand_kwh ? x : mx, forecast[0]) : null

  return (
    <>
      <style>{css}</style>
      <NavBar />
      <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'JetBrains Mono',monospace", fontSize: 13, paddingTop: 52 }}>

        {/* Top bar */}
        <div style={{ background: "rgba(6,8,16,.97)", borderBottom: `1px solid ${C.border}`, padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 44, position: "sticky", top: 52, zIndex: 40 }}>
          <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 15, color: C.purple }}>
            EcoGrid <span style={{ color: C.text2, fontWeight: 400 }}>/ Grid Operator</span>
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: socketConnected ? C.green : C.yellow, animation: "pulse2 2s infinite" }} />
              <span style={{ fontSize: 10, color: socketConnected ? C.green : C.yellow }}>{socketConnected ? "GRID ONLINE" : "CONNECTING"}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 8px", background: "rgba(167,139,250,.08)", border: "1px solid rgba(167,139,250,.18)", borderRadius: 4 }}>
              <WalletIcon size={10} color={C.purple} />
              <span style={{ fontSize: 10, color: C.purple }}>{walletDisplay}</span>
            </div>
            <motion.button whileHover={{ scale: 1.05 }} onClick={() => fetchAll(true)}
              style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", background: "transparent", border: `1px solid ${C.border}`, borderRadius: 4, color: C.text2, fontSize: 10, cursor: "pointer", fontFamily: "'JetBrains Mono',monospace" }}>
              <RefreshCwIcon size={10} style={{ animation: refreshing ? "spin 0.7s linear infinite" : "none" }} /> Refresh
            </motion.button>
            <span style={{ fontSize: 10, color: C.text3 }}>{user?.user?.name || user?.name || "Grid Operator"}</span>
            <span style={{ fontSize: 10, color: C.text3 }}>{currentTime.toLocaleTimeString()}</span>
          </div>
        </div>

        <div style={{ padding: 14 }}>

          {/* ── KPI Row ── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 10, marginBottom: 14 }}>
            <KpiTile label="Producers" value={totalProducers} icon="⚡" color={C.yellow} />
            <KpiTile label="Consumers" value={totalConsumers} icon="🏠" color={C.blue} />
            <KpiTile label="Active Listings" value={activeListings} icon="📋" color={C.green} />
            <KpiTile label="kWh Traded" value={totalKwhTraded.toFixed(2)} icon="🔋" color={C.purple} sub="all time" />
            <KpiTile label="Revenue" value={`${totalRevenue.toFixed(0)} ETK`} icon="💰" color={C.green} sub="all time" />
            <KpiTile label="Grid Health" value={`${healthScore}`}
              icon={healthScore >= 75 ? "✅" : healthScore >= 45 ? "⚠️" : "🔴"}
              color={healthColor(healthScore)}
              sub={healthScore >= 75 ? "optimal" : healthScore >= 45 ? "elevated" : "critical"} />
          </div>

          {/* ── Main grid: Chart | Alerts | Mix ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 280px 200px", gap: 12, marginBottom: 12 }}>

            {/* Live Grid Chart */}
            <Card title="Live Grid Balance — Production vs Consumption" badge={
              <Badge color={socketConnected ? C.green : C.yellow} bg={socketConnected ? "rgba(0,229,160,.1)" : "rgba(255,209,102,.1)"}>
                {socketConnected ? "Live" : "Offline"}
              </Badge>
            }>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={gridHistory} margin={{ top: 5, right: 8, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradProd" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={C.green} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={C.green} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradCons" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={C.blue} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={C.blue} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                  <XAxis dataKey="timestamp" tick={{ fill: C.text3, fontSize: 8 }} axisLine={{ stroke: C.border }} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fill: C.text3, fontSize: 8 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: C.bg2, borderColor: C.border, borderRadius: 4, fontSize: 11 }} />
                  <Area type="monotone" dataKey="Production" stroke={C.green} strokeWidth={2} fill="url(#gradProd)" dot={false} activeDot={{ r: 4 }} />
                  <Area type="monotone" dataKey="Consumption" stroke={C.blue} strokeWidth={2} fill="url(#gradCons)" dot={false} activeDot={{ r: 4 }} />
                  <Line type="monotone" dataKey="Balance" stroke={C.purple} strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginTop: 12 }}>
                {[
                  { label: "Avg Load 1m", value: `${((siteSummary?.totals?.average_load_1m_kw || 0) * 1000).toFixed(2)} W`, color: C.blue },
                  { label: "Avg Load 15m", value: `${((siteSummary?.totals?.average_load_15m_kw || 0) * 1000).toFixed(2)} W`, color: C.purple },
                  { label: "Peak Today", value: `${((siteSummary?.totals?.peak_power_today_kw || 0) * 1000).toFixed(2)} W`, color: C.red },
                  { label: "Stability", value: `${((siteSummary?.totals?.stability_score || 0) * 100).toFixed(0)}%`, color: healthColor(healthScore) },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ background: C.bg2, borderRadius: 4, padding: "7px 8px", textAlign: "center" }}>
                    <p style={{ fontSize: 9, color: C.text3, textTransform: "uppercase", marginBottom: 4 }}>{label}</p>
                    <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 12, color }}>{value}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Alerts */}
            <Card title="Grid Alerts" accent={alerts.some(a => a.type === "warning") ? C.red + "80" : C.border}
              badge={<span style={{ fontSize: 9, background: alerts.filter(a => a.type === "warning").length > 0 ? `${C.red}20` : `${C.green}15`, color: alerts.filter(a => a.type === "warning").length > 0 ? C.red : C.green, padding: "2px 7px", borderRadius: 3, border: `1px solid ${alerts.filter(a => a.type === "warning").length > 0 ? C.red : C.green}40` }}>
                {alerts.filter(a => a.type === "warning").length} WARN
              </span>}>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 260, overflowY: "auto" }}>
                {alerts.map((alert) => (
                  <motion.div key={alert.id} layout
                    style={{ padding: "9px 10px", borderRadius: 4, background: C.bg2, border: `1px solid ${alert.type === "warning" ? C.yellow + "40" : alert.type === "success" ? C.green + "40" : C.blue + "40"}`, display: "flex", gap: 8, alignItems: "flex-start" }}>
                    {alert.type === "warning" ? <AlertTriangleIcon size={13} style={{ color: C.yellow, flexShrink: 0, marginTop: 1 }} /> :
                      alert.type === "success" ? <CheckCircleIcon size={13} style={{ color: C.green, flexShrink: 0, marginTop: 1 }} /> :
                        <ActivityIcon size={13} style={{ color: C.blue, flexShrink: 0, marginTop: 1 }} />}
                    <div>
                      <p style={{ fontSize: 10, color: C.text, lineHeight: 1.4, marginBottom: 2 }}>{alert.message}</p>
                      <p style={{ fontSize: 9, color: C.text3 }}>{alert.time}</p>
                    </div>
                  </motion.div>
                ))}
                {peakHour && (
                  <div style={{ padding: "9px 10px", borderRadius: 4, background: C.bg2, border: `1px solid ${C.purple}40`, display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <TrendingUpIcon size={13} style={{ color: C.purple, flexShrink: 0, marginTop: 1 }} />
                    <div>
                      <p style={{ fontSize: 10, color: C.text, lineHeight: 1.4, marginBottom: 2 }}>
                        Peak demand forecast at <strong>{peakHour.hour}:00</strong> — {peakHour.demand_kwh.toFixed(4)} kWh
                      </p>
                      <p style={{ fontSize: 9, color: C.text3 }}>ML forecast</p>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Energy Mix Pie */}
            <Card title="Energy Mix">
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={energyMix} cx="50%" cy="50%" innerRadius={38} outerRadius={60} paddingAngle={4} dataKey="value" stroke="none">
                    {energyMix.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: C.bg2, borderColor: C.border, borderRadius: 4, fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 10px", justifyContent: "center", marginTop: 6 }}>
                {energyMix.map(item => (
                  <div key={item.name} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: C.text2 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: item.color }} />
                    <span>{item.name} <span style={{ color: C.text, fontWeight: 600 }}>{item.value}%</span></span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* ── Multi-User Table + Forecast ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 12 }}>

            {/* Per-User Producer Table */}
            <Card title="All users — Energy Producers" badge={<Badge color={C.yellow} bg="rgba(255,209,102,.1)">{userStats.length} producers</Badge>}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                      {["#", "Name", "Type", "Listings", "Active", "Total kWh"].map(h => (
                        <th key={h} style={{ padding: "6px 10px", textAlign: "left", fontSize: 9, color: C.text3, textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {userStats.length === 0 ? (
                      <tr><td colSpan={6} style={{ padding: "20px", textAlign: "center", color: C.text3, fontSize: 11 }}>No producer data yet</td></tr>
                    ) : userStats.map((u, i) => (
                      <motion.tr key={u.uid} whileHover={{ backgroundColor: C.bg2 }}
                        style={{ borderBottom: `1px solid ${C.border}`, transition: "background .15s" }}>
                        <td style={{ padding: "8px 10px", color: C.text3 }}>{i + 1}</td>
                        <td style={{ padding: "8px 10px", color: C.text, fontWeight: 600 }}>{u.name}</td>
                        <td style={{ padding: "8px 10px" }}>
                          <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 3, background: u.userType === "prosumer" ? `${C.yellow}18` : `${C.blue}18`, color: u.userType === "prosumer" ? C.yellow : C.blue, border: `1px solid ${u.userType === "prosumer" ? C.yellow : C.blue}40` }}>
                            {u.userType}
                          </span>
                        </td>
                        <td style={{ padding: "8px 10px", color: C.text2, textAlign: "center" }}>{u.listings}</td>
                        <td style={{ padding: "8px 10px", textAlign: "center" }}>
                          <span style={{ color: u.active > 0 ? C.green : C.text3, fontWeight: 600 }}>{u.active}</span>
                        </td>
                        <td style={{ padding: "8px 10px", color: C.green, fontFamily: "'Syne',sans-serif", fontWeight: 700 }}>{u.totalKwh.toFixed(3)} kWh</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Recent transactions below table */}
              <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
                <p style={{ fontSize: 9, color: C.text2, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Recent Grid Transactions</p>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10 }}>
                  <thead>
                    <tr>
                      {["Time", "Type", "Energy", "ETK"].map(h => (
                        <th key={h} style={{ padding: "4px 8px", textAlign: "left", fontSize: 9, color: C.text3, textTransform: "uppercase", letterSpacing: 1 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {allTransactions.slice(0, 8).map((tx, i) => (
                      <tr key={i} style={{ borderTop: `1px solid ${C.border}` }}>
                        <td style={{ padding: "6px 8px", color: C.text3 }}>{new Date(tx.timestamp).toLocaleTimeString()}</td>
                        <td style={{ padding: "6px 8px" }}>
                          <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 3, background: tx.type === "sold" ? `${C.green}18` : `${C.blue}18`, color: tx.type === "sold" ? C.green : C.blue }}>
                            {tx.type === "sold" ? "SELL" : "BUY"}
                          </span>
                        </td>
                        <td style={{ padding: "6px 8px", color: C.text }}>{Number(tx.energyKwh || 0).toFixed(3)} kWh</td>
                        <td style={{ padding: "6px 8px", color: C.purple, fontWeight: 600 }}>{Number(tx.amount || 0).toFixed(1)}</td>
                      </tr>
                    ))}
                    {allTransactions.length === 0 && (
                      <tr><td colSpan={4} style={{ padding: "12px", textAlign: "center", color: C.text3 }}>No transactions yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* 24h Demand Forecast */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Card title="Operator Profile" accent={C.purple}>
                {[
                  { label: "Operator", value: user?.user?.name || user?.name || "Grid Operator", icon: <UserCircleIcon size={14} color={C.purple} /> },
                  { label: "Role", value: user?.user?.userType || user?.userType || "utility", icon: <Building2Icon size={14} color={C.blue} /> },
                  { label: "Location", value: profileData.location, icon: <MapPinIcon size={14} color={C.green} /> },
                  { label: "Wallet", value: walletDisplay, icon: <WalletIcon size={14} color={C.yellow} /> },
                ].map(({ label, value, icon }) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
                    <span style={{ display: "flex", alignItems: "center" }}>{icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 9, color: C.text3, textTransform: "uppercase", letterSpacing: 1 }}>{label}</p>
                      <p style={{ fontSize: 11, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</p>
                    </div>
                  </div>
                ))}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 10 }}>
                  <div style={{ background: C.bg2, borderRadius: 4, padding: "8px 10px" }}>
                    <p style={{ fontSize: 9, color: C.text3, textTransform: "uppercase", marginBottom: 4 }}>Baseline Load</p>
                    <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 12, color: C.blue }}>{profileData.energyUsage} kWh/mo</p>
                  </div>
                  <div style={{ background: C.bg2, borderRadius: 4, padding: "8px 10px" }}>
                    <p style={{ fontSize: 9, color: C.text3, textTransform: "uppercase", marginBottom: 4 }}>Backup Assets</p>
                    <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 12, color: profileData.hasSolarPanels ? C.green : C.text2 }}>
                      {profileData.hasSolarPanels ? "Distributed Solar" : "Grid Only"}
                    </p>
                  </div>
                </div>
              </Card>

              <Card title="24h Demand Forecast" badge={<Badge color={C.purple} bg="rgba(167,139,250,.1)">ML</Badge>}>
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={forecast} margin={{ top: 5, right: 8, left: -16, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradDemand" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={C.purple} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={C.purple} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                    <XAxis dataKey="hour" tickFormatter={h => `${h}h`} tick={{ fill: C.text3, fontSize: 8 }} axisLine={{ stroke: C.border }} tickLine={false} interval={3} />
                    <YAxis tick={{ fill: C.text3, fontSize: 8 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: C.bg2, borderColor: C.border, borderRadius: 4, fontSize: 11 }}
                      formatter={(v, n) => [`${Number(v).toExponential(3)} kWh`, n]} />
                    <Area type="monotone" dataKey="demand_kwh" name="Demand" stroke={C.purple} strokeWidth={2} fill="url(#gradDemand)" dot={false} />
                    <Area type="monotone" dataKey="supply_kwh" name="Supply" stroke={C.green} strokeWidth={1.5} strokeDasharray="4 4" fill="none" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>

              {/* Grid Health Gauge */}
              <Card title="Grid Health Score" accent={healthColor(healthScore) + "60"}>
                <div style={{ textAlign: "center", padding: "8px 0 12px" }}>
                  <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 48, color: healthColor(healthScore), lineHeight: 1 }}>{healthScore}</p>
                  <p style={{ fontSize: 10, color: healthColor(healthScore), marginTop: 4, textTransform: "uppercase", letterSpacing: 2 }}>
                    {healthScore >= 75 ? "Optimal" : healthScore >= 45 ? "Elevated" : "Critical"}
                  </p>
                </div>
                <div style={{ height: 6, background: C.bg2, borderRadius: 4, overflow: "hidden", marginBottom: 12 }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${healthScore}%` }} transition={{ duration: 1.2, ease: "easeOut" }}
                    style={{ height: "100%", background: `linear-gradient(90deg, ${C.red}, ${C.yellow}, ${C.green})`, borderRadius: 4 }} />
                </div>
                {[
                  { label: "Stability Score", value: `${((siteSummary?.totals?.stability_score || 0) * 100).toFixed(0)}%` },
                  { label: "Device Status", value: socketConnected ? "Online" : "Offline", color: socketConnected ? C.green : C.red },
                  { label: "Load Trend", value: siteSummary?.current?.load_trend || "--" },
                  { label: "Alert State", value: siteSummary?.alertState || "--" },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: `1px solid ${C.border}`, fontSize: 11 }}>
                    <span style={{ color: C.text3 }}>{label}</span>
                    <span style={{ color: color || C.text, fontWeight: 600 }}>{value}</span>
                  </div>
                ))}
              </Card>

              {/* Quick actions */}
              <Card title="Actions">
                {[
                  { label: "⚡ Manage Listings", color: C.yellow, route: "/marketplace" },
                  { label: "📊 Energy Forecast", color: C.purple, route: "/forecast" },
                  { label: "👤 Profile", color: C.green, route: "/profile" },
                  { label: "⚙ Settings", color: C.text2, route: "/profile" },
                ].map(({ label, color, route }) => (
                  <motion.button key={label} whileHover={{ x: 3 }} whileTap={{ scale: 0.97 }}
                    onClick={() => navigate(route)}
                    style={{ width: "100%", padding: "8px 10px", marginBottom: 6, background: "transparent", border: `1px solid ${C.border}`, borderRadius: 4, color, fontSize: 11, textAlign: "left", fontFamily: "'JetBrains Mono',monospace", cursor: "pointer" }}>
                    {label}
                  </motion.button>
                ))}
              </Card>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ borderTop: `1px solid ${C.border}`, margin: "0 14px", padding: "10px 0", display: "flex", justifyContent: "space-between", fontSize: 10, color: C.text3 }}>
          <span style={{ color: C.text2 }}>EcoGrid · Utility Dashboard</span>
          <span>Last system sync: {lastRefresh ? lastRefresh.toLocaleTimeString() : "—"}</span>
        </div>
      </div>
    </>
  )
}

export default UtilityDashboard
