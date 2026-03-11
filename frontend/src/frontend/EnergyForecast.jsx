"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import NavBar from "./NavBar";
import { apiUrl, LSTM_CITY_API_URL, FORECAST_API_URL, ML_ECOGRID_API_URL } from "../config";

// ── CONFIG ────────────────────────────────────────────────────────────────────
const LSTM_CITY_URL = LSTM_CITY_API_URL;   // http://localhost:5000
const XGBOOST_URL   = FORECAST_API_URL;    // http://localhost:5001
const ECOGRID_URL   = ML_ECOGRID_API_URL;  // http://localhost:8000

// ── PALETTE ───────────────────────────────────────────────────────────────────
const C = {
  bg: "#04080f",
  bg2: "#070d16",
  bg3: "#0a1220",
  panel: "#0d1628",
  border: "#132035",
  border2: "#1e3050",
  green: "#00e5a0",
  green2: "#00b47e",
  red: "#ff3d5a",
  yellow: "#ffcc44",
  blue: "#3d9eff",
  purple: "#9d79f5",
  solar: "#ffcc44",
  wind: "#3d9eff",
  hydro: "#00e5a0",
  thermal: "#ff6b4a",
  text: "#dce8f5",
  muted: "#4d6a88",
  muted2: "#2a3f58",
};

const ZONES = ["Northern", "Southern", "Eastern", "Western", "NorthEastern"];
const ZONE_COLOR = { Northern: C.green, Southern: C.blue, Eastern: C.yellow, Western: C.red, NorthEastern: C.purple };
const CITIES = ["London", "New York", "Tokyo", "Paris", "Berlin", "Sydney", "Mumbai", "Dubai", "Singapore", "Chicago"];

// ── HELPERS ───────────────────────────────────────────────────────────────────
const fmt = (n, d = 2) => n == null ? "—" : Number(n).toFixed(d);
const fmtT = ts => ts ? ts.slice(11, 16) : "—";
const fmtDate = str => {
  const d = new Date(str + (str.length === 10 ? "T12:00:00" : ""));
  return d.toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric" });
};
const tempIcon = t => t >= 35 ? "🔥" : t >= 25 ? "☀️" : t >= 15 ? "⛅" : t >= 5 ? "🌧️" : "❄️";
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// ── GLOBAL STYLES ─────────────────────────────────────────────────────────────
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=IBM+Plex+Mono:wght@300;400;500&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: ${C.bg}; color: ${C.text}; font-family: 'Outfit', sans-serif; }
    ::-webkit-scrollbar { width: 4px; height: 4px; }
    ::-webkit-scrollbar-track { background: ${C.bg2}; }
    ::-webkit-scrollbar-thumb { background: ${C.border2}; border-radius: 2px; }
    input, button, select { font-family: inherit; }
    input[type=date]::-webkit-calendar-picker-indicator { filter: invert(0.6); }
    @keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.35;transform:scale(.75)} }
    @keyframes spin { to{transform:rotate(360deg)} }
    @keyframes shimmer { 0%{background-position:-400% 0} 100%{background-position:400% 0} }
    @keyframes rise { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
    @keyframes glow-pulse { 0%,100%{box-shadow:0 0 0 0 rgba(0,229,160,.0)} 50%{box-shadow:0 0 20px 2px rgba(0,229,160,.12)} }
    .fade-up { animation: rise 0.4s ease both; }
  `}</style>
);

// ── PRIMITIVES ────────────────────────────────────────────────────────────────

const Dot = ({ color = C.green, size = 7, pulse = false }) => (
  <span style={{
    display: "inline-block", width: size, height: size, borderRadius: "50%",
    background: color, flexShrink: 0,
    animation: pulse ? "pulse-dot 2s ease infinite" : "none",
  }} />
);

const Chip = ({ children, color = C.green }) => (
  <span style={{
    fontSize: 9, fontFamily: "'IBM Plex Mono',monospace", letterSpacing: ".06em",
    padding: "2px 7px", borderRadius: 3, textTransform: "uppercase",
    background: `${color}16`, color, border: `1px solid ${color}35`,
  }}>{children}</span>
);

const Skel = ({ h = 28, w = "100%", r = 4 }) => (
  <div style={{
    height: h, width: w, borderRadius: r,
    background: `linear-gradient(90deg, ${C.panel} 20%, ${C.border} 50%, ${C.panel} 80%)`,
    backgroundSize: "400% 100%", animation: "shimmer 1.8s ease infinite",
  }} />
);

const Panel = ({ children, style = {}, glow = false }) => (
  <div style={{
    background: C.panel, border: `1px solid ${C.border}`, borderRadius: 8,
    overflow: "hidden", animation: glow ? "glow-pulse 3s ease infinite" : "none",
    ...style,
  }}>{children}</div>
);

const PanelHead = ({ title, right, accent }) => (
  <div style={{
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "11px 16px",
    borderBottom: `1px solid ${C.border}`,
    background: `linear-gradient(90deg, ${accent ? accent + "0a" : "transparent"}, transparent)`,
  }}>
    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.4px", textTransform: "uppercase", color: C.muted }}>
      {title}
    </span>
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>{right}</div>
  </div>
);

const Spinner = ({ size = 16, color = C.green }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ animation: "spin .9s linear infinite", flexShrink: 0 }}>
    <circle cx="12" cy="12" r="9" fill="none" stroke={C.muted2} strokeWidth="2.5" />
    <path d="M12 3 a9 9 0 0 1 9 9" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

const Btn = ({ onClick, loading, disabled, children, variant = "primary", style = {} }) => {
  const isPrimary = variant === "primary";
  return (
    <motion.button
      onClick={onClick} disabled={loading || disabled}
      whileHover={!loading && !disabled ? { scale: 1.02 } : {}}
      whileTap={!loading && !disabled ? { scale: .97 } : {}}
      style={{
        padding: "9px 20px", borderRadius: 6, cursor: loading || disabled ? "not-allowed" : "pointer",
        fontFamily: "inherit", fontWeight: 700, fontSize: 11, letterSpacing: "1px", textTransform: "uppercase",
        display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap",
        background: loading || disabled ? C.border2 : isPrimary
          ? `linear-gradient(135deg, ${C.green}, #00c9a0)` : C.panel,
        color: loading || disabled ? C.muted : isPrimary ? "#04080f" : C.text,
        border: isPrimary ? "none" : `1px solid ${C.border2}`,
        boxShadow: !loading && !disabled && isPrimary ? `0 4px 18px ${C.green}30` : "none",
        transition: "background .2s, box-shadow .2s",
        ...style,
      }}
    >
      {loading ? <><Spinner size={13} /><span>Computing…</span></> : children}
    </motion.button>
  );
};

const ErrBox = ({ msg }) => !msg ? null : (
  <div style={{
    background: `${C.red}10`, border: `1px solid ${C.red}30`, borderRadius: 6,
    padding: "10px 14px", color: C.red, fontSize: 12, marginBottom: 12,
    display: "flex", alignItems: "center", gap: 8,
  }}>
    <span style={{ fontSize: 16 }}>⚠</span> {msg}
  </div>
);

// ── SVG SPARKLINE ─────────────────────────────────────────────────────────────
let _sparkId = 0;
const Sparkline = ({ values = [], color = C.green, height = 52, showArea = true }) => {
  const idRef = useRef(`spark_${++_sparkId}`);
  if (!values.length || values.every(v => v === 0)) return <Skel h={height} />;
  const W = 500, H = height, PAD = 4;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const n = values.length;
  const toX = i => PAD + (i / Math.max(n - 1, 1)) * (W - PAD * 2);
  const toY = v => PAD + (1 - (v - min) / range) * (H - PAD * 2);
  const coords = values.map((v, i) => [toX(i), toY(v)]);
  const linePts = coords.map(([x, y]) => `${x},${y}`).join(" ");
  const pathD = `M ${linePts.split(" ").join(" L ")}`;
  const areaD = `${pathD} L ${toX(n - 1)},${H} L ${toX(0)},${H} Z`;
  const gradId = idRef.current;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height, display: "block" }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {showArea && <path d={areaD} fill={`url(#${gradId})`} />}
      <polyline points={linePts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
};

