"use client"

import { useState, useEffect, useContext } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area } from "recharts"
import {
  BatteryChargingIcon, ZapIcon, ShoppingCartIcon, WalletIcon,
  EditIcon, TrendingUpIcon, MapPinIcon, SunIcon, WindIcon,
} from "lucide-react"
import NavBar from "./NavBar"
import { AuthContext } from "../Context/AuthContext"
import useSocket from "../hooks/useSocket"
import { handlesuccess, handleerror } from "../../utils"
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
  @keyframes pulseSkel{0%,100%{opacity:1}50%{opacity:.5}}
  @keyframes spin{to{transform:rotate(360deg)}}
  *{box-sizing:border-box}
  ::-webkit-scrollbar{width:3px;height:3px}
  ::-webkit-scrollbar-track{background:#060810}
  ::-webkit-scrollbar-thumb{background:#2a3155;border-radius:2px}
  input[type=range]{width:100%;accent-color:#00e5a0;cursor:pointer}
  input[type=number],input[type=text]{outline:none;min-width:0}
  button{cursor:pointer}
`

const Card = ({ title, badge, children, style = {} }) => (
  <div style={{ background: C.bg3, border: `1px solid ${C.border}`, borderRadius: 6, padding: 14, overflow: "hidden", ...style }}>
    {(title || badge) && (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 11, fontWeight: 700, color: C.text2, letterSpacing: "1.5px", textTransform: "uppercase" }}>{title}</span>
        {badge}
      </div>
    )}
    {children}
  </div>
)

const Badge = ({ children, color = C.green, bg = "rgba(0,229,160,.12)", border = "rgba(0,229,160,.2)" }) => (
  <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 2, letterSpacing: ".5px", textTransform: "uppercase", background: bg, color, border: `1px solid ${border}`, whiteSpace: "nowrap" }}>{children}</span>
)

const Skel = ({ width = "100%", height = 20, style = {}, circle = false }) => (
  <div style={{ width, height, background: C.border2, borderRadius: circle ? "50%" : 4, animation: "pulseSkel 1.5s infinite ease-in-out", ...style }} />
)

const KpiTile = ({ icon, value, label, color }) => (
  <motion.div whileHover={{ scale: 1.03, y: -1 }}
    style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 10px", borderRadius: 4, background: C.bg2, border: `1px solid ${C.border}`, overflow: "hidden" }}>
    <div style={{ padding: 6, borderRadius: 4, background: C.bg, border: `1px solid ${C.border}`, color, display: "flex", flexShrink: 0 }}>{icon}</div>
    <div style={{ minWidth: 0 }}>
      {value === null ? <Skel width={60} height={12} style={{ marginBottom: 4 }} /> : <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 12, color: C.text, lineHeight: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</p>}
      <p style={{ fontSize: 9, color: C.text3, textTransform: "uppercase", letterSpacing: 1, marginTop: 3 }}>{label}</p>
    </div>
  </motion.div>
)

const Spinner = () => (
  <svg width={12} height={12} viewBox="0 0 24 24" style={{ animation: "spin 1s linear infinite", flexShrink: 0 }}>
    <circle cx="12" cy="12" r="10" fill="none" stroke="#060810" strokeWidth="3" strokeDasharray="30" strokeLinecap="round" />
  </svg>
)

const formatTrendTick = (value) => {
  if (!value || typeof value !== "string") return ""
  const parts = value.split(":")
  return parts.length >= 2 ? `${parts[0]}:${parts[1]}` : value
}

const getTrendDomain = (data, key) => {
  const values = data
    .map((item) => Number(item?.[key]))
    .filter((value) => Number.isFinite(value))

  if (!values.length) return [0, 1]

  const min = Math.min(...values)
  const max = Math.max(...values)

  if (min === max) {
    const padding = Math.max(Math.abs(min) * 0.05, 1)
    return [min - padding, max + padding]
  }

  const padding = (max - min) * 0.08
  return [min - padding, max + padding]
}

export default function Dashboard() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [telemetryData, setTelemetryData] = useState([])
  const [siteSummary, setSiteSummary] = useState(null)
  const { user } = useContext(AuthContext)
  const { isConnected: socketConnected, energyData: liveEnergyData, subscribeToEnergyData } = useSocket()
  const navigate = useNavigate()

  const [powerBackup, setPowerBackup] = useState({ capacity: null, sold: null, purchased: null, wallet: null })
  const [userProfileData, setUserProfileData] = useState({ location: null, energySources: null, buyers: null, sellers: null })
  const [energyPrice, setEnergyPrice] = useState(2)
  const [isSavingPrice, setIsSavingPrice] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken')
    if (!token) return
    const headers = { Authorization: `Bearer ${token}` }
    const fetchDashboardState = async () => {
      try {
        const r = await fetch(apiUrl('/user/transactions'), { headers })
        if (r.ok) {
          const d = await r.json()
          if (d.success) {
            const sold = d.transactions.filter(t => t.type === 'sold').reduce((s, t) => s + (Number(t.energyKwh) || 0), 0)
            const purchased = d.transactions.filter(t => t.type === 'bought').reduce((s, t) => s + (Number(t.energyKwh) || 0), 0)
            const buyers = new Set(d.transactions.filter(t => t.type === 'sold').map(t => t.counterparty)).size
            const sellers = new Set(d.transactions.filter(t => t.type === 'bought').map(t => t.counterparty)).size
            setPowerBackup(p => ({ ...p, sold: `${sold.toFixed(1)} kWh`, purchased: `${purchased.toFixed(1)} kWh` }))
            setUserProfileData(p => ({ ...p, buyers, sellers }))
          }
        }
      } catch {}
      try {
        const r = await fetch(apiUrl('/user/profile'), { headers })
        if (r.ok) {
          const p = await r.json()
          setPowerBackup(prev => ({ ...prev, capacity: `${p.energyUsage || 0} kWh/mo`, wallet: p.walletAddress ? p.walletAddress.slice(0, 6) + '…' : 'N/A' }))
          setUserProfileData(prev => ({ ...prev, location: p.location || 'Not set', energySources: p.hasSolarPanels ? 'Solar' : 'Grid' }))
        }
      } catch {}
      try {
        const r = await fetch(apiUrl('/dashboard/energy-price'), { headers })
        if (r.ok) { const d = await r.json(); if (d.success && d.energyPrice) setEnergyPrice(d.energyPrice) }
      } catch {}
      try {
        const r = await fetch(apiUrl('/dashboard/site-summary'), { headers })
        if (r.ok) {
          const d = await r.json()
          if (d.success) setSiteSummary(d)
        }
      } catch {}
    }

    fetchDashboardState()
    const interval = setInterval(fetchDashboardState, 30000)
    return () => clearInterval(interval)
  }, [user])

  useEffect(() => {
    ;(async () => {
      try {
        const r = await fetch(apiUrl('/dashboard/telemetry/history?window=1h'))
        if (r.ok) {
          const d = await r.json()
          const cutoff = Date.now() - 30 * 60 * 1000  // only last 30 minutes
          const history = (d.history || [])
            .filter(x => new Date(x.timestamp).getTime() >= cutoff)
            .map(x => ({
              timestamp: new Date(x.timestamp).toLocaleTimeString('en-US', { hour12: false }),
              Voltage: Number(x.voltage_v || 0),
              Current: Number(x.current_ma || 0),
              Power: Number(x.power_w || 0),
              Energy: Number(x.energy_kwh_total || 0) * 1000000,
              Consumed: Number(x.site_demand_kwh || 0),
              Produced: Number(x.site_supply_kwh || 0),
            }))
          setTelemetryData(history.slice(Math.max(history.length - 20, 0)))
        }
      } catch {}
    })()
    subscribeToEnergyData()
  }, [subscribeToEnergyData])

  useEffect(() => {
    if (!liveEnergyData) return
    const ts = new Date().toLocaleTimeString('en-US', { hour12: false })
    setTelemetryData(prev => {
      const next = [...prev, {
        timestamp: ts,
        Voltage: Number(liveEnergyData.voltage_v || 0),
        Current: Number(liveEnergyData.current_ma || 0),
        Power: Number(liveEnergyData.power_w || 0),
        Energy: Number(liveEnergyData.energy_mwh_total || 0),
        Consumed: Number(liveEnergyData.site_demand_kwh || liveEnergyData.consumed || 0),
        Produced: Number(liveEnergyData.site_supply_kwh || liveEnergyData.produced || 0),
      }]
      return next.length > 20 ? next.slice(next.length - 20) : next
    })
    setSiteSummary(prev => prev ? ({
      ...prev,
      deviceStatus: liveEnergyData.deviceStatus || prev.deviceStatus,
      freshnessMs: liveEnergyData.freshnessMs ?? prev.freshnessMs,
      current: {
        ...(prev.current || {}),
        voltage_v: liveEnergyData.voltage_v ?? prev.current?.voltage_v,
        current_ma: liveEnergyData.current_ma ?? prev.current?.current_ma,
        power_mw: liveEnergyData.power_mw ?? prev.current?.power_mw,
        power_w: liveEnergyData.power_w ?? prev.current?.power_w,
        instant_load_kw: liveEnergyData.instant_load_kw ?? prev.current?.instant_load_kw,
        energy_mwh_total: liveEnergyData.energy_mwh_total ?? prev.current?.energy_mwh_total,
        energy_kwh_total: liveEnergyData.energy_kwh_total ?? prev.current?.energy_kwh_total,
        energy_delta_kwh: liveEnergyData.energy_delta_kwh ?? prev.current?.energy_delta_kwh,
        load_trend: liveEnergyData.rolling ? (liveEnergyData.rolling.avg1mKw > liveEnergyData.rolling.avg15mKw ? 'rising' : liveEnergyData.rolling.avg1mKw < liveEnergyData.rolling.avg15mKw ? 'falling' : 'stable') : prev.current?.load_trend
      },
      pricing: liveEnergyData.pricing || prev.pricing,
      totals: liveEnergyData.rolling ? {
        ...(prev.totals || {}),
        average_load_1m_kw: liveEnergyData.rolling.avg1mKw,
        average_load_5m_kw: liveEnergyData.rolling.avg5mKw,
        average_load_15m_kw: liveEnergyData.rolling.avg15mKw,
        peak_power_today_kw: liveEnergyData.rolling.peakTodayKw,
        total_energy_today_kwh: liveEnergyData.rolling.totalEnergyTodayKwh
      } : prev.totals
    }) : prev)

    if (liveEnergyData.energy_kwh_total !== undefined && liveEnergyData.energy_kwh_total !== null) {
      setPowerBackup(prev => ({
        ...prev,
        capacity: `${Number(liveEnergyData.energy_kwh_total).toFixed(2)} kWh/mo`
      }))
    }
  }, [liveEnergyData])

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const savePrice = async () => {
    setIsSavingPrice(true)
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken')
      const r = await fetch(apiUrl('/dashboard/energy-price'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ energyPrice })
      })
      r.ok ? handlesuccess('Price saved!') : handleerror('Failed to save')
    } catch { handleerror('Error saving') }
    finally { setIsSavingPrice(false) }
  }

  const marketAverage = siteSummary?.pricing?.base_rate || 2
  const comparisonDelta = marketAverage ? ((energyPrice - marketAverage) / marketAverage) * 100 : 0
  const comparison = comparisonDelta >= 0 ? `+${comparisonDelta.toFixed(0)}% ▲` : `${comparisonDelta.toFixed(0)}% ▼`
  const trendLabel = siteSummary?.current?.load_trend === 'rising'
    ? 'Rising Load'
    : siteSummary?.current?.load_trend === 'falling'
      ? 'Falling Load'
      : 'Stable Load'
  const trendColor = siteSummary?.current?.load_trend === 'rising' ? C.yellow : siteSummary?.current?.load_trend === 'falling' ? C.blue : C.green
  const miniStats = [
    { label: "Peak Today", value: `${(siteSummary?.totals?.peak_power_today_kw || 0).toFixed(3)} kW`, color: C.yellow },
    { label: "Avg Load", value: `${(siteSummary?.totals?.average_load_15m_kw || 0).toFixed(3)} kW`, color: C.blue },
    { label: "Net Balance", value: `${((siteSummary?.totals?.total_supply_today_kwh || 0) - (siteSummary?.totals?.total_demand_today_kwh || 0)).toFixed(3)} kWh`, color: ((siteSummary?.totals?.total_supply_today_kwh || 0) - (siteSummary?.totals?.total_demand_today_kwh || 0)) >= 0 ? C.green : C.red },
  ]
  const telemetryTiles = [
    { label: "Voltage", value: `${(siteSummary?.current?.voltage_v || 0).toFixed(2)} V`, color: C.blue },
    { label: "Current", value: `${(siteSummary?.current?.current_ma || 0).toFixed(1)} mA`, color: C.yellow },
    { label: "Power", value: `${(siteSummary?.current?.power_w || 0).toFixed(3)} W`, color: C.green },
    { label: "Energy", value: `${(siteSummary?.current?.energy_mwh_total || 0).toFixed(2)} mWh`, color: C.purple },
  ]

  return (
    <>
      <style>{css}</style>
      <NavBar />

      <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'JetBrains Mono',monospace", fontSize: 13, paddingTop: 52 }}>

        {/* Top strip */}
        <div style={{ background: "rgba(6,8,16,.97)", borderBottom: `1px solid ${C.border}`, padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 44, backdropFilter: "blur(20px)", position: "sticky", top: 52, zIndex: 40 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 15, color: C.green }}>
              EcoGrid <span style={{ color: C.text2, fontWeight: 400 }}>/ Dashboard</span>
            </span>
            <span style={{ fontSize: 10, color: C.text3 }}>Welcome, <span style={{ color: C.green }}>{user?.user?.name || user?.name || "User"}</span></span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: socketConnected ? C.green : C.yellow, animation: "pulse2 2s infinite" }} />
              <span style={{ fontSize: 10, color: socketConnected ? C.green : C.yellow }}>{socketConnected ? "LIVE" : "CONNECTING"}</span>
            </div>
            <span style={{ fontSize: 10, color: C.text3, fontFamily: "'JetBrains Mono',monospace" }}>{currentTime.toLocaleTimeString()}</span>
          </div>
        </div>

        {/* ── Main 3-column layout ── */}
        <div style={{ padding: 16, display: "grid", gridTemplateColumns: "250px 1fr 220px", gap: 12, alignItems: "start" }}>

          {/* ── COL 1: Power Backup + Energy Pricing ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>

            {/* Power Backup */}
            <Card title="Power Backup" badge={
              <button style={{ background: "transparent", border: `1px solid ${C.border}`, borderRadius: 3, padding: "2px 6px", color: C.text2, fontSize: 9, display: "flex", alignItems: "center", gap: 3 }}>
                <EditIcon size={9} />Edit
              </button>
            }>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                {[
                  { icon: <BatteryChargingIcon size={13} color={C.green} />, value: powerBackup.capacity, label: "Usage/mo", color: C.green },
                  { icon: <ZapIcon size={13} color={C.yellow} />, value: powerBackup.sold, label: "Sold", color: C.yellow },
                  { icon: <ShoppingCartIcon size={13} color={C.blue} />, value: powerBackup.purchased, label: "Purchased", color: C.blue },
                  { icon: <WalletIcon size={13} color={C.purple} />, value: powerBackup.wallet, label: "Wallet", color: C.purple },
                ].map((item, i) => <KpiTile key={i} {...item} />)}
              </div>
            </Card>

            {/* Energy Pricing — fixed overflow */}
            <Card title="Energy Pricing" badge={<Badge color={C.yellow} bg="rgba(255,209,102,.12)" border="rgba(255,209,102,.2)">NOK</Badge>}>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

                {/* Slider block */}
                <div style={{ background: C.bg2, border: `1px solid ${C.border}`, padding: "11px 12px", borderRadius: 4 }}>
                  <p style={{ fontSize: 9, color: C.text3, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Token Value (NOK)</p>
                  <input type="range" value={energyPrice} min={1} max={2} step={0.1}
                    onChange={e => setEnergyPrice(parseFloat(e.target.value))} />
                  {/* Custom track fill */}
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: C.text3, marginTop: 2 }}>
                    <span>1.0</span><span>1.5</span><span>2.0</span>
                  </div>
                  <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 20, color: C.green, textAlign: "center", marginTop: 6, letterSpacing: "-0.5px" }}>{energyPrice.toFixed(1)} NOK</p>
                </div>

                {/* Input + Set btn — key fix: no flex children overflowing */}
                <div>
                  <p style={{ fontSize: 9, color: C.text3, textTransform: "uppercase", letterSpacing: 1, marginBottom: 5 }}>Tokens / kWh</p>
                  <div style={{ display: "flex", width: "100%", overflow: "hidden", borderRadius: 4, border: `1px solid ${C.border2}` }}>
                    <input type="number"
                      style={{ flex: 1, minWidth: 0, background: C.bg2, border: "none", color: C.text, fontFamily: "'JetBrains Mono',monospace", fontSize: 13, padding: "7px 10px" }}
                      value={energyPrice}
                      onChange={e => setEnergyPrice(parseFloat(e.target.value) || 2)} />
                    <motion.button onClick={savePrice} disabled={isSavingPrice}
                      whileHover={isSavingPrice ? {} : { scale: 1.04 }} whileTap={isSavingPrice ? {} : { scale: 0.96 }}
                      style={{ flexShrink: 0, padding: "7px 12px", background: isSavingPrice ? C.border2 : `linear-gradient(135deg,${C.green},#00b4d8)`, border: "none", color: "#060810", fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 10, letterSpacing: 1, textTransform: "uppercase", display: "flex", alignItems: "center", justifyContent: "center", gap: 4, minWidth: 44 }}>
                      {isSavingPrice ? <Spinner /> : "Set"}
                    </motion.button>
                  </div>
                </div>

                {/* Market comparison */}
                <div style={{ background: C.bg2, border: `1px solid ${C.border}`, padding: "10px 12px", borderRadius: 4 }}>
                  {[
                    ["Market Avg", `${marketAverage.toFixed(1)} tok`, C.text2],
                    ["Your Price", `${energyPrice.toFixed(1)} tok`, C.green],
                    ["vs Market", comparison, comparisonDelta >= 0 ? C.green : C.red],
                  ].map(([lbl, val, col], i, arr) => (
                    <div key={lbl} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: i < arr.length - 1 ? 6 : 0, marginBottom: i < arr.length - 1 ? 6 : 0, borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : "none" }}>
                      <span style={{ fontSize: 10, color: C.text2 }}>{lbl}</span>
                      <span style={{ fontSize: 10, color: col, fontWeight: 600 }}>{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          {/* ── COL 2: Live Smart Meter Chart ── */}
          <Card title="Live Smart Meter Data" badge={
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: socketConnected ? C.green : C.yellow, animation: "pulse2 2s infinite" }} />
              <Badge color={socketConnected ? C.green : C.yellow}
                bg={socketConnected ? "rgba(0,229,160,.1)" : "rgba(255,209,102,.1)"}
                border={socketConnected ? "rgba(0,229,160,.2)" : "rgba(255,209,102,.2)"}>
                {socketConnected ? "Live" : "Connecting"}
              </Badge>
            </div>
          } style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 14 }}>
              {telemetryTiles.map(({ label, value, color }) => (
                <div key={label} style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 4, padding: "10px 12px", textAlign: "center" }}>
                  <p style={{ fontSize: 9, color: C.text3, textTransform: "uppercase", letterSpacing: 1, marginBottom: 5 }}>{label}</p>
                  <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 16, color }}>{value}</p>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[
                { title: "Voltage", key: "Voltage", color: C.blue, unit: "V" },
                { title: "Amperage", key: "Current", color: C.yellow, unit: "mA" },
                { title: "Power", key: "Power", color: C.green, unit: "W" },
                { title: "Energy", key: "Energy", color: C.purple, unit: "kWh" },
              ].map(({ title, key, color, unit }) => (
                <div key={key} style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 4, padding: 10, minWidth: 0, overflow: "hidden" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: 10, color: C.text2, textTransform: "uppercase", letterSpacing: 1 }}>{title} Trend</span>
                    <span style={{ fontSize: 9, color }}>━ {title} ({unit})</span>
                  </div>
                  <ResponsiveContainer width="100%" height={145}>
                    <LineChart data={telemetryData} margin={{ top: 5, right: 8, left: -16, bottom: 12 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                      <XAxis
                        dataKey="timestamp"
                        tick={{ fill: C.text3, fontSize: 8, fontFamily: "'JetBrains Mono',monospace" }}
                        axisLine={{ stroke: C.border }}
                        tickLine={false}
                        interval="preserveStartEnd"
                        minTickGap={24}
                        tickFormatter={formatTrendTick}
                      />
                      <YAxis
                        domain={getTrendDomain(telemetryData, key)}
                        tick={{ fill: C.text3, fontSize: 8, fontFamily: "'JetBrains Mono',monospace" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip contentStyle={{ backgroundColor: C.bg2, borderColor: C.border, borderRadius: 4, color: C.text, fontSize: 11, fontFamily: "'JetBrains Mono',monospace" }} labelStyle={{ color: C.text2, marginBottom: 4 }} />
                      <Line type="monotone" dataKey={key} stroke={color} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <TrendingUpIcon size={11} color={trendColor} />
                <span style={{ fontSize: 9, color: trendColor, fontWeight: 600 }}>{trendLabel}</span>
              </div>
            </div>

            {/* Mini stat row below chart */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 14 }}>
              {miniStats.map(({ label, value, color }) => (
                <div key={label} style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 4, padding: "8px 10px", textAlign: "center" }}>
                  <p style={{ fontSize: 9, color: C.text3, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>{label}</p>
                  <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 14, color }}>{value}</p>
                </div>
              ))}
            </div>

            {/* ── Production vs Consumption chart ── */}
            <div style={{ marginTop: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 11, fontWeight: 700, color: C.text2, letterSpacing: "1.5px", textTransform: "uppercase" }}>Energy Flow — Consumed vs Produced</span>
                <div style={{ display: "flex", gap: 14 }}>
                  <span style={{ fontSize: 9, color: C.red }}>━ Consumed</span>
                  <span style={{ fontSize: 9, color: C.green }}>━ Produced</span>
                </div>
              </div>

              {/* Today's balance row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 10 }}>
                {[
                  { label: "Consumed Today", value: `${((siteSummary?.totals?.total_demand_today_kwh || 0) * 1000).toFixed(3)} Wh`, color: C.red },
                  { label: "Produced Today", value: `${((siteSummary?.totals?.total_supply_today_kwh || 0) * 1000).toFixed(3)} Wh`, color: C.green },
                  { label: "Net Balance", value: `${(((siteSummary?.totals?.total_supply_today_kwh || 0) - (siteSummary?.totals?.total_demand_today_kwh || 0)) * 1000).toFixed(3)} Wh`, color: ((siteSummary?.totals?.total_supply_today_kwh || 0) >= (siteSummary?.totals?.total_demand_today_kwh || 0)) ? C.green : C.red },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 4, padding: "8px 10px", textAlign: "center" }}>
                    <p style={{ fontSize: 9, color: C.text3, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>{label}</p>
                    <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 13, color }}>{value}</p>
                  </div>
                ))}
              </div>

              <div style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 4, padding: 10 }}>
                <ResponsiveContainer width="100%" height={160}>
                  <AreaChart data={telemetryData} margin={{ top: 5, right: 8, left: -16, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradConsumed" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={C.red} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={C.red} stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="gradProduced" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={C.green} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={C.green} stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                    <XAxis dataKey="timestamp" tick={{ fill: C.text3, fontSize: 8, fontFamily: "'JetBrains Mono',monospace" }} axisLine={{ stroke: C.border }} tickLine={false} interval="preserveStartEnd" minTickGap={24} tickFormatter={formatTrendTick} />
                    <YAxis tick={{ fill: C.text3, fontSize: 8, fontFamily: "'JetBrains Mono',monospace" }} axisLine={false} tickLine={false} tickFormatter={v => v === 0 ? '0' : v.toExponential(1)} />
                    <Tooltip
                      contentStyle={{ backgroundColor: C.bg2, borderColor: C.border, borderRadius: 4, color: C.text, fontSize: 11, fontFamily: "'JetBrains Mono',monospace" }}
                      labelStyle={{ color: C.text2, marginBottom: 4 }}
                      formatter={(val, name) => [`${Number(val).toExponential(3)} kWh`, name]}
                    />
                    <Area type="monotone" dataKey="Consumed" stroke={C.red} strokeWidth={2} fill="url(#gradConsumed)" dot={false} activeDot={{ r: 4 }} />
                    <Area type="monotone" dataKey="Produced" stroke={C.green} strokeWidth={2} fill="url(#gradProduced)" dot={false} activeDot={{ r: 4 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>

          {/* ── COL 3: User Profile ── */}
          <Card title="User Profile" badge={<Badge color={C.blue} bg="rgba(77,159,255,.12)" border="rgba(77,159,255,.2)">Info</Badge>} style={{ minWidth: 0 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {[
                { icon: <MapPinIcon size={12} color={C.blue} />, label: "Location", value: userProfileData.location },
                { icon: <div style={{ display: "flex", gap: 2 }}><SunIcon size={12} color={C.yellow} /><WindIcon size={12} color={C.blue} /></div>, label: "Sources", value: userProfileData.energySources },
              ].map(({ icon, label, value }) => (
                <motion.div key={label} whileHover={{ x: 2 }} style={{ display: "flex", alignItems: "center", padding: "8px 9px", borderRadius: 4, background: C.bg2, border: `1px solid ${C.border}`, gap: 8, overflow: "hidden" }}>
                  <div style={{ padding: 5, borderRadius: 3, background: C.bg, border: `1px solid ${C.border}`, display: "flex", flexShrink: 0 }}>{icon}</div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 9, color: C.text3, textTransform: "uppercase", letterSpacing: 1 }}>{label}</p>
                    {value === null ? <Skel width={80} height={12} style={{ marginTop: 2 }} /> : <p style={{ fontSize: 11, color: C.text, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</p>}
                  </div>
                </motion.div>
              ))}

              <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 10, marginTop: 2 }}>
                <p style={{ fontSize: 9, color: C.text3, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Trade Stats</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
                  {[[userProfileData.buyers, "Buyers", C.green], [userProfileData.sellers, "Sellers", C.purple]].map(([val, label, color]) => (
                    <motion.div key={label} whileHover={{ scale: 1.04, y: -2 }}
                      style={{ background: C.bg2, border: `1px solid ${C.border}`, padding: "10px 8px", borderRadius: 4, textAlign: "center" }}>
                      <p style={{ fontSize: 9, color: C.text3, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>{label}</p>
                      {val === null ? <div style={{ display: "flex", justifyContent: "center" }}><Skel width={30} height={22} /></div> : <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 22, color, lineHeight: 1 }}>{val}</p>}
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Quick actions */}
              <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 10, marginTop: 2 }}>
                <p style={{ fontSize: 9, color: C.text3, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Quick Actions</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {[
                    { label: "⚡ Trade Energy", color: C.green, route: "/marketplace" },
                    { label: "📊 View Reports", color: C.blue, route: "/prosumer" },
                    { label: "⚙ Settings", color: C.text2, route: "/profile" },
                  ].map(({ label, color, route }) => (
                    <motion.button key={label} whileHover={{ x: 3 }} whileTap={{ scale: 0.97 }}
                      onClick={() => navigate(route)}
                      style={{ width: "100%", padding: "7px 10px", background: "transparent", border: `1px solid ${C.border}`, borderRadius: 4, color, fontSize: 11, textAlign: "left", fontFamily: "'JetBrains Mono',monospace" }}>
                      {label}
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Footer */}
        <div style={{ borderTop: `1px solid ${C.border}`, margin: "0 16px", padding: "10px 0", display: "flex", justifyContent: "space-between", fontSize: 10, color: C.text3 }}>
          <span style={{ color: C.text2 }}>EcoGrid · Sustainable Energy Network</span>
          <span>Last updated: {currentTime.toLocaleString()}</span>
        </div>
      </div>
    </>
  )
}
