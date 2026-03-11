"use client"

import { useState, useEffect, useContext, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, Cell } from "recharts"
import {
  HomeIcon, ZapIcon, ShoppingCartIcon, WalletIcon, TrendingUpIcon,
  BarChart3Icon, UserIcon, MapPinIcon, LightbulbIcon, PiggyBankIcon,
  LeafIcon, ArrowRightIcon, ClockIcon, DollarSignIcon, AlertCircle,
  CheckCircle2, TrendingDownIcon, UsersIcon,
} from "lucide-react"
import NavBar from "./NavBar"
import { AuthContext } from "../Context/AuthContext"
import useSocket from "../hooks/useSocket"
import { apiUrl } from "../config"

// ─── Theme ────────────────────────────────────────────────────────────────
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
  @keyframes spin{to{transform:rotate(360deg)}}
  *{box-sizing:border-box}
  ::-webkit-scrollbar{width:3px}
  ::-webkit-scrollbar-thumb{background:#2a3155;border-radius:2px}
`

const Card = ({ title, badge, children, style = {}, accent = C.border }) => (
  <div style={{ background: C.bg3, border: `1px solid ${accent}`, borderRadius: 8, padding: 16, ...style }}>
    {(title || badge) && (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
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

const Row = ({ label, value, color = C.text }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: `1px solid ${C.border}` }}>
    <span style={{ fontSize: 11, color: C.text2 }}>{label}</span>
    <span style={{ fontSize: 12, fontWeight: 600, color, fontFamily: "'JetBrains Mono',monospace" }}>{value}</span>
  </div>
)

// ─── Main Component ───────────────────────────────────────────────────────
const ConsumerDashboard = () => {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [consumptionData, setConsumptionData] = useState([])
  const { user } = useContext(AuthContext)
  const { isConnected: socketConnected, energyData: liveEnergyData, subscribeToEnergyData } = useSocket()

  const [stats, setStats] = useState({ monthlyUsage: 0, purchased: 0, savings: 0, walletSpent: 0, wallet: "--" })
  const [profile, setProfile] = useState({ location: "Not set", energySource: "Grid Only", carbonFootprint: 0, sellers: 0 })
  const [energyPrice, setEnergyPrice] = useState(2)
  const [gridRefRate, setGridRefRate] = useState(0.15)
  const [siteSummary, setSiteSummary] = useState(null)
  const [opportunities, setOpportunities] = useState([])
  const [forecast, setForecast] = useState([])
  const [usageHistory, setUsageHistory] = useState([]) // last 7 readings for sparkline
  const todayConsumed = useRef(0)

  // ── Fetch all consumer data ───────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken")
    if (!token) return
    const h = { Authorization: `Bearer ${token}` }

    const load = async () => {
      // Transactions
      try {
        const r = await fetch(apiUrl("/user/transactions"), { headers: h })
        if (r.ok) {
          const d = await r.json()
          if (d.success) {
            const bought = d.transactions.filter(t => t.type === "bought")
            const kwhBought = bought.reduce((s, t) => s + (Number(t.energyKwh) || 0), 0)
            const spent = bought.reduce((s, t) => s + (Number(t.amount) || 0), 0)
            const savings = Math.max(0, kwhBought * 0.15 - spent * 0.05)
            const sellers = new Set(bought.map(t => t.counterparty)).size
            setStats(p => ({ ...p, purchased: kwhBought, savings, walletSpent: spent }))
            setProfile(p => ({ ...p, sellers }))
          }
        }
      } catch {}

      // Profile
      try {
        const r = await fetch(apiUrl("/user/profile"), { headers: h })
        if (r.ok) {
          const d = await r.json()
          const co2 = (d.energyUsage || 0) * 0.4 * 12
          setStats(p => ({
            ...p, monthlyUsage: d.energyUsage || 0,
            wallet: d.walletAddress ? d.walletAddress.slice(0, 6) + "…" : "N/A"
          }))
          setProfile(p => ({
            ...p,
            location: d.location || "Not set",
            energySource: d.hasSolarPanels ? "Solar + Grid" : "Grid Only",
            carbonFootprint: co2
          }))
        }
      } catch {}

      // Site summary & pricing
      try {
        const r = await fetch(apiUrl("/dashboard/site-summary"), { headers: h })
        if (r.ok) {
          const d = await r.json()
          if (d.success) {
            setSiteSummary(d)
            setGridRefRate(d.pricing?.grid_reference_rate_usd || 0.15)
          }
        }
      } catch {}

      // Energy price
      try {
        const r = await fetch(apiUrl("/dashboard/energy-price"), { headers: h })
        if (r.ok) { const d = await r.json(); if (d.success && d.energyPrice) setEnergyPrice(d.energyPrice) }
      } catch {}

      // Marketplace opportunities (cheapest buy windows)
      try {
        const r = await fetch(apiUrl("/dashboard/marketplace-opportunities"), { headers: h })
        if (r.ok) {
          const d = await r.json()
          if (d.success) setOpportunities(d.opportunities)
        }
      } catch {}

      // Site forecast for next-6h price chart
      try {
        const r = await fetch(apiUrl("/dashboard/site-forecast?hours=12"), { headers: h })
        if (r.ok) {
          const d = await r.json()
          if (d.success) setForecast(d.forecast.slice(0, 12))
        }
      } catch {}
    }

    load()
    const iv = setInterval(load, 60000)
    return () => clearInterval(iv)
  }, [user])

  // ── Live socket data ──────────────────────────────────────────────────
  useEffect(() => { subscribeToEnergyData() }, [subscribeToEnergyData])

  useEffect(() => {
    if (!liveEnergyData) return
    const ts = new Date().toLocaleTimeString("en-US", { hour12: false })
    const consumed = Number(liveEnergyData.site_demand_kwh || liveEnergyData.consumed || 0)
    todayConsumed.current += consumed
    setConsumptionData(prev => {
      const next = [...prev, { timestamp: ts, "Consumed": consumed, "P2P Price": energyPrice * 0.05, "Grid Price": gridRefRate }]
      return next.length > 15 ? next.slice(next.length - 15) : next
    })
    setUsageHistory(prev => {
      const next = [...prev, consumed]
      return next.length > 20 ? next.slice(next.length - 20) : next
    })
  }, [liveEnergyData, energyPrice, gridRefRate])

  useEffect(() => { const t = setInterval(() => setCurrentTime(new Date()), 1000); return () => clearInterval(t) }, [])

  // ── Derived values ────────────────────────────────────────────────────
  const p2pRate = siteSummary?.pricing?.display_rate_usd || energyPrice * 0.05
  const pctSavings = gridRefRate > 0 ? ((1 - p2pRate / gridRefRate) * 100).toFixed(0) : 0
  const liveLoad = Number(liveEnergyData?.power_w || 0)
  const estimatedHourlyCost = (liveLoad / 1000) * p2pRate // kW × $/kWh
  const dailyBudget = stats.monthlyUsage > 0 ? (stats.monthlyUsage / 30) * p2pRate : 0
  const todaySpend = todayConsumed.current * p2pRate
  const budgetPct = dailyBudget > 0 ? Math.min(100, (todaySpend / dailyBudget) * 100) : 0

  // Build bar chart data for usage history
  const sparkBars = usageHistory.map((v, i) => ({ i, v }))

  // Carbon saved vs grid (grid = 0.4 kg CO₂/kWh, P2P energy mix is ~0.15 avg)
  const carbonSaved = stats.purchased * 0.25 // 0.4 - 0.15 per kWh

  return (
    <>
      <style>{css}</style>
      <NavBar />
      <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'JetBrains Mono',monospace", fontSize: 13, paddingTop: 52 }}>

        {/* Top bar */}
        <div style={{ background: "rgba(6,8,16,.97)", borderBottom: `1px solid ${C.border}`, padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 44, position: "sticky", top: 52, zIndex: 40 }}>
          <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 15, color: C.blue }}>
            EcoGrid <span style={{ color: C.text2, fontWeight: 400 }}>/ Consumer</span>
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: socketConnected ? C.green : C.yellow, animation: "pulse2 2s infinite" }} />
              <span style={{ fontSize: 10, color: socketConnected ? C.green : C.yellow }}>{socketConnected ? "LIVE" : "CONNECTING"}</span>
            </div>
            <span style={{ fontSize: 10, color: C.text3 }}>Welcome, <span style={{ color: C.blue }}>{user?.user?.name || user?.name || "Consumer"}</span></span>
            <span style={{ fontSize: 10, color: C.text3 }}>{currentTime.toLocaleTimeString()}</span>
          </div>
        </div>

        <div style={{ padding: 16, display: "grid", gridTemplateColumns: "240px 1fr 220px", gap: 12, alignItems: "start" }}>

          {/* ── COL 1 ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

            {/* My Consumption KPIs */}
            <Card title="My Usage" accent={C.blue}>
              {[
                { label: "Monthly Usage", value: `${stats.monthlyUsage} kWh/mo`, color: C.blue },
                { label: "Energy Bought", value: `${stats.purchased.toFixed(1)} kWh`, color: C.green },
                { label: "ETK Spent", value: `${stats.walletSpent.toFixed(1)} ETK`, color: C.purple },
                { label: "Est. Savings", value: `$${stats.savings.toFixed(2)}`, color: C.yellow },
              ].map(({ label, value, color }) => (
                <motion.div key={label} whileHover={{ x: 3 }}
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: 10, color: C.text3, textTransform: "uppercase", letterSpacing: 1 }}>{label}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color, fontFamily: "'Syne',sans-serif" }}>{value}</span>
                </motion.div>
              ))}
            </Card>

            {/* Daily Budget Meter */}
            <Card title="Daily Budget" accent={budgetPct > 80 ? C.red : budgetPct > 50 ? C.yellow : C.green}>
              <div style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.text3, marginBottom: 6 }}>
                  <span>Spent Today</span>
                  <span style={{ color: budgetPct > 80 ? C.red : C.green }}>{budgetPct.toFixed(0)}%</span>
                </div>
                <div style={{ height: 6, background: C.bg2, borderRadius: 4, overflow: "hidden" }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${budgetPct}%` }} transition={{ duration: 0.8 }}
                    style={{ height: "100%", borderRadius: 4, background: budgetPct > 80 ? C.red : budgetPct > 50 ? C.yellow : C.green }} />
                </div>
              </div>
              <Row label="Daily Budget" value={`$${dailyBudget.toFixed(4)}`} />
              <Row label="Spent Today" value={`$${todaySpend.toFixed(5)}`} color={budgetPct > 80 ? C.red : C.green} />
              <Row label="Live Load" value={`${liveLoad.toFixed(3)} W`} color={C.blue} />
              <Row label="Cost/hr (est)" value={`$${(estimatedHourlyCost).toFixed(5)}`} />
            </Card>

            {/* Carbon Footprint */}
            <Card title="Carbon Impact" accent={C.green}>
              {[
                { label: "Annual CO₂ (est)", value: `${profile.carbonFootprint.toFixed(0)} kg`, color: C.red },
                { label: "Saved via P2P", value: `${carbonSaved.toFixed(2)} kg`, color: C.green },
                { label: "Energy Source", value: profile.energySource, color: C.yellow },
              ].map(({ label, value, color }) => <Row key={label} label={label} value={value} color={color} />)}
            </Card>
          </div>

          {/* ── COL 2 ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

            {/* Live Consumption Chart */}
            <Card title="Live Energy Consumption" badge={
              <Badge color={socketConnected ? C.green : C.yellow} bg={socketConnected ? "rgba(0,229,160,.1)" : "rgba(255,209,102,.1)"}>
                {socketConnected ? "Live" : "Connecting"}
              </Badge>
            }>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={consumptionData} margin={{ top: 5, right: 8, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="cGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={C.blue} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={C.blue} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                  <XAxis dataKey="timestamp" tick={{ fill: C.text3, fontSize: 8 }} axisLine={{ stroke: C.border }} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fill: C.text3, fontSize: 8 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: C.bg2, borderColor: C.border, borderRadius: 4, fontSize: 11 }} />
                  <Area type="monotone" dataKey="Consumed" stroke={C.blue} strokeWidth={2} fill="url(#cGrad)" dot={false} activeDot={{ r: 4 }} />
                </AreaChart>
              </ResponsiveContainer>
            </Card>

            {/* Price Comparison Chart — P2P vs Grid over next 12h */}
            <Card title="Rate Forecast — Next 12h" badge={<Badge color={C.green}>P2P cheaper</Badge>}>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={forecast} margin={{ top: 5, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                  <XAxis dataKey="hour" tickFormatter={h => `${h}:00`} tick={{ fill: C.text3, fontSize: 8 }} axisLine={{ stroke: C.border }} tickLine={false} />
                  <YAxis tick={{ fill: C.text3, fontSize: 8 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: C.bg2, borderColor: C.border, borderRadius: 4, fontSize: 11 }}
                    formatter={(v, name) => [`${Number(v).toFixed(4)} tok`, name]} />
                  <Line type="monotone" dataKey="price_tokens_per_kwh" name="P2P Rate" stroke={C.green} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                {[
                  { label: "Current P2P", value: `$${p2pRate.toFixed(3)}/kWh`, color: C.green },
                  { label: "Grid Rate", value: `$${gridRefRate.toFixed(3)}/kWh`, color: C.red },
                  { label: "Your Saving", value: `${pctSavings}%`, color: C.yellow },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ textAlign: "center" }}>
                    <p style={{ fontSize: 9, color: C.text3, textTransform: "uppercase", marginBottom: 3 }}>{label}</p>
                    <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 13, color }}>{value}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Best Time To Buy */}
            <Card title="Cheapest Buy Windows" accent={C.yellow} badge={<Badge color={C.yellow} bg="rgba(255,209,102,.1)">AI Tip</Badge>}>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {opportunities.length === 0 ? (
                  <p style={{ fontSize: 11, color: C.text3, textAlign: "center", padding: "12px 0" }}>Calculating optimal windows…</p>
                ) : opportunities.map((op, i) => (
                  <motion.div key={i} whileHover={{ x: 4 }}
                    style={{ display: "flex", gap: 10, padding: "10px 12px", background: C.bg2, border: `1px solid ${op.type === "buy" ? C.blue + "40" : C.green + "40"}`, borderRadius: 6 }}>
                    <span style={{ fontSize: 18 }}>{op.type === "sell" ? "⚡" : "💡"}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: C.text, marginBottom: 3 }}>{op.title}</p>
                      <p style={{ fontSize: 10, color: C.text2, lineHeight: 1.4 }}>{op.message}</p>
                      {op.recommendedPrice && (
                        <p style={{ fontSize: 10, color: op.type === "buy" ? C.blue : C.green, marginTop: 4 }}>
                          Rec. rate: {op.recommendedPrice.toFixed(3)} tok/kWh
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))}
                <motion.button onClick={() => window.location.href = "/marketplace"} whileHover={{ x: 4 }} whileTap={{ scale: 0.97 }}
                  style={{ width: "100%", padding: "9px 12px", background: C.bg2, border: `1px solid ${C.green}40`, borderRadius: 6, color: C.green, fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontFamily: "'JetBrains Mono',monospace", cursor: "pointer" }}>
                  Browse Energy Listings <ArrowRightIcon size={12} />
                </motion.button>
              </div>
            </Card>
          </div>

          {/* ── COL 3 ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

            {/* Profile */}
            <Card title="My Profile" accent={C.border}>
              {[
                { label: "Location", value: profile.location, icon: "📍" },
                { label: "Wallet", value: stats.wallet, icon: "👛" },
                { label: "Sellers", value: profile.sellers, icon: "⚡" },
              ].map(({ label, value, icon }) => (
                <motion.div key={label} whileHover={{ x: 2 }}
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: 14 }}>{icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 9, color: C.text3, textTransform: "uppercase", letterSpacing: 1 }}>{label}</p>
                    <p style={{ fontSize: 11, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</p>
                  </div>
                </motion.div>
              ))}
            </Card>

            {/* Neighbourhood Comparison */}
            <Card title="vs. Zone Average" accent={C.purple} badge={<Badge color={C.purple} bg="rgba(167,139,250,.1)">Anonymised</Badge>}>
              {(() => {
                const zoneAvg = siteSummary?.totals?.average_load_15m_kw || 0
                const myLoad = Number(liveEnergyData?.instant_load_kw || 0)
                const pct = zoneAvg > 0 ? ((myLoad / zoneAvg - 1) * 100).toFixed(0) : 0
                const better = myLoad <= zoneAvg
                return (
                  <>
                    <div style={{ textAlign: "center", padding: "12px 0" }}>
                      <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 28, color: better ? C.green : C.red }}>
                        {better ? "↓" : "↑"}{Math.abs(Number(pct))}%
                      </p>
                      <p style={{ fontSize: 10, color: C.text3, marginTop: 4 }}>{better ? "below" : "above"} zone avg</p>
                    </div>
                    <Row label="Your Load" value={`${myLoad.toFixed(4)} kW`} color={C.blue} />
                    <Row label="Zone 15m Avg" value={`${zoneAvg.toFixed(4)} kW`} color={C.text2} />
                    <div style={{ marginTop: 10, padding: "8px 10px", background: C.bg2, borderRadius: 4, border: `1px solid ${(better ? C.green : C.red) + "40"}` }}>
                      <p style={{ fontSize: 10, color: better ? C.green : C.red, lineHeight: 1.5 }}>
                        {better
                          ? "🌿 Great! Your load is below zone average — you may be eligible to sell surplus."
                          : "⚡ Consider buying during off-peak hours to reduce your cost."}
                      </p>
                    </div>
                  </>
                )
              })()}
            </Card>

            {/* Quick Actions */}
            <Card title="Quick Actions">
              {[
                { label: "⚡ Buy Energy", color: C.blue, route: "/marketplace" },
                { label: "📊 Forecast", color: C.purple, route: "/forecast" },
                { label: "⚙ Settings", color: C.text2, route: "/profile" },
              ].map(({ label, color, route }) => (
                <motion.button key={label} whileHover={{ x: 3 }} whileTap={{ scale: 0.97 }}
                  onClick={() => window.location.href = route}
                  style={{ width: "100%", padding: "8px 10px", marginBottom: 6, background: "transparent", border: `1px solid ${C.border}`, borderRadius: 4, color, fontSize: 11, textAlign: "left", fontFamily: "'JetBrains Mono',monospace", cursor: "pointer" }}>
                  {label}
                </motion.button>
              ))}
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div style={{ borderTop: `1px solid ${C.border}`, margin: "0 16px", padding: "10px 0", display: "flex", justifyContent: "space-between", fontSize: 10, color: C.text3 }}>
          <span style={{ color: C.text2 }}>EcoGrid · Consumer Dashboard</span>
          <span>Last updated: {currentTime.toLocaleString()}</span>
        </div>
      </div>
    </>
  )
}

export default ConsumerDashboard