// ── DIV BAR CHART (CSS-based, no SVG quirks) ──────────────────────────────────
const Bars = ({data=[],vkey="value",colorFn=()=>C.green,maxV,maxH=70}) => {
  const max = maxV??Math.max(...data.map(d=>Math.abs(d[vkey]??0)),0.001);
  return (
    <div style={{display:"flex",alignItems:"flex-end",gap:2,height:maxH,width:"100%"}}>
      {data.map((d,i)=>{
        const px = Math.max(2, (Math.abs(d[vkey]??0)/max)*maxH);
        return (
          <motion.div key={i}
            initial={{height:0}} animate={{height:px}}
            transition={{delay:i*0.02,duration:.4,ease:"easeOut"}}
            style={{flex:1,borderRadius:"2px 2px 0 0",background:colorFn(d,i),opacity:.88,minWidth:3}}
            title={`${fmtT(d.timestamp??d.datetime??"")} ${fmt(d[vkey])}`}/>
        );
      })}
    </div>
  );
};
const BarChart = ({ items = [], valueKey, colorFn = () => C.green, labels = [], height = 80 }) => {
  const vals = items.map(d => Math.max(0, Number(d[valueKey]) || 0));
  const max = Math.max(...vals, 0.001);
  const plotH = labels.length ? height - 22 : height;
  return (
    <div style={{ width: "100%", height, display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: plotH }}>
        {vals.map((v, i) => {
          const px = Math.max(2, clamp((v / max) * plotH, 2, plotH));
          return (
            <motion.div
              key={i}
              initial={{ height: 0 }}
              animate={{ height: px }}
              transition={{ duration: 0.45, delay: i * 0.04, ease: "easeOut" }}
              style={{
                flex: 1, borderRadius: "3px 3px 0 0",
                background: colorFn(items[i], i),
                opacity: 0.88, minWidth: 4,
              }}
              title={`${labels[i] || i}: ${fmt(v)}`}
            />
          );
        })}
      </div>
      {labels.length > 0 && (
        <div style={{ display: "flex", gap: 3, height: 20, marginTop: 2 }}>
          {labels.map((l, i) => (
            <div key={i} style={{
              flex: 1, textAlign: "center",
              fontSize: 9, fontFamily: "'IBM Plex Mono',monospace",
              color: C.muted, overflow: "hidden", whiteSpace: "nowrap",
            }}>{l}</div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── STAT CARD ─────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, unit, sub, color = C.text, accentBar, icon, style = {} }) => (
  <Panel style={{ padding: 0, position: "relative", overflow: "hidden", ...style }}>
    {accentBar && (
      <div style={{ height: 2, background: accentBar, borderRadius: "2px 2px 0 0" }} />
    )}
    <div style={{ padding: "14px 16px 12px" }}>
      <p style={{ fontSize: 9, fontFamily: "'IBM Plex Mono',monospace", letterSpacing: ".1em", textTransform: "uppercase", color: C.muted, marginBottom: 8 }}>{label}</p>
      <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 26, fontWeight: 500, color, lineHeight: 1, letterSpacing: "-1px" }}>{value ?? "—"}</p>
      {unit && <p style={{ fontSize: 9, color: C.muted, marginTop: 5, fontFamily: "'IBM Plex Mono',monospace" }}>{unit}</p>}
      {sub && <p style={{ fontSize: 9, color: C.muted, marginTop: 7, paddingTop: 7, borderTop: `1px solid ${C.border}` }}>{sub}</p>}
    </div>
    {icon && <div style={{ position: "absolute", right: 12, bottom: 10, fontSize: 22, opacity: .06 }}>{icon}</div>}
  </Panel>
);

// ── ZONE LSTM TAB ─────────────────────────────────────────────────────────────
const ZoneLSTM = () => {
  const [zone, setZone] = useState("Northern");
  const [hours, setHours] = useState(72);
  const [data, setData] = useState(null);
  const [zones, setZones] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [tradeTab, setTradeTab] = useState("buy");
  const [expandTable, setExpandTable] = useState(false);

  const run = useCallback(async (z = zone, h = hours) => {
    setLoading(true); setErr(null);
    try {
      const r = await fetch(`${ECOGRID_URL}/forecast`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zone_name: z, forecast_hours: h }),
      });
      if (!r.ok) throw new Error((await r.json()).detail || `HTTP ${r.status}`);
      setData(await r.json());
    } catch (e) { setErr(e.message); } finally { setLoading(false); }
  }, [zone, hours]);

  useEffect(() => {
    run("Northern", 72);
    fetch(`${ECOGRID_URL}/zones/summary`).then(r => r.json()).then(d => setZones(d.zones)).catch(() => { });
  }, []);

  const fc = data?.forecast ?? [];
  const avg = arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
  const avgS = avg(fc.map(r => r.total_supply_gw));
  const avgD = avg(fc.map(r => r.demand_gw));
  const avgP = avg(fc.map(r => r.price_inr_kwh));
  const mix = data?.renewable_mix;
  const renPct = mix ? mix.solar + mix.wind + mix.hydro : null;
  const vol = data?.volatility_index ?? 0;
  const ci = data?.carbon_intensity ?? 0;
  const volColor = vol < 5 ? C.green : vol < 12 ? C.yellow : C.red;

  const supplyVals = fc.slice(0, 48).map(r => r.total_supply_gw);
  const demandVals = fc.slice(0, 48).map(r => r.demand_gw);
  const priceVals = fc.slice(0, 48).map(r => r.price_inr_kwh);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "256px 1fr 240px", minHeight: "calc(100vh - 150px)" }}>

      {/* ── LEFT SIDEBAR ── */}
      <div style={{ background: C.bg2, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", gap: 0, overflowY: "auto" }}>

        {/* Zone selector */}
        <div style={{ padding: 14, borderBottom: `1px solid ${C.border}` }}>
          <p style={{ fontSize: 9, fontFamily: "'IBM Plex Mono',monospace", letterSpacing: ".12em", textTransform: "uppercase", color: C.muted, marginBottom: 10 }}>
            India Grid · Select Zone
          </p>
          {ZONES.map(z => {
            const zd = zones?.find(d => d.zone === z);
            const col = ZONE_COLOR[z];
            const active = zone === z;
            return (
              <motion.button key={z} onClick={() => { setZone(z); run(z, hours); }}
                whileHover={{ x: 2 }}
                style={{
                  width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "9px 11px", marginBottom: 5, border: `1px solid ${active ? col + "50" : C.border}`,
                  borderRadius: 6, background: active ? `${col}0d` : "transparent",
                  cursor: "pointer", transition: "all .15s",
                }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <Dot color={col} size={6} pulse={active} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: active ? col : C.text }}>{z}</span>
                </div>
                {zd && !zd.error && (
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 11, fontFamily: "'IBM Plex Mono',monospace", color: C.yellow }}>₹{fmt(zd.price, 2)}</div>
                    <div style={{
                      fontSize: 8, padding: "1px 5px", borderRadius: 2, textTransform: "uppercase",
                      background: zd.status === "surplus" ? `${C.green}18` : `${C.red}18`,
                      color: zd.status === "surplus" ? C.green : C.red
                    }}>{zd.status}</div>
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Hours */}
        <div style={{ padding: 14, borderBottom: `1px solid ${C.border}` }}>
          <p style={{ fontSize: 9, fontFamily: "'IBM Plex Mono',monospace", letterSpacing: ".12em", textTransform: "uppercase", color: C.muted, marginBottom: 8 }}>Forecast Window</p>
          <div style={{ display: "flex", gap: 5, marginBottom: 10 }}>
            {[24, 48, 72].map(h => (
              <button key={h} onClick={() => { setHours(h); run(zone, h); }}
                style={{
                  flex: 1, padding: "6px 0", border: `1px solid ${hours === h ? C.green + "60" : C.border}`,
                  background: hours === h ? `${C.green}14` : "transparent", color: hours === h ? C.green : C.muted,
                  borderRadius: 4, fontSize: 10, cursor: "pointer", fontFamily: "'IBM Plex Mono',monospace", fontWeight: 500,
                }}>{h}H</button>
            ))}
          </div>
          <Btn onClick={() => run(zone, hours)} loading={loading} style={{ width: "100%", justifyContent: "center" }}>
            ▶ Run Forecast
          </Btn>
        </div>

        {/* Alerts */}
        <div style={{ padding: 14, borderBottom: `1px solid ${C.border}`, flex: 1, overflowY: "auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <p style={{ fontSize: 9, fontFamily: "'IBM Plex Mono',monospace", letterSpacing: ".12em", textTransform: "uppercase", color: C.muted }}>Peak Alerts</p>
            {data?.alerts?.length > 0 && <Chip color={C.red}>{data.alerts.length}</Chip>}
          </div>
          {loading ? <><Skel h={52} /><div style={{ height: 6 }} /><Skel h={52} /></> :
            (data?.alerts ?? []).length === 0
              ? <p style={{ fontSize: 11, color: C.muted }}>No active alerts.</p>
              : (data.alerts).map((a, i) => {
                const sc = { high: C.red, medium: C.yellow, low: C.green }[a.severity] ?? C.green;
                return (
                  <div key={i} style={{
                    padding: "9px 11px", borderRadius: 5, borderLeft: `2px solid ${sc}`,
                    background: `${sc}0d`, marginBottom: 7,
                  }}>
                    <p style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: ".08em", color: sc, marginBottom: 3 }}>
                      {(a.type || "").replace(/_/g, " ")} · {a.severity}
                    </p>
                    <p style={{ fontSize: 11, color: C.text, lineHeight: 1.45 }}>{a.message}</p>
                    <p style={{ fontSize: 9, color: C.muted, marginTop: 3 }}>{a.time}</p>
                  </div>
                );
              })
          }
        </div>

        {/* Model Accuracy */}
        <div style={{ padding: 14 }}>
          <p style={{ fontSize: 9, fontFamily: "'IBM Plex Mono',monospace", letterSpacing: ".12em", textTransform: "uppercase", color: C.muted, marginBottom: 10 }}>Model Metrics</p>
          {!data?.model_metrics ? <><Skel h={36} /><div style={{ height: 5 }} /><Skel h={36} /></> :
            Object.entries(data.model_metrics).map(([k, v]) => (
              <div key={k} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "7px 10px", background: C.bg3, border: `1px solid ${C.border}`,
                borderRadius: 4, marginBottom: 5,
              }}>
                <span style={{ fontSize: 9, color: C.muted, textTransform: "capitalize" }}>{k.replace(/_/g, " ")}</span>
                <div style={{ display: "flex", gap: 8 }}>
                  {["MAE", "RMSE", "MAPE"].filter(m => v[m] != null).map(m => (
                    <div key={m} style={{ textAlign: "center" }}>
                      <span style={{ fontSize: 7, color: C.muted2, display: "block", textTransform: "uppercase", letterSpacing: ".08em" }}>{m}</span>
                      <span style={{ fontSize: 11, fontFamily: "'IBM Plex Mono',monospace", color: C.green }}>{fmt(v[m], 2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          }
        </div>
      </div>

      {/* ── CENTER ── */}
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14, overflowY: "auto" }}>
        <ErrBox msg={err} />

        {/* KPI row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10 }}>
          <StatCard label="Avg Supply" value={avgS !== null ? fmt(avgS, 1) : null} unit="GW" color={C.green} accentBar={C.green} icon="⚡" />
          <StatCard label="Avg Demand" value={avgD !== null ? fmt(avgD, 1) : null} unit="GW" color={C.red} accentBar={C.red} icon="📈" />
          <StatCard label="Avg Price" value={avgP !== null ? fmt(avgP, 2) : null} unit="₹/kWh" color={C.yellow} accentBar={C.yellow} icon="💰" />
          <StatCard label="Volatility" value={data ? fmt(vol, 1) : null} unit="Index" color={volColor} accentBar={volColor} />
          <StatCard label="Carbon" value={data ? fmt(ci, 0) : null} unit="gCO₂/kWh" color={C.purple} accentBar={C.purple} icon="🌿" />
          <StatCard label="Renewables" value={renPct !== null ? fmt(renPct, 1) : null} unit="% Share" color={C.blue} accentBar={C.blue} icon="🌊" />
        </div>

        {/* Supply vs Demand sparklines */}
        <Panel>
          <PanelHead title="Supply vs Demand — 48h"
            right={<><span style={{ fontSize: 9, color: C.green, fontFamily: "'IBM Plex Mono',monospace" }}>━ Supply</span><span style={{ fontSize: 9, color: C.red, fontFamily: "'IBM Plex Mono',monospace" }}>━ Demand</span></>}
          />
          <div style={{ padding: "14px 16px 10px" }}>
            {loading ? <Skel h={60} /> : (
              <div style={{ position: "relative" }}>
                <Sparkline values={supplyVals} color={C.green} height={60} />
                <div style={{ marginTop: 4 }}>
                  <Sparkline values={demandVals} color={C.red} height={60} />
                </div>
              </div>
            )}
          </div>
        </Panel>

        {/* Price chart */}
        <Panel>
          <PanelHead title="Price Forecast — ₹/kWh" right={<Chip color={C.yellow}>48h window</Chip>} />
          <div style={{ padding: "14px 16px 10px" }}>
            {loading ? <Skel h={52} /> : <Sparkline values={priceVals} color={C.yellow} height={52} />}
          </div>
        </Panel>

        {/* Generation breakdown */}
        <Panel>
          <PanelHead title="Generation Breakdown"
            right={
              <div style={{ display: "flex", gap: 8 }}>
                {[["Solar", C.solar], ["Wind", C.wind], ["Hydro", C.hydro], ["Thermal", C.thermal]].map(([l, c]) => (
                  <span key={l} style={{ fontSize: 9, color: c, fontFamily: "'IBM Plex Mono',monospace" }}>● {l}</span>
                ))}
              </div>
            }
          />
          <div style={{ padding: "14px 16px" }}>
            {loading ? <><Skel h={36} /><div style={{ height: 8 }} /><Skel h={36} /><div style={{ height: 8 }} /><Skel h={36} /></> : (() => {
              const genKeys = [["solar_gw", "Solar", C.solar], ["wind_gw", "Wind", C.wind], ["hydro_gw", "Hydro", C.hydro], ["thermal_gw", "Thermal", C.thermal]];
              const avgs = genKeys.map(([k]) => avg(fc.slice(0, 48).map(r => r[k] || 0)) ?? 0);
              const maxGen = Math.max(...avgs, 0.001);
              return genKeys.map(([k, lab, col], gi) => (
                <div key={k} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 9, fontFamily: "'IBM Plex Mono',monospace", color: col, textTransform: "uppercase", letterSpacing: ".08em" }}>{lab}</span>
                    <span style={{ fontSize: 11, fontFamily: "'IBM Plex Mono',monospace", color: col }}>{fmt(avgs[gi], 2)} GW avg</span>
                  </div>
                  <div style={{ height: 5, background: C.border, borderRadius: 3, overflow: "hidden" }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${clamp((avgs[gi] / maxGen) * 100, 1, 100)}%` }}
                      transition={{ duration: 0.7, delay: gi * 0.1, ease: "easeOut" }}
                      style={{ height: "100%", background: col, borderRadius: 3 }}
                    />
                  </div>
                </div>
              ));
            })()}
          </div>
        </Panel>

        {/* Hourly table */}
        <Panel>
          <PanelHead title={`Hourly Table — ${fc.length} rows`}
            right={
              <button onClick={() => setExpandTable(t => !t)}
                style={{ fontSize: 9, color: C.muted, background: "transparent", border: `1px solid ${C.border}`, borderRadius: 3, padding: "2px 8px", cursor: "pointer" }}>
                {expandTable ? "▲ Collapse" : "▼ Expand"}
              </button>
            }
          />
          <AnimatePresence>
            {expandTable && (
              <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} style={{ overflow: "hidden" }}>
                <div style={{ maxHeight: 280, overflowY: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                    <thead>
                      <tr style={{ background: C.bg2, position: "sticky", top: 0 }}>
                        {["Time", "Supply", "Demand", "Price ₹", "±", "Solar", "Wind"].map((h, i) => (
                          <th key={h} style={{ padding: "6px 10px", fontSize: 8, color: C.muted, textTransform: "uppercase", letterSpacing: ".1em", borderBottom: `1px solid ${C.border}`, textAlign: i === 0 ? "left" : "right" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {fc.slice(0, 48).map((r, i) => (
                        <tr key={i} style={{ borderBottom: `1px solid ${C.border}20`, background: i % 2 ? `${C.bg}60` : "transparent" }}>
                          <td style={{ padding: "5px 10px", color: C.muted, fontFamily: "'IBM Plex Mono',monospace", fontSize: 10 }}>{fmtT(r.timestamp)}</td>
                          <td style={{ padding: "5px 10px", color: C.green, textAlign: "right", fontFamily: "'IBM Plex Mono',monospace" }}>{fmt(r.total_supply_gw)}</td>
                          <td style={{ padding: "5px 10px", color: C.red, textAlign: "right", fontFamily: "'IBM Plex Mono',monospace" }}>{fmt(r.demand_gw)}</td>
                          <td style={{ padding: "5px 10px", color: C.yellow, textAlign: "right", fontFamily: "'IBM Plex Mono',monospace" }}>₹{fmt(r.price_inr_kwh, 3)}</td>
                          <td style={{ padding: "5px 10px", textAlign: "right", fontFamily: "'IBM Plex Mono',monospace", color: r.surplus_deficit >= 0 ? C.green : C.red, fontWeight: 500 }}>
                            {r.surplus_deficit >= 0 ? "+" : ""}{fmt(r.surplus_deficit)}
                          </td>
                          <td style={{ padding: "5px 10px", color: C.solar, textAlign: "right", fontFamily: "'IBM Plex Mono',monospace" }}>{fmt(r.solar_gw)}</td>
                          <td style={{ padding: "5px 10px", color: C.wind, textAlign: "right", fontFamily: "'IBM Plex Mono',monospace" }}>{fmt(r.wind_gw)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {!expandTable && <div style={{ padding: "10px 16px" }}><p style={{ fontSize: 11, color: C.muted }}>{fc.length} rows — click Expand to view</p></div>}
        </Panel>

        {/* Zone Comparison */}
        {zones && (
          <Panel>
            <PanelHead title="Zone Comparison — Arbitrage View" right={<Chip color={C.purple}>Live</Chip>} />
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: C.bg2 }}>
                    {["Zone", "Price ₹", "Demand GW", "Supply GW", "Balance", "Status"].map((h, i) => (
                      <th key={h} style={{ padding: "7px 12px", fontSize: 8, color: C.muted, textTransform: "uppercase", letterSpacing: ".1em", borderBottom: `1px solid ${C.border}`, textAlign: i === 0 ? "left" : "right" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {zones.filter(z => !z.error).map((z) => (
                    <tr key={z.zone} style={{
                      borderBottom: `1px solid ${C.border}20`,
                      background: z.zone === zone ? `${ZONE_COLOR[z.zone] ?? C.green}08` : "transparent",
                    }}>
                      <td style={{ padding: "9px 12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                          <Dot color={ZONE_COLOR[z.zone] ?? C.green} size={5} />
                          <span style={{ fontSize: 12, fontWeight: 600, color: ZONE_COLOR[z.zone] ?? C.text }}>{z.zone}</span>
                        </div>
                      </td>
                      <td style={{ padding: "9px 12px", textAlign: "right", fontFamily: "'IBM Plex Mono',monospace", color: C.yellow }}>₹{fmt(z.price, 2)}</td>
                      <td style={{ padding: "9px 12px", textAlign: "right", fontFamily: "'IBM Plex Mono',monospace", color: C.red }}>{fmt(z.demand_gw)}</td>
                      <td style={{ padding: "9px 12px", textAlign: "right", fontFamily: "'IBM Plex Mono',monospace", color: C.green }}>{fmt(z.supply_gw)}</td>
                      <td style={{ padding: "9px 12px", textAlign: "right", fontFamily: "'IBM Plex Mono',monospace", fontWeight: 500, color: z.surplus_deficit >= 0 ? C.green : C.red }}>
                        {z.surplus_deficit >= 0 ? "+" : ""}{fmt(z.surplus_deficit)}
                      </td>
                      <td style={{ padding: "9px 12px", textAlign: "right" }}>
                        <Chip color={z.status === "surplus" ? C.green : C.red}>{z.status}</Chip>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        )}
      </div>

      {/* ── RIGHT SIDEBAR ── */}
      <div style={{ background: C.bg2, borderLeft: `1px solid ${C.border}`, display: "flex", flexDirection: "column", gap: 0, overflowY: "auto" }}>

        {/* Weather */}
        <div style={{ padding: 14, borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <p style={{ fontSize: 9, fontFamily: "'IBM Plex Mono',monospace", letterSpacing: ".12em", textTransform: "uppercase", color: C.muted }}>Weather Now</p>
            <Chip color={C.blue}>{zone}</Chip>
          </div>
          {loading || !data?.weather_now
            ? <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>{[...Array(6)].map((_, i) => <Skel key={i} h={48} />)}</div>
            : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                {[["🌡 Temp", `${fmt(data.weather_now.temperature, 1)}°C`],
                ["💨 Wind", `${fmt(data.weather_now.windspeed, 1)} m/s`],
                ["☁ Clouds", `${fmt(data.weather_now.cloudcover, 0)}%`],
                ["☀ Irrad.", `${fmt(data.weather_now.irradiance, 0)} W/m²`],
                ["💧 Humid.", `${fmt(data.weather_now.humidity, 0)}%`],
                ["🌧 Precip.", `${fmt(data.weather_now.precipitation, 2)} mm`],
                ].map(([l, v]) => (
                  <div key={l} style={{ padding: "8px 10px", background: C.bg3, border: `1px solid ${C.border}`, borderRadius: 4 }}>
                    <p style={{ fontSize: 9, color: C.muted, marginBottom: 3 }}>{l}</p>
                    <p style={{ fontSize: 13, fontWeight: 500, fontFamily: "'IBM Plex Mono',monospace" }}>{v}</p>
                  </div>
                ))}
              </div>
            )
          }
        </div>

        {/* Renewable mix */}
        <div style={{ padding: 14, borderBottom: `1px solid ${C.border}` }}>
          <p style={{ fontSize: 9, fontFamily: "'IBM Plex Mono',monospace", letterSpacing: ".12em", textTransform: "uppercase", color: C.muted, marginBottom: 10 }}>Renewable Mix</p>
          {!mix ? <Skel h={90} /> : (() => {
            const items = [["solar", "Solar", C.solar], ["wind", "Wind", C.wind], ["hydro", "Hydro", C.hydro], ["thermal", "Thermal", C.thermal]];
            return (
              <>
                <div style={{ display: "flex", height: 6, borderRadius: 3, overflow: "hidden", gap: 1, marginBottom: 12 }}>
                  {items.map(([k, , c]) => (
                    <motion.div key={k} initial={{ width: 0 }} animate={{ width: `${mix[k] ?? 0}%` }} transition={{ duration: .8 }}
                      style={{ background: c, minWidth: (mix[k] ?? 0) > 0 ? 2 : 0 }} />
                  ))}
                </div>
                {items.map(([k, l, c]) => (
                  <div key={k} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: c, flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: C.muted, flex: 1 }}>{l}</span>
                    <div style={{ width: 60, height: 3, background: C.border, borderRadius: 2, overflow: "hidden" }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${mix[k] ?? 0}%` }} transition={{ duration: .8 }}
                        style={{ height: "100%", background: c }} />
                    </div>
                    <span style={{ fontSize: 11, fontFamily: "'IBM Plex Mono',monospace", color: c, width: 30, textAlign: "right" }}>{fmt(mix[k], 0)}%</span>
                  </div>
                ))}
              </>
            );
          })()}
        </div>

        {/* Volatility */}
        <div style={{ padding: 14, borderBottom: `1px solid ${C.border}` }}>
          <p style={{ fontSize: 9, fontFamily: "'IBM Plex Mono',monospace", letterSpacing: ".12em", textTransform: "uppercase", color: C.muted, marginBottom: 10 }}>Volatility Index</p>
          <div style={{ textAlign: "center", padding: "8px 0" }}>
            <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 40, fontWeight: 500, color: volColor, lineHeight: 1 }}>{fmt(vol, 1)}</div>
            <p style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: ".1em", margin: "8px 0 10px" }}>
              {vol < 5 ? "Low" : vol < 12 ? "Moderate" : "High Volatility"}
            </p>
            <div style={{ height: 4, background: C.border, borderRadius: 2, overflow: "hidden" }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${clamp(vol * 5, 0, 100)}%` }} transition={{ duration: 1 }}
                style={{ height: "100%", background: `linear-gradient(90deg, ${C.green}, ${C.yellow}, ${C.red})` }} />
            </div>
          </div>
        </div>

        {/* Carbon */}
        <div style={{ padding: 14, borderBottom: `1px solid ${C.border}` }}>
          <p style={{ fontSize: 9, fontFamily: "'IBM Plex Mono',monospace", letterSpacing: ".12em", textTransform: "uppercase", color: C.muted, marginBottom: 8 }}>Carbon Intensity</p>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 30, fontWeight: 500, color: ci < 200 ? C.green : ci < 500 ? C.yellow : C.red, lineHeight: 1 }}>{fmt(ci, 0)}</div>
            <div>
              <p style={{ fontSize: 10, color: C.muted }}>{ci < 200 ? "🌿 Clean grid" : ci < 500 ? "⚠ Moderate" : "🔴 High emissions"}</p>
              <p style={{ fontSize: 9, color: C.muted2, marginTop: 4, fontFamily: "'IBM Plex Mono',monospace" }}>gCO₂/kWh · Ren: {renPct !== null ? fmt(renPct, 1) : "—"}%</p>
            </div>
          </div>
        </div>

        {/* Trade signals */}
        <div style={{ padding: 14 }}>
          <p style={{ fontSize: 9, fontFamily: "'IBM Plex Mono',monospace", letterSpacing: ".12em", textTransform: "uppercase", color: C.muted, marginBottom: 10 }}>Trade Signals</p>
          <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
            {["buy", "sell"].map(t => (
              <button key={t} onClick={() => setTradeTab(t)}
                style={{
                  flex: 1, padding: "5px 0", border: `1px solid ${tradeTab === t ? (t === "buy" ? C.green : C.red) + "50" : C.border}`,
                  background: tradeTab === t ? `${t === "buy" ? C.green : C.red}12` : "transparent",
                  color: tradeTab === t ? (t === "buy" ? C.green : C.red) : C.muted,
                  borderRadius: 4, fontSize: 10, cursor: "pointer", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em",
                }}>{t}
              </button>
            ))}
          </div>
          {loading ? <Skel h={90} /> :
            ((tradeTab === "buy" ? data?.buy_windows : data?.sell_windows) ?? []).slice(0, 8).map((w, i) => {
              const col = tradeTab === "buy" ? C.green : C.red;
              return (
                <div key={i} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "7px 10px", borderRadius: 4, marginBottom: 4,
                  background: `${col}08`, border: `1px solid ${col}20`,
                }}>
                  <div>
                    <p style={{ fontSize: 9, color: col, textTransform: "uppercase", letterSpacing: ".08em" }}>{tradeTab}</p>
                    <p style={{ fontSize: 10, color: C.muted, fontFamily: "'IBM Plex Mono',monospace" }}>{fmtT(w.time)}</p>
                  </div>
                  <p style={{ fontSize: 14, fontFamily: "'IBM Plex Mono',monospace", fontWeight: 500, color: col }}>₹{fmt(w.price, 3)}</p>
                </div>
              );
            })
          }
        </div>
      </div>
    </div>
  );
};

// ── CITY CLIMATE TAB ──────────────────────────────────────────────────────────
const CityLSTM = () => {
  const [city, setCity] = useState("Mumbai");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [showHourly, setShowHourly] = useState(false);
  const [locLoading, setLocLoading] = useState(false);

  const run = async (c, lat = null, lon = null) => {
    setLoading(true); setErr(null);
    try {
      const payload = { city: c };
      if (lat !== null) { payload.lat = lat; payload.lon = lon; }
      const r = await fetch(`${LSTM_CITY_URL}/predict`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!r.ok) throw new Error((await r.json()).error || `HTTP ${r.status}`);
      setData(await r.json());
    } catch (e) { setErr(e.message); } finally { setLoading(false); }
  };

  const detectLoc = () => {
    if (!navigator.geolocation) { setErr("Geolocation not supported"); return; }
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude: lat, longitude: lon } }) => { setCity("My Location"); run("My Location", lat, lon); setLocLoading(false); },
      () => { setErr("Location denied"); setLocLoading(false); }
    );
  };

  const daily = data?.daily ?? [];
  const hourly = data?.hourly ?? [];
  const cur = hourly[0];
  const maxDemand = Math.max(...daily.map(d => d.demand), 1);
  const maxProd = Math.max(...daily.map(d => d.produced), 1);
  const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div style={{ maxWidth: 1120, margin: "0 auto", padding: "20px 20px 40px" }}>

      {/* Search bar */}
      <div style={{
        display: "flex", gap: 8, marginBottom: 16,
        background: C.panel, border: `1px solid ${C.border}`, borderRadius: 8, padding: 10,
        alignItems: "center",
      }}>
        <span style={{ fontSize: 15, flexShrink: 0 }}>🔍</span>
        <input value={city} onChange={e => setCity(e.target.value)} onKeyDown={e => e.key === "Enter" && run(city)}
          list="city-list" placeholder="Enter any city (e.g. Mumbai, London, Tokyo)…"
          style={{
            flex: 1, background: "transparent", border: "none", color: C.text, fontSize: 14, fontWeight: 500,
            outline: "none", fontFamily: "inherit",
          }}
        />
        <datalist id="city-list">{CITIES.map(c => <option key={c} value={c} />)}</datalist>
        <button onClick={detectLoc} disabled={locLoading}
          style={{
            padding: "7px 11px", background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 5,
            color: C.muted, cursor: "pointer", fontSize: 14, transition: "border-color .2s",
          }}
          onMouseEnter={e => e.target.style.borderColor = C.blue}
          onMouseLeave={e => e.target.style.borderColor = C.border}
        >{locLoading ? "…" : "📍"}</button>
        <Btn onClick={() => run(city)} loading={loading}>▶ Predict</Btn>
      </div>

      <ErrBox msg={err} />

      {data?.city && (
        <p style={{ fontSize: 10, color: C.muted, fontFamily: "'IBM Plex Mono',monospace", marginBottom: 14 }}>
          📌 {data.city} &nbsp;·&nbsp; {daily.length} days &nbsp;·&nbsp; {hourly.length} hourly points
        </p>
      )}

      {/* KPI row */}
      {cur && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 14 }}>
          <StatCard label="Producing Now" value={fmt(cur.produced, 2)} unit="kWh avg" color={C.green} accentBar={C.green} icon="⚡" sub={`${tempIcon(cur.temp ?? 20)} ${fmt(cur.temp ?? 0, 1)}°C`} />
          <StatCard label="Demand Now" value={fmt(cur.demand, 2)} unit="kWh avg" color={C.red} accentBar={C.red} icon="📈" sub={`💧 Humidity ${cur.humidity}%`} />
          <StatCard label="Net Surplus" value={(Number(cur.surplus) >= 0 ? "+" : "") + fmt(cur.surplus, 2)} unit="kWh" color={Number(cur.surplus) >= 0 ? C.green : C.red} accentBar={Number(cur.surplus) >= 0 ? C.green : C.red} sub={Number(cur.surplus) >= 0 ? "✅ Excess production" : "⚠ Deficit"} />
          <StatCard label="Current Price" value={`$${fmt(cur.price, 4)}`} unit="per kWh" color={C.blue} accentBar={C.blue} sub="Dynamic pricing active" />
        </div>
      )}

      {/* Weather strip */}
      {daily.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8, marginBottom: 14 }}>
          {daily.slice(0, 7).map((d, i) => {
            const day = new Date(d.date + "T12:00:00");
            return (
              <div key={i} style={{
                background: C.panel, border: `1px solid ${i === 0 ? C.green + "40" : C.border}`,
                borderRadius: 7, padding: "12px 8px", textAlign: "center",
                transition: "border-color .2s",
              }}>
                <p style={{ fontSize: 8, fontFamily: "'IBM Plex Mono',monospace", color: C.muted, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 6 }}>
                  {i === 0 ? "TODAY" : DAYS[day.getDay()]}
                </p>
                <div style={{ fontSize: 18, marginBottom: 5 }}>{tempIcon(d.temp)}</div>
                <p style={{ fontSize: 13, fontFamily: "'IBM Plex Mono',monospace", fontWeight: 500 }}>{fmt(d.temp, 1)}°</p>
                <p style={{ fontSize: 8, color: C.muted, marginTop: 3 }}>💧{fmt(d.humidity, 0)}%</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Charts row */}
      {!loading && data && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          {[["7-Day Production", C.green, "produced"], ["7-Day Demand", C.red, "demand"]].map(([title, color, key]) => (
            <Panel key={title}>
              <PanelHead title={title} right={<Chip color={color}>kWh</Chip>} />
              <div style={{ padding: "14px 14px 6px" }}>
                <BarChart
                  items={daily.slice(0, 7)}
                  valueKey={key}
                  colorFn={() => color}
                  labels={daily.slice(0, 7).map(d => DAYS[new Date(d.date + "T12:00:00").getDay()])}
                  height={90}
                />
              </div>
            </Panel>
          ))}
        </div>
      )}

      {/* Price sparkline */}
      {hourly.length > 1 && (
        <Panel style={{ marginBottom: 14 }}>
          <PanelHead title={`Hourly Price Curve — ${hourly.length} points`} right={<Chip color={C.blue}>$/kWh</Chip>} />
          <div style={{ padding: "10px 14px 6px" }}>
            <Sparkline values={hourly.map(h => h.price)} color={C.blue} height={64} />
          </div>
        </Panel>
      )}

      {/* Daily table */}
      {daily.length > 0 && (
        <Panel style={{ marginBottom: 14 }}>
          <PanelHead title="Daily Forecast" right={<span style={{ fontSize: 10, color: C.muted }}>{daily.length} days · avg/day</span>} />
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: C.bg2 }}>
                  {["Date", "Demand", "Produced", "Surplus", "Price", "Temp", "Humidity"].map((h, i) => (
                    <th key={h} style={{ padding: "8px 14px", fontSize: 8, color: C.muted, textTransform: "uppercase", letterSpacing: ".1em", borderBottom: `1px solid ${C.border}`, textAlign: i === 0 ? "left" : "right" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {daily.map((d, i) => {
                  const pos = Number(d.surplus) >= 0;
                  return (
                    <tr key={i} style={{ borderBottom: `1px solid ${C.border}18`, background: i % 2 ? `${C.bg}80` : "transparent" }}>
                      <td style={{ padding: "10px 14px", fontWeight: 600, fontSize: 12 }}>{fmtDate(d.date)}</td>
                      <td style={{ padding: "10px 14px", textAlign: "right" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 7 }}>
                          <div style={{ width: clamp((d.demand / maxDemand) * 52, 3, 52), height: 3, background: C.red, opacity: .6, borderRadius: 2 }} />
                          <span style={{ fontFamily: "'IBM Plex Mono',monospace", color: C.red, fontSize: 11 }}>{fmt(d.demand)} <span style={{ color: C.muted, fontSize: 9 }}>kWh</span></span>
                        </div>
                      </td>
                      <td style={{ padding: "10px 14px", textAlign: "right" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 7 }}>
                          <div style={{ width: clamp((d.produced / maxProd) * 52, 3, 52), height: 3, background: C.green, opacity: .6, borderRadius: 2 }} />
                          <span style={{ fontFamily: "'IBM Plex Mono',monospace", color: C.green, fontSize: 11 }}>{fmt(d.produced)} <span style={{ color: C.muted, fontSize: 9 }}>kWh</span></span>
                        </div>
                      </td>
                      <td style={{ padding: "10px 14px", textAlign: "right", fontFamily: "'IBM Plex Mono',monospace", color: pos ? C.green : C.red, fontSize: 11 }}>
                        {pos ? "+" : ""}{fmt(d.surplus)} <span style={{ color: C.muted, fontSize: 9 }}>kWh</span>
                      </td>
                      <td style={{ padding: "10px 14px", textAlign: "right", fontFamily: "'IBM Plex Mono',monospace", color: C.blue, fontSize: 11 }}>${fmt(d.price, 4)}</td>
                      <td style={{ padding: "10px 14px", textAlign: "right", fontFamily: "'IBM Plex Mono',monospace", color: C.muted, fontSize: 11 }}>{fmt(d.temp, 1)}°C</td>
                      <td style={{ padding: "10px 14px", textAlign: "right", fontFamily: "'IBM Plex Mono',monospace", color: C.muted, fontSize: 11 }}>{fmt(d.humidity, 0)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {/* Hourly accordion */}
      {hourly.length > 0 && (
        <Panel>
          <button onClick={() => setShowHourly(h => !h)}
            style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", background: "transparent", border: "none", color: C.text, cursor: "pointer", padding: "12px 16px", fontSize: 12, fontWeight: 700 }}>
            <span>⏱ Hourly Breakdown <span style={{ color: C.muted, fontWeight: 400 }}>({hourly.length} rows)</span></span>
            <span style={{ color: C.muted, fontSize: 10 }}>{showHourly ? "▲" : "▼"}</span>
          </button>
          <AnimatePresence>
            {showHourly && (
              <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} style={{ overflow: "hidden" }}>
                <div style={{ maxHeight: 280, overflowY: "auto", borderTop: `1px solid ${C.border}` }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: C.bg2, position: "sticky", top: 0 }}>
                        {["Time", "Demand", "Produced", "Price", "Humidity"].map((h, i) => (
                          <th key={h} style={{ padding: "6px 12px", fontSize: 8, color: C.muted, textTransform: "uppercase", letterSpacing: ".1em", borderBottom: `1px solid ${C.border}`, textAlign: i === 0 ? "left" : "right" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {hourly.map((h, i) => (
                        <tr key={i} style={{ background: i % 2 ? `${C.bg}80` : "transparent", borderBottom: `1px solid ${C.border}15` }}>
                          <td style={{ padding: "5px 12px", color: C.muted, fontFamily: "'IBM Plex Mono',monospace", fontSize: 10 }}>{h.date} {String(h.hour).padStart(2, "0")}:00</td>
                          <td style={{ padding: "5px 12px", textAlign: "right", fontFamily: "'IBM Plex Mono',monospace", fontSize: 10 }}>{fmt(h.demand, 1)}</td>
                          <td style={{ padding: "5px 12px", textAlign: "right", fontFamily: "'IBM Plex Mono',monospace", color: C.green, fontSize: 10 }}>{fmt(h.produced, 1)}</td>
                          <td style={{ padding: "5px 12px", textAlign: "right", fontFamily: "'IBM Plex Mono',monospace", color: C.blue, fontSize: 10 }}>${fmt(h.price, 4)}</td>
                          <td style={{ padding: "5px 12px", textAlign: "right", fontFamily: "'IBM Plex Mono',monospace", color: C.muted, fontSize: 10 }}>{h.humidity}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Panel>
      )}
    </div>
  );
};

// ── XGBOOST TAB ───────────────────────────────────────────────────────────────
const XGBoostDemand = () => {
  const [days, setDays] = useState(7);
  const [startDate, setStart] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [showRows, setShowRows] = useState(false);

  const run = async () => {
    setLoading(true); setErr(null);
    try {
      const r = await fetch(`${XGBOOST_URL}/api/forecast`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days, startDate: startDate || null }),
      });
      const json = await r.json();
      if (!json.success) throw new Error(json.error || "Forecast failed");
      setData(json.forecast);
    } catch (e) { setErr(e.message); } finally { setLoading(false); }
  };

  const fc = data?.forecast ?? [];
  const peaks = data?.peak_demand ?? [];
  const avg = arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
  const maxMW = fc.length ? Math.max(...fc.map(r => r.prediction)) : 1;
  const avgMW = avg(fc.map(r => r.prediction));
  const peakMW = fc.length ? Math.max(...fc.map(r => r.prediction)) : null;
  const minMW = fc.length ? Math.min(...fc.map(r => r.prediction)) : null;

  const byDay = {};
  fc.forEach(r => { const d = r.datetime.slice(0, 10); byDay[d] = (byDay[d] ?? []).concat(r.prediction); });
  const dayBars = Object.entries(byDay).map(([d, vs]) => ({ date: d, value: vs.reduce((a, b) => a + b, 0) / vs.length }));
  const DAYS7 = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div style={{ maxWidth: 1120, margin: "0 auto", padding: "20px 20px 40px" }}>

      {/* Controls */}
      <Panel style={{ marginBottom: 16 }}>
        <div style={{ padding: "14px 16px", display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div>
            <p style={{ fontSize: 8, fontFamily: "'IBM Plex Mono',monospace", letterSpacing: ".1em", textTransform: "uppercase", color: C.muted, marginBottom: 6 }}>Forecast Horizon</p>
            <div style={{ display: "flex", gap: 5 }}>
              {[3, 7, 14, 30].map(d => (
                <button key={d} onClick={() => setDays(d)}
                  style={{
                    padding: "6px 14px", border: `1px solid ${days === d ? C.yellow + "60" : C.border}`,
                    background: days === d ? `${C.yellow}12` : "transparent",
                    color: days === d ? C.yellow : C.muted,
                    borderRadius: 4, fontSize: 10, cursor: "pointer", fontFamily: "'IBM Plex Mono',monospace",
                  }}>{d}d</button>
              ))}
            </div>
          </div>
          <div>
            <p style={{ fontSize: 8, fontFamily: "'IBM Plex Mono',monospace", letterSpacing: ".1em", textTransform: "uppercase", color: C.muted, marginBottom: 6 }}>Start Date (optional)</p>
            <input type="date" value={startDate} onChange={e => setStart(e.target.value)}
              style={{ padding: "7px 12px", background: C.bg2, border: `1px solid ${C.border2}`, borderRadius: 5, color: C.text, fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, outline: "none" }} />
          </div>
          <Btn onClick={run} loading={loading}>▶ Generate Forecast</Btn>
        </div>
      </Panel>

      <ErrBox msg={err} />

      {/* KPIs */}
      {data && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 14 }}>
          <StatCard label="Avg Demand" value={avgMW !== null ? fmt(avgMW, 1) : null} unit="MW" color={C.yellow} accentBar={C.yellow} icon="⚡" />
          <StatCard label="Peak Demand" value={peakMW !== null ? fmt(peakMW, 1) : null} unit="MW" color={C.red} accentBar={C.red} icon="🔺" />
          <StatCard label="Min Demand" value={minMW !== null ? fmt(minMW, 1) : null} unit="MW" color={C.green} accentBar={C.green} icon="🔻" />
          <StatCard label="Hours Forecast" value={fc.length} unit={`across ${days} days`} color={C.blue} accentBar={C.blue} />
        </div>
      )}

      {/* Backend plot */}
      {data?.plot && (
        <Panel style={{ marginBottom: 14 }}>
          <PanelHead title="XGBoost — Demand Forecast Plot" right={<Chip color={C.yellow}>XGBoost</Chip>} />
          <div style={{ padding: 14 }}>
            <img src={`data:image/png;base64,${data.plot}`} alt="Demand Forecast"
              style={{ width: "100%", borderRadius: 5, filter: "invert(1) hue-rotate(180deg) brightness(.95)" }} />
          </div>
        </Panel>
      )}

      {/* Daily bar chart */}
      {dayBars.length > 0 && (
        <Panel style={{ marginBottom: 14 }}>
          <PanelHead title="Daily Average Demand" right={<Chip color={C.yellow}>MW · avg/day</Chip>} />
          <div style={{ padding: "14px 14px 6px" }}>
            <BarChart
              items={dayBars}
              valueKey="value"
              colorFn={(_, i) => `hsl(${40 + i * 9}, 88%, 58%)`}
              labels={dayBars.map(d => DAYS7[new Date(d.date + "T12:00:00").getDay()])}
              height={100}
            />
          </div>
        </Panel>
      )}

      {/* Demand sparkline (all hours) */}
      {fc.length > 1 && (
        <Panel style={{ marginBottom: 14 }}>
          <PanelHead title={`Hourly Demand Curve — ${fc.length} points`} right={<Chip color={C.yellow}>MW</Chip>} />
          <div style={{ padding: "10px 14px 8px" }}>
            <Sparkline values={fc.map(r => r.prediction)} color={C.yellow} height={72} />
          </div>
        </Panel>
      )}

      {/* Peak alerts */}
      {peaks.length > 0 && (
        <Panel style={{ marginBottom: 14 }}>
          <PanelHead title="Peak Demand Alerts" right={<Chip color={C.yellow}>{peaks.length}</Chip>} />
          <div style={{ padding: "10px 14px" }}>
            {peaks.map((p, i) => (
              <div key={i} style={{
                padding: "9px 12px", borderRadius: 5, borderLeft: `2px solid ${C.yellow}`,
                background: `${C.yellow}0a`, marginBottom: 7,
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <div>
                  <p style={{ fontSize: 11, color: C.yellow }}>{p.message}</p>
                  <p style={{ fontSize: 9, color: C.muted, marginTop: 3, fontFamily: "'IBM Plex Mono',monospace" }}>{p.datetime}</p>
                </div>
                <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 15, fontWeight: 500, color: C.yellow }}>{fmt(p.prediction, 0)} MW</div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* Hourly data table */}
      {fc.length > 0 && (
        <Panel>
          <button onClick={() => setShowRows(r => !r)}
            style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", background: "transparent", border: "none", color: C.text, cursor: "pointer", padding: "12px 16px", fontSize: 12, fontWeight: 700 }}>
            <span>📊 Hourly Data <span style={{ color: C.muted, fontWeight: 400 }}>({fc.length} rows)</span></span>
            <span style={{ color: C.muted, fontSize: 10 }}>{showRows ? "▲" : "▼"}</span>
          </button>
          <AnimatePresence>
            {showRows && (
              <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} style={{ overflow: "hidden" }}>
                <div style={{ maxHeight: 320, overflowY: "auto", borderTop: `1px solid ${C.border}` }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: C.bg2, position: "sticky", top: 0 }}>
                        {["Datetime", "Demand (MW)", "vs Avg"].map((h, i) => (
                          <th key={h} style={{ padding: "6px 14px", fontSize: 8, color: C.muted, textTransform: "uppercase", letterSpacing: ".1em", borderBottom: `1px solid ${C.border}`, textAlign: i === 0 ? "left" : "right" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {fc.map((r, i) => {
                        const delta = r.prediction - (avgMW ?? r.prediction);
                        return (
                          <tr key={i} style={{ background: i % 2 ? `${C.bg}80` : "transparent", borderBottom: `1px solid ${C.border}12` }}>
                            <td style={{ padding: "5px 14px", color: C.muted, fontFamily: "'IBM Plex Mono',monospace", fontSize: 10 }}>{r.datetime}</td>
                            <td style={{ padding: "5px 14px", textAlign: "right", fontFamily: "'IBM Plex Mono',monospace", color: C.yellow, fontWeight: 500 }}>{fmt(r.prediction, 2)}</td>
                            <td style={{ padding: "5px 14px", textAlign: "right", fontFamily: "'IBM Plex Mono',monospace", color: delta >= 0 ? C.red : C.green, fontSize: 10 }}>
                              {delta >= 0 ? "+" : ""}{fmt(delta, 1)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Panel>
      )}
    </div>
  );
};

// ── SITE FORECAST TAB ─────────────────────────────────────────────────────────
const SiteForecast = () => {
  const [summary, setSummary] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [hours, setHours] = useState(24);

  const run = useCallback(async (h = hours) => {
    setLoading(true); setErr(null);
    try {
      const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const [sRes, fRes] = await Promise.all([
        fetch(apiUrl("/dashboard/site-summary"), { headers }),
        fetch(apiUrl(`/dashboard/site-forecast?hours=${h}`), { headers }),
      ]);
      const sJson = await sRes.json();
      const fJson = await fRes.json();
      if (!sJson.success) throw new Error(sJson.message || "Site summary failed");
      if (!fJson.success) throw new Error(fJson.message || "Forecast failed");
      setSummary(sJson);
      setData(fJson);
    } catch (e) { setErr(e.message); } finally { setLoading(false); }
  }, [hours]);

  useEffect(() => { run(24); }, []);

  const rows = data?.forecast ?? [];
  const cur = summary?.current;
  const devOnline = summary?.deviceStatus === "online";

  return (
    <div style={{ maxWidth: 1120, margin: "0 auto", padding: "20px 20px 40px" }}>

      {/* Controls */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
        <p style={{ fontSize: 9, fontFamily: "'IBM Plex Mono',monospace", letterSpacing: ".1em", textTransform: "uppercase", color: C.muted, marginRight: 4 }}>Window:</p>
        {[12, 24, 48].map(h => (
          <button key={h} onClick={() => { setHours(h); run(h); }}
            style={{
              padding: "7px 14px", border: `1px solid ${hours === h ? C.green + "60" : C.border}`,
              background: hours === h ? `${C.green}12` : C.panel,
              color: hours === h ? C.green : C.muted,
              borderRadius: 5, fontSize: 10, cursor: "pointer", fontFamily: "'IBM Plex Mono',monospace",
            }}>{h}H</button>
        ))}
        <Btn onClick={() => run(hours)} loading={loading} variant="secondary" style={{ marginLeft: 4 }}>↻ Refresh</Btn>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 7 }}>
          <Dot color={devOnline ? C.green : C.red} size={7} pulse={devOnline} />
          <span style={{ fontSize: 10, fontFamily: "'IBM Plex Mono',monospace", color: devOnline ? C.green : C.red }}>
            Device {summary?.deviceStatus ?? "—"}
          </span>
          {summary && <span style={{ fontSize: 9, color: C.muted }}>· {Math.round((summary.freshnessMs ?? 0) / 1000)}s freshness</span>}
        </div>
      </div>

      <ErrBox msg={err} />

      {/* KPI strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, marginBottom: 14 }}>
        <StatCard label="Power Now" value={cur ? fmt(cur.power_w, 2) : null} unit="W" color={C.green} accentBar={C.green} icon="⚡" />
        <StatCard label="Load Now" value={cur ? fmt(cur.instant_load_kw, 3) : null} unit="kW" color={C.blue} accentBar={C.blue} icon="🔋" />
        <StatCard label="Energy Today" value={summary ? fmt(summary.totals?.total_energy_today_kwh, 3) : null} unit="kWh" color={C.yellow} accentBar={C.yellow} icon="📊" />
        <StatCard label="Live Price" value={summary ? fmt(summary.pricing?.final_rate_per_kwh, 3) : null} unit="tok/kWh" color={C.purple} accentBar={C.purple} icon="💎" />
        <StatCard label="Total Forecast" value={rows.length > 0 ? fmt(rows.reduce((s, r) => s + (r.demand_kwh || 0), 0), 2) : null} unit="kWh projected" color={C.blue} accentBar={C.blue} />
      </div>

      {/* Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <Panel>
          <PanelHead title="Demand Forecast" right={<Chip>kWh</Chip>} />
          <div style={{ padding: "12px 14px 8px" }}>
            {loading ? <Skel h={80} /> : <Sparkline values={rows.map(r => r.demand_kwh || 0)} color={C.blue} height={80} />}
          </div>
        </Panel>
        <Panel>
          <PanelHead title="Tariff Forecast" right={<Chip color={C.yellow}>tokens/kWh</Chip>} />
          <div style={{ padding: "12px 14px 8px" }}>
            {loading ? <Skel h={80} /> : <Sparkline values={rows.map(r => r.price_tokens_per_kwh || 0)} color={C.yellow} height={80} />}
          </div>
        </Panel>
      </div>

      {/* Balance chart */}
      {rows.length > 0 && (
        <Panel style={{ marginBottom: 14 }}>
          <PanelHead title="Supply vs Demand Balance" right={<Chip color={C.green}>kWh · operational</Chip>} />
          <div style={{ padding: "12px 14px 8px" }}>
            <Sparkline values={rows.map(r => r.balance_kwh || 0)} color={C.green} height={60} />
          </div>
        </Panel>
      )}

      {/* Full operational table */}
      <Panel>
        <PanelHead title="Hourly Operational Forecast" right={<span style={{ fontSize: 9, color: C.muted }}>{rows.length} rows</span>} />
        <div style={{ maxHeight: 360, overflowY: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: C.bg2, position: "sticky", top: 0 }}>
                {["Time", "Demand", "Supply", "Balance", "Price", "Confidence"].map((h, i) => (
                  <th key={h} style={{ padding: "7px 12px", fontSize: 8, color: C.muted, textTransform: "uppercase", letterSpacing: ".1em", borderBottom: `1px solid ${C.border}`, textAlign: i === 0 ? "left" : "right" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const conf = r.confidence?.toLowerCase() ?? "";
                const confColor = conf === "high" ? C.green : conf === "medium" ? C.yellow : C.red;
                return (
                  <tr key={i} style={{ borderBottom: `1px solid ${C.border}18`, background: i % 2 ? `${C.bg}80` : "transparent" }}>
                    <td style={{ padding: "7px 12px", color: C.muted, fontFamily: "'IBM Plex Mono',monospace", fontSize: 10 }}>
                      {new Date(r.timestamp).toLocaleString("en", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td style={{ padding: "7px 12px", textAlign: "right", fontFamily: "'IBM Plex Mono',monospace", color: C.blue, fontSize: 11 }}>{fmt(r.demand_kwh, 3)}</td>
                    <td style={{ padding: "7px 12px", textAlign: "right", fontFamily: "'IBM Plex Mono',monospace", color: C.green, fontSize: 11 }}>{fmt(r.supply_kwh, 3)}</td>
                    <td style={{ padding: "7px 12px", textAlign: "right", fontFamily: "'IBM Plex Mono',monospace", color: (r.balance_kwh ?? 0) >= 0 ? C.green : C.red, fontSize: 11, fontWeight: 500 }}>
                      {(r.balance_kwh ?? 0) >= 0 ? "+" : ""}{fmt(r.balance_kwh, 3)}
                    </td>
                    <td style={{ padding: "7px 12px", textAlign: "right", fontFamily: "'IBM Plex Mono',monospace", color: C.yellow, fontSize: 11 }}>{fmt(r.price_tokens_per_kwh, 3)}</td>
                    <td style={{ padding: "7px 12px", textAlign: "right" }}><Chip color={confColor}>{r.confidence ?? "—"}</Chip></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
};

// ── ROOT ──────────────────────────────────────────────────────────────────────
const TABS = [
  { id: "site", label: "Site Forecast", sub: "Backend telemetry", color: C.green, },
  { id: "zone", label: "Zone LSTM", sub: "Grid Analytics Engine", color: C.green, },
  { id: "city", label: "City Climate", sub: "City Climate Engine", color: C.blue, },
  { id: "xgb", label: "Historical Analytics", sub: "XGBoost · Time-series", color: C.yellow, },
];

export default function EnergyForecast() {
  const [tab, setTab] = useState("site");

  return (
    <>
      <GlobalStyles />
      <NavBar />
      <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'Outfit', sans-serif", paddingTop: 52 }}>

        {/* Top bar */}
        <div style={{
          background: `${C.bg2}f0`, borderBottom: `1px solid ${C.border}`,
          padding: "0 24px", display: "flex", alignItems: "center",
          justifyContent: "space-between", height: 48,
          backdropFilter: "blur(20px)", position: "sticky", top: 52, zIndex: 100,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: `linear-gradient(135deg, ${C.green}, #00b4d8)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>⚡</div>
            <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: "-.3px" }}>
              Eco<span style={{ color: C.green }}>Grid</span>
              <span style={{ color: C.muted, fontWeight: 400, fontSize: 12, marginLeft: 8 }}>/ AI Energy Intelligence</span>
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Dot color={C.green} size={6} pulse />
            <span style={{ fontSize: 9, fontFamily: "'IBM Plex Mono',monospace", letterSpacing: ".1em", color: C.green }}>LIVE</span>
          </div>
        </div>

        {/* Tab bar */}
        <div style={{
          borderBottom: `1px solid ${C.border}`,
          padding: "0 16px", display: "flex", gap: 0,
          background: C.bg2, position: "sticky", top: 100, zIndex: 99,
        }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{
                padding: "10px 20px", border: "none",
                borderBottom: `2px solid ${tab === t.id ? t.color : "transparent"}`,
                background: "transparent", color: tab === t.id ? t.color : C.muted,
                cursor: "pointer", transition: "all .18s",
                display: "flex", flexDirection: "column", gap: 2, alignItems: "flex-start",
              }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <Dot color={t.color} size={5} pulse={tab === t.id} />
                <span style={{ fontWeight: 700, fontSize: 12 }}>{t.label}</span>
              </div>
              <span style={{ fontSize: 8, color: C.muted2, fontFamily: "'IBM Plex Mono',monospace", paddingLeft: 12 }}>{t.sub}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: .22 }}>
            {tab === "site" && <SiteForecast />}
            {tab === "zone" && <ZoneLSTM />}
            {tab === "city" && <CityLSTM />}
            {tab === "xgb" && <XGBoostDemand />}
          </motion.div>
        </AnimatePresence>

        {/* Footer */}
        <div style={{ borderTop: `1px solid ${C.border}`, padding: "10px 24px", display: "flex", justifyContent: "space-between", fontSize: 9, color: C.muted2, fontFamily: "'IBM Plex Mono',monospace" }}>
          <span style={{ color: C.muted }}>EcoGrid · AI Energy Intelligence</span>
          <span>Grid Analytics · City Climate · Historical Analytics · © {new Date().getFullYear()}</span>
        </div>
      </div>
    </>
  );
}