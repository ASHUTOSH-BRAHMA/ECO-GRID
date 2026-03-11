import React, { useState, useEffect, useContext, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import NavBar from "./NavBar";
import TradeModal from "../components/TradeModal";
import { handleerror, handlesuccess } from "../../utils";
import { AuthContext } from "../Context/AuthContext";
import useSocket from "../hooks/useSocket";
import { apiUrl } from "../config";

const GS = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=IBM+Plex+Mono:wght@300;400;500&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    ::-webkit-scrollbar { width: 3px; height: 3px; }
    ::-webkit-scrollbar-track { background: #070d16; }
    ::-webkit-scrollbar-thumb { background: #1e3050; border-radius: 2px; }
    input, button, select, textarea { font-family: inherit; }
    input[type=range] { accent-color: #00e5a0; }
    @keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.3;transform:scale(.7)} }
    @keyframes spin { to{transform:rotate(360deg)} }
    @keyframes shimmer { 0%{background-position:-400% 0} 100%{background-position:400% 0} }
    @keyframes ticker { from{transform:translateX(0)} to{transform:translateX(-50%)} }
    @keyframes glow-in { from{box-shadow:0 0 0 0 rgba(0,229,160,0)} to{box-shadow:0 0 18px 2px rgba(0,229,160,.15)} }
    @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
    @keyframes pulse-badge { 0%,100%{opacity:1} 50%{opacity:0.6} }
  `}</style>
);

const C = {
  bg: "#04080f", bg2: "#070d16", bg3: "#0a1220", panel: "#0d1628",
  border: "#132035", border2: "#1e3050", green: "#00e5a0",
  red: "#ff3d5a", yellow: "#ffcc44", blue: "#3d9eff",
  purple: "#9d79f5", orange: "#ff9f43", text: "#dce8f5",
  muted: "#4d6a88", muted2: "#2a3f58",
};

const CAT_META = {
  Solar: { color: C.yellow, icon: "☀️", glyph: "◈" },
  Wind: { color: C.blue, icon: "💨", glyph: "◉" },
  Hydro: { color: C.green, icon: "💧", glyph: "◆" },
  Biomass: { color: C.purple, icon: "🌿", glyph: "◇" },
};
const catStyle = (c) => CAT_META[c] || { color: C.muted, icon: "⚡", glyph: "●" };

const relTime = (ts) => {
  if (!ts) return "—";
  const d = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (d < 60) return `${d}s ago`;
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  return new Date(ts).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

const isExpiringSoon = (createdAt) => {
  if (!createdAt) return false;
  const created = new Date(createdAt).getTime();
  const expiryTime = created + 7 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const hoursLeft = (expiryTime - now) / (1000 * 60 * 60);
  return hoursLeft > 0 && hoursLeft <= 48;
};

const getTimeLeft = (createdAt) => {
  if (!createdAt) return null;
  const created = new Date(createdAt).getTime();
  const expiryTime = created + 7 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const hoursLeft = Math.max(0, (expiryTime - now) / (1000 * 60 * 60));
  if (hoursLeft <= 0) return null;
  if (hoursLeft < 24) return `${Math.ceil(hoursLeft)}h left`;
  return `${Math.ceil(hoursLeft / 24)}d left`;
};

const generatePriceHistory = (basePrice, seed) => {
  const history = [];
  let price = basePrice * 0.85;
  for (let i = 0; i < 12; i++) {
    const change = (Math.sin(seed + i * 0.5) * 0.15 + Math.cos(seed * 2 + i) * 0.1) * basePrice;
    price = Math.max(basePrice * 0.7, Math.min(basePrice * 1.3, price + change));
    history.push(price);
  }
  history.push(basePrice);
  return history;
};

const Dot = ({ color = C.green, size = 7, pulse = false }) => (
  <span style={{ display: "inline-block", width: size, height: size, borderRadius: "50%", background: color, flexShrink: 0, animation: pulse ? "pulse-dot 2s ease infinite" : "none" }} />
);

const Chip = ({ children, color = C.green, size = 9 }) => (
  <span style={{ fontSize: size, fontFamily: "'IBM Plex Mono',monospace", letterSpacing: ".06em", padding: "2px 8px", borderRadius: 3, textTransform: "uppercase", background: `${color}16`, color, border: `1px solid ${color}30` }}>
    {children}
  </span>
);

const Skel = ({ h = 28, w = "100%", r = 4 }) => (
  <div style={{ height: h, width: w, borderRadius: r, background: `linear-gradient(90deg,${C.panel} 20%,${C.border} 50%,${C.panel} 80%)`, backgroundSize: "400% 100%", animation: "shimmer 1.8s ease infinite" }} />
);

const Panel = ({ children, style = {}, accent }) => (
  <div style={{ background: C.panel, border: `1px solid ${accent ? accent + "30" : C.border}`, borderRadius: 8, overflow: "hidden", ...style }}>
    {children}
  </div>
);

const PHead = ({ title, right, accent }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 16px", borderBottom: `1px solid ${C.border}`, background: accent ? `linear-gradient(90deg, ${accent}0a, transparent)` : "transparent" }}>
    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.4px", textTransform: "uppercase", color: C.muted }}>{title}</span>
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>{right}</div>
  </div>
);

const Input = ({ label, ...props }) => (
  <div>
    {label && <p style={{ fontSize: 9, fontFamily: "'IBM Plex Mono',monospace", letterSpacing: ".1em", textTransform: "uppercase", color: C.muted, marginBottom: 5 }}>{label}</p>}
    <input {...props} style={{ width: "100%", padding: "9px 12px", background: C.bg2, border: `1px solid ${C.border2}`, borderRadius: 5, color: C.text, fontSize: 13, outline: "none", transition: "border-color .2s", ...(props.style || {}) }} onFocus={(e) => (e.target.style.borderColor = C.green)} onBlur={(e) => (e.target.style.borderColor = C.border2)} />
  </div>
);

const Btn = ({ children, onClick, variant = "primary", disabled, style = {}, type }) => (
  <motion.button onClick={onClick} disabled={disabled} type={type} whileHover={!disabled ? { scale: 1.02 } : {}} whileTap={!disabled ? { scale: 0.97 } : {}}
    style={{ padding: "9px 20px", border: "none", borderRadius: 6, cursor: disabled ? "not-allowed" : "pointer", fontWeight: 700, fontSize: 11, letterSpacing: "1px", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap", transition: "all .2s", background: disabled ? C.border2 : variant === "primary" ? `linear-gradient(135deg,${C.green},#00c4a0)` : variant === "danger" ? `${C.red}18` : C.panel, color: disabled ? C.muted : variant === "primary" ? "#04080f" : variant === "danger" ? C.red : C.text, borderWidth: 1, borderStyle: "solid", borderColor: variant !== "primary" ? (variant === "danger" ? C.red + "40" : C.border2) : "transparent", boxShadow: !disabled && variant === "primary" ? `0 4px 18px ${C.green}28` : "none", ...style }}
  >
    {children}
  </motion.button>
);

const MiniSparkline = ({ data, color, height = 28 }) => {
  if (!data.length) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 100;
  const points = data.map((val, i) => `${(i / (data.length - 1)) * width},${height - ((val - min) / range) * (height - 4) - 2}`);
  const pathD = `M ${points.join(" L ")}`;
  const trend = data.length >= 2 ? ((data[data.length - 1] - data[0]) / data[0]) * 100 : 0;
  const trendColor = trend >= 0 ? C.green : C.red;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <svg width={width} height={height} style={{ overflow: "visible" }}>
        <defs><linearGradient id={`sparkGrad-${color.replace("#", "")}`} x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor={color} stopOpacity="0.3" /><stop offset="100%" stopColor={color} stopOpacity="0" /></linearGradient></defs>
        <path d={`${pathD} L ${width},${height} L 0,${height} Z`} fill={`url(#sparkGrad-${color.replace("#", "")})`} />
        <path d={pathD} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={width} cy={height - ((data[data.length - 1] - min) / range) * (height - 4) - 2} r="3" fill={color} />
      </svg>
      <span style={{ fontSize: 9, fontFamily: "'IBM Plex Mono',monospace", color: trendColor, fontWeight: 600 }}>{trend >= 0 ? "▲" : "▼"} {Math.abs(trend).toFixed(1)}%</span>
    </div>
  );
};

const LiveTicker = ({ listings }) => {
  if (!listings.length) return null;
  const items = [...listings, ...listings];
  return (
    <div style={{ background: C.bg2, borderBottom: `1px solid ${C.border}`, padding: "6px 0", overflow: "hidden", position: "relative" }}>
      <div style={{ display: "flex", gap: 0, animation: "ticker 30s linear infinite", width: "max-content" }}>
        {items.map((l, i) => {
          const cs = catStyle(l.category);
          return (
            <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "0 28px", fontSize: 10, fontFamily: "'IBM Plex Mono',monospace", color: C.muted, whiteSpace: "nowrap", borderRight: `1px solid ${C.border}` }}>
              <span style={{ color: cs.color }}>{cs.icon}</span><span style={{ color: C.text }}>{l.title}</span><span style={{ color: C.green, fontWeight: 500 }}>{l.price} ETK</span><span>·</span><span>{l.capacity}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, color = C.text, sub, trend }) => (
  <Panel style={{ padding: 0 }}>
    <div style={{ height: 2, background: `linear-gradient(90deg,${color},transparent)`, borderRadius: "2px 2px 0 0" }} />
    <div style={{ padding: "14px 16px 12px" }}>
      <p style={{ fontSize: 9, fontFamily: "'IBM Plex Mono',monospace", letterSpacing: ".1em", textTransform: "uppercase", color: C.muted, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}><span>{icon}</span>{label}</p>
      <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 28, fontWeight: 500, color, lineHeight: 1, letterSpacing: "-1px" }}>{value ?? "—"}</p>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 7 }}>
        {sub && <p style={{ fontSize: 9, color: C.muted }}>{sub}</p>}
        {trend != null && <span style={{ fontSize: 9, fontFamily: "'IBM Plex Mono',monospace", color: trend >= 0 ? C.green : C.red }}>{trend >= 0 ? "▲" : "▼"} {Math.abs(trend)}%</span>}
      </div>
    </div>
  </Panel>
);

const ListingCard = ({ listing, onTrade, onEdit, onRemove, isOwner, idx }) => {
  const cs = catStyle(listing.category);
  const [hovered, setHovered] = useState(false);
  const avail = listing.availability;
  const availColor = avail === "sold_out" ? C.red : avail === "limited" ? C.yellow : C.green;
  const availLabel = avail === "sold_out" ? "Sold Out" : avail === "limited" ? "Limited" : "Available";
  const expiringSoon = isExpiringSoon(listing.createdAt);
  const timeLeft = getTimeLeft(listing.createdAt);
  const priceHistory = generatePriceHistory(Number(listing.price) || 20, idx * 7 + (listing.id && listing.id.charCodeAt(0) || 0));
  const priceTrend = priceHistory.length >= 2 ? ((priceHistory[priceHistory.length - 1] - priceHistory[0]) / priceHistory[0]) * 100 : 0;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: (idx % 10) * 0.05, duration: 0.35 }} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ background: C.panel, borderRadius: 10, border: `1px solid ${hovered ? cs.color + "40" : C.border}`, overflow: "hidden", transition: "border-color .25s, box-shadow .25s", boxShadow: hovered ? `0 8px 32px ${cs.color}14` : "none", display: "flex", flexDirection: "column", position: "relative" }}
    >
      <div style={{ height: 3, background: `linear-gradient(90deg, ${cs.color}, ${cs.color}44)` }} />
      {expiringSoon && (
        <div style={{ position: "absolute", top: 12, left: 12, zIndex: 10, display: "flex", alignItems: "center", gap: 4, padding: "4px 8px", borderRadius: 4, background: `${C.orange}20`, border: `1px solid ${C.orange}40`, animation: "pulse-badge 2s ease infinite" }}>
          <span style={{ fontSize: 10 }}>⏰</span><span style={{ fontSize: 8, fontFamily: "'IBM Plex Mono',monospace", color: C.orange, fontWeight: 700, textTransform: "uppercase" }}>{timeLeft}</span>
        </div>
      )}
      <div style={{ padding: "16px 16px 14px", flex: 1 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12, marginTop: expiringSoon ? 20 : 0 }}>
          <div style={{ width: 46, height: 46, borderRadius: 8, background: `${cs.color}14`, border: `1px solid ${cs.color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
            {listing.icon || cs.icon}
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5 }}>
            <Chip color={cs.color}>{listing.category}</Chip>
            <span style={{ fontSize: 8, fontFamily: "'IBM Plex Mono',monospace", padding: "1px 6px", borderRadius: 2, background: `${availColor}14`, color: availColor, border: `1px solid ${availColor}28`, textTransform: "uppercase" }}>{availLabel}</span>
          </div>
        </div>
        <p style={{ fontWeight: 700, fontSize: 15, color: C.text, marginBottom: 3, lineHeight: 1.3 }}>{listing.title}</p>
        <p style={{ fontSize: 10, color: C.muted, marginBottom: 12, fontFamily: "'IBM Plex Mono',monospace" }}>📍 {listing.location}</p>
        <div style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 6, padding: "10px 12px", marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <span style={{ fontSize: 8, fontFamily: "'IBM Plex Mono',monospace", letterSpacing: ".08em", textTransform: "uppercase", color: C.muted }}>Price Trend (7d)</span>
            <span style={{ fontSize: 9, fontFamily: "'IBM Plex Mono',monospace", color: priceTrend >= 0 ? C.green : C.red, fontWeight: 600 }}>{priceTrend >= 0 ? "+" : ""}{priceTrend.toFixed(1)}%</span>
          </div>
          <MiniSparkline data={priceHistory} color={cs.color} height={32} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 14 }}>
          { [["Capacity", listing.capacity, C.text], ["Price", `${listing.price} ETK`, cs.color], ["Producer", listing.producer || "—", C.blue], ["Type", listing.category, cs.color]].map(([lbl, val, col]) => (
            <div key={lbl} style={{ background: C.bg2, border: `1px solid ${C.border}`, padding: "7px 9px", borderRadius: 5 }}>
              <p style={{ fontSize: 8, fontFamily: "'IBM Plex Mono',monospace", letterSpacing: ".08em", textTransform: "uppercase", color: C.muted, marginBottom: 3 }}>{lbl}</p>
              <p style={{ fontSize: 11, fontWeight: 600, color: col, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{val}</p>
            </div>
          )) }
        </div>
        <div style={{ background: `${cs.color}0c`, border: `1px solid ${cs.color}24`, borderRadius: 6, padding: "8px 12px", marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 9, fontFamily: "'IBM Plex Mono',monospace", color: C.muted, textTransform: "uppercase", letterSpacing: ".08em" }}>ETK per trade</span>
          <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 18, fontWeight: 500, color: cs.color }}>{listing.price}</span>
        </div>
      </div>
      <div style={{ padding: "0 16px 14px", display: "flex", gap: 7 }}>
        {isOwner ? (
          <>
            <button onClick={() => onEdit(listing)} style={{ flex: 1, padding: "8px 0", borderRadius: 5, background: `${C.blue}12`, border: `1px solid ${C.blue}30`, color: C.blue, fontSize: 10, fontWeight: 600, cursor: "pointer", letterSpacing: ".05em" }}>✏ Edit</button>
            <button onClick={() => onRemove(listing.id)} style={{ flex: 1, padding: "8px 0", borderRadius: 5, background: `${C.red}12`, border: `1px solid ${C.red}30`, color: C.red, fontSize: 10, fontWeight: 600, cursor: "pointer", letterSpacing: ".05em" }}>🗑 Remove</button>
          </>
        ) : (
          <motion.button onClick={() => onTrade(listing)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} disabled={avail === "sold_out"}
            style={{ flex: 1, padding: "10px 0", borderRadius: 5, background: avail === "sold_out" ? C.border2 : `linear-gradient(135deg,${cs.color},${cs.color}bb)`, border: "none", color: avail === "sold_out" ? C.muted : "#04080f", fontSize: 11, fontWeight: 800, cursor: avail === "sold_out" ? "not-allowed" : "pointer", letterSpacing: ".08em", textTransform: "uppercase", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, boxShadow: avail !== "sold_out" ? `0 4px 16px ${cs.color}30` : "none" }}
          >
            {avail === "sold_out" ? "Unavailable" : <>⚡ Trade Energy</>}
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};

const useWatchlist = () => {
  const [watchlist, setWatchlist] = useState([]);
  useEffect(() => { try { const saved = localStorage.getItem("ecogrid_watchlist"); if (saved) setWatchlist(JSON.parse(saved)); } catch {} }, []);
  const toggle = useCallback((id) => {
    setWatchlist((prev) => { const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]; try { localStorage.setItem("ecogrid_watchlist", JSON.stringify(next)); } catch {}; return next; });
  }, []);
  return { watchlist, toggle };
};

const Toast = ({ msg, onDone }) => {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, [onDone]);
  return (
    <motion.div initial={{ opacity: 0, y: 30, x: "-50%" }} animate={{ opacity: 1, y: 0, x: "-50%" }} exit={{ opacity: 0, y: 30, x: "-50%" }}
      style={{ position: "fixed", bottom: 28, left: "50%", background: C.panel, border: `1px solid ${C.green}40`, borderRadius: 8, padding: "11px 22px", color: C.text, fontSize: 13, fontWeight: 500, zIndex: 9999, boxShadow: "0 8px 32px rgba(0,0,0,.6)", display: "flex", alignItems: "center", gap: 9, whiteSpace: "nowrap" }}
    >
      <Dot color={C.green} size={6} pulse />{msg}
    </motion.div>
  );
};

const CreateModal = ({ editing, initial, onClose, onSubmit }) => {
  const [form, setForm] = useState(initial);
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const ICONS = { Solar: "☀️", Wind: "💨", Hydro: "💧", Biomass: "🌿" };
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.78)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 16 }}
    >
      <motion.div initial={{ scale: 0.92, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.92, opacity: 0 }} onClick={(e) => e.stopPropagation()}
        style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 10, padding: 0, maxWidth: 460, width: "100%", boxShadow: "0 40px 80px rgba(0,0,0,.7)", overflow: "hidden" }}
      >
        <div style={{ background: `${C.green}0a`, borderBottom: `1px solid ${C.border}`, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div><p style={{ fontWeight: 800, fontSize: 15, color: C.text }}>{editing ? "Edit Listing" : "New Energy Listing"}</p><p style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>List your renewable energy on the grid</p></div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: C.muted, cursor: "pointer", fontSize: 20, lineHeight: 1 }}>✕</button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <p style={{ fontSize: 9, fontFamily: "'IBM Plex Mono',monospace", letterSpacing: ".1em", textTransform: "uppercase", color: C.muted, marginBottom: 8 }}>Category</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 7 }}>
              {["Solar", "Wind", "Hydro", "Biomass"].map((cat) => {
                const cs = catStyle(cat); const active = form.category === cat;
                return (
                  <button type="button" key={cat} onClick={() => { set("category", cat); set("icon", ICONS[cat]); }}
                    style={{ padding: "10px 6px", borderRadius: 6, border: `1px solid ${active ? cs.color + "60" : C.border}`, background: active ? `${cs.color}12` : "transparent", color: active ? cs.color : C.muted, cursor: "pointer", textAlign: "center", transition: "all .15s" }}>
                    <div style={{ fontSize: 20, marginBottom: 4 }}>{ICONS[cat]}</div><div style={{ fontSize: 9, fontWeight: 600, letterSpacing: ".06em" }}>{cat}</div>
                  </button>
                );
              })}
            </div>
          </div>
          <Input label="Listing Title" value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Solar Surplus" required />
          <Input label="Location" value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="Chennai" required />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Input label="Capacity" value={form.capacity} onChange={(e) => set("capacity", e.target.value)} placeholder="5 kW" required />
            <Input label="Price (ETK)" type="number" value={form.price} onChange={(e) => set("price", e.target.value)} placeholder="20" required />
          </div>
          <Btn type="submit" style={{ width: "100%", justifyContent: "center", marginTop: 4 }}>{editing ? "✅ Update Listing" : "🌱 Create Listing"}</Btn>
        </form>
      </motion.div>
    </motion.div>
  );
};

const TxDrawer = ({ tx, onClose }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 150 }} onClick={onClose}>
    <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 260 }} onClick={(e) => e.stopPropagation()}
      style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 360, background: C.bg2, borderLeft: `1px solid ${C.border}`, overflowY: "auto" }}>
      <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p style={{ fontWeight: 700, fontSize: 14 }}>Transaction</p><button onClick={onClose} style={{ background: "transparent", border: "none", color: C.muted }}>✕</button>
      </div>
      <div style={{ padding: 20 }}>
        <div style={{ background: tx.type === "bought" ? `${C.blue}10` : `${C.green}10`, border: `1px solid ${tx.type === "bought" ? C.blue : C.green}30`, borderRadius: 8, padding: "14px 16px", marginBottom: 18, textAlign: "center" }}>
          <p style={{ fontSize: 24, fontWeight: 500, color: tx.type === "bought" ? C.blue : C.green }}>{tx.amount} ETK</p>
        </div>
        {[["Listing", tx.listingTitle || "—"], ["Energy", `${tx.energyKwh} kWh`], ["Date", tx.timestamp ? new Date(tx.timestamp).toLocaleString("en-IN") : "—"], ["Status", tx.status || "Completed"]].map(([k, v]) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${C.border}20` }}>
            <span style={{ fontSize: 10, color: C.muted }}>{k}</span><span style={{ fontSize: 12 }}>{v}</span>
          </div>
        ))}
      </div>
    </motion.div>
  </motion.div>
);

const MarketplacePage = () => {
  const { user } = useContext(AuthContext);
  const currentUserId = user?.user?._id || user?._id;
  const isProsumer = user?.user?.userType === "prosumer" || user?.userType === "prosumer";

  const [activeTab, setActiveTab] = useState("marketplace");
  const [myListings, setMyListings] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [energyListings, setEnergyListings] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState("grid");
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingListing, setEditingListing] = useState(null);
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);
  const [selectedTx, setSelectedTx] = useState(null);
  const [toast, setToast] = useState(null);
  const [userProfile, setUserProfile] = useState({ ETK: "--", totalTrades: "--", energyBalance: "--" });
  const [loading, setLoading] = useState(true);

  const { watchlist, toggle: toggleWatch } = useWatchlist();
  const { subscribeToEnergyData } = useSocket();
  const showToast = (msg) => setToast(msg);

  useEffect(() => { subscribeToEnergyData(); }, [subscribeToEnergyData]);

  useEffect(() => {
    if (!isProsumer) return;
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    const headers = { Authorization: `Bearer ${token}` };
    const go = async () => {
      try { const r = await fetch(apiUrl('/user/listings'), { headers }); const d = await r.json(); if (d.success) setMyListings(d.listings.map(l => ({ id: l._id, title: l.title, location: l.location, capacity: l.capacity, price: l.price, category: l.category, icon: l.icon, availability: l.availability }))); } catch {}
      try { const r = await fetch(apiUrl('/user/listings/analytics'), { headers }); const d = await r.json(); if (d.success) setAnalytics(d.analytics); } catch {}
      try {
        const r = await fetch(apiUrl('/user/transactions'), { headers }); const d = await r.json();
        if (d.success) {
          setTransactions(d.transactions);
          const etk = d.transactions.filter(t => t.type === 'sold').reduce((s, t) => s + (Number(t.amount) || 0), 0);
          const kwh = d.transactions.filter(t => t.type === 'bought').reduce((s, t) => s + (Number(t.energyKwh) || 0), 0);
          setUserProfile({ ETK: etk.toFixed(1), totalTrades: d.transactions.length, energyBalance: `${kwh.toFixed(1)} kWh` });
        }
      } catch {}
      try {
        const r = await fetch(apiUrl('/dashboard/marketplace-opportunities'), { headers }); const d = await r.json();
        if (d.success) setOpportunities(d.opportunities || []);
      } catch {}
    }
    go();
  }, [isProsumer]);

  useEffect(() => {
    const go = async () => {
      setLoading(true);
      try {
        const r = await fetch(apiUrl(`/listings?category=${selectedCategory !== "All" ? selectedCategory : ""}&search=${searchTerm}`));
        const d = await r.json();
        if (d.success) setEnergyListings(d.listings.map(l => ({ id: l._id, title: l.title, location: l.location, capacity: l.capacity, price: l.price, category: l.category, icon: l.icon, producer: l.producer?.name || 'Unknown', producerId: l.producer?._id || l.producer, availability: l.availability, createdAt: l.createdAt })));
      } catch {}
      setLoading(false);
    }
    go();
  }, [selectedCategory, searchTerm]);

  const filtered = energyListings.filter((l) => (selectedCategory === "All" || l.category === selectedCategory) && l.title.toLowerCase().includes(searchTerm.toLowerCase()) && Number(l.price) >= priceRange[0] && Number(l.price) <= priceRange[1])
    .sort((a, b) => {
      if (sortBy === "price_asc") return Number(a.price) - Number(b.price);
      if (sortBy === "price_desc") return Number(b.price) - Number(a.price);
      if (sortBy === "watched") return (watchlist.includes(b.id) ? 1 : 0) - (watchlist.includes(a.id) ? 1 : 0);
      return 0;
    });

  const watchedListings = energyListings.filter((l) => watchlist.includes(l.id));

  const handleCreate = async (form) => {
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      if (!token) return;
      const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
      if (editingListing) {
        const r = await fetch(apiUrl(`/listings/${editingListing.id}`), { method: 'PUT', headers, body: JSON.stringify({ ...form, price: parseFloat(form.price) }) });
        const d = await r.json();
        if (d.success) setEnergyListings(p => p.map(l => l.id === editingListing.id ? { id: d.listing._id, title: d.listing.title, location: d.listing.location, capacity: d.listing.capacity, price: d.listing.price, category: d.listing.category, icon: d.listing.icon, producer: d.listing.producer?.name || "User", availability: d.listing.availability, createdAt: d.listing.createdAt } : l));
      } else {
        const r = await fetch(apiUrl('/listings'), { method: 'POST', headers, body: JSON.stringify({ ...form, price: parseFloat(form.price) }) });
        const d = await r.json();
        if (d.success) setEnergyListings(p => [...p, { id: d.listing._id, title: d.listing.title, location: d.listing.location, capacity: d.listing.capacity, price: d.listing.price, category: d.listing.category, icon: d.listing.icon, producer: "User", availability: "available", createdAt: new Date().toISOString() }]);
      }
      showToast(editingListing ? "Listing updated ✓" : "Listing created ✓");
      setShowCreateModal(false);
      setEditingListing(null);
    } catch {}
  };

  const handleRemove = async (id) => {
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      if (!token) return;
      const r = await fetch(apiUrl(`/listings/${id}`), { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      const d = await r.json();
      if (d.success) { setEnergyListings(p => p.filter(l => l.id !== id)); showToast("Listing removed"); }
    } catch {}
  };

  const handleEdit = (l) => { setEditingListing(l); setShowCreateModal(true); };
  const handleTrade = (l) => { setSelectedListing(l); setShowTradeModal(true); };

  const TABS = isProsumer ? [{ id: "marketplace", label: "🌐 Marketplace" }, { id: "dashboard", label: "📊 Dashboard" }, { id: "watchlist", label: `⭐ Watchlist (${watchlist.length})` }] : [{ id: "marketplace", label: "🌐 Marketplace" }, { id: "watchlist", label: `⭐ Watchlist (${watchlist.length})` }];
  const CATEGORIES = ["All", "Solar", "Wind", "Hydro", "Biomass"];
  const SORTS = [{ v: "newest", l: "Newest" }, { v: "price_asc", l: "Price ↑" }, { v: "price_desc", l: "Price ↓" }, { v: "watched", l: "Watched" }];

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'Outfit',sans-serif", fontSize: 14 }}>
      <GS />
      <NavBar />

      <div style={{ paddingTop: 52 }}>
        <div style={{ background: `${C.bg2}f2`, borderBottom: `1px solid ${C.border}`, padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 48, backdropFilter: "blur(20px)", position: "sticky", top: 52, zIndex: 40 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: `linear-gradient(135deg,${C.green},#00b4d8)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>⚡</div>
            <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: "-.3px" }}>Eco<span style={{ color: C.green }}>Grid</span><span style={{ color: C.muted, fontWeight: 400, fontSize: 12, marginLeft: 8 }}>/ Energy Marketplace</span></span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontSize: 10, fontFamily: "'IBM Plex Mono',monospace", color: C.muted }}>Peer-to-Peer · Renewable</span>
            {isProsumer && <Btn onClick={() => { setEditingListing(null); setShowCreateModal(true); }} style={{ padding: "6px 14px", fontSize: 10 }}>+ New Listing</Btn>}
          </div>
        </div>

        <LiveTicker listings={energyListings} />

        <div style={{ borderBottom: `1px solid ${C.border}`, padding: "0 16px", display: "flex", gap: 0, background: C.bg2 }}>
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ padding: "10px 20px", border: "none", borderBottom: `2px solid ${activeTab === t.id ? C.green : "transparent"}`, background: "transparent", color: activeTab === t.id ? C.green : C.muted, cursor: "pointer", transition: "all .18s", fontWeight: 700, fontSize: 12 }}>{t.label}</button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "marketplace" && (
            <motion.div key="mp" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <div style={{ padding: "20px 20px 40px" }}>
                {isProsumer && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 16 }}>
                    <StatCard icon="💰" label="ETK Earned" value={userProfile.ETK} color={C.yellow} sub="from energy sales" />
                    <StatCard icon="⚡" label="Total Trades" value={userProfile.totalTrades} color={C.green} sub="all time" />
                    <StatCard icon="🔋" label="Energy Balance" value={userProfile.energyBalance} color={C.blue} sub="purchased" />
                    <StatCard icon="📋" label="Active Listings" value={myListings.filter((l) => l.availability !== "sold_out").length} color={C.purple} sub="on market" />
                  </div>
                )}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12, alignItems: "center" }}>
                  <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
                    <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: C.muted, fontSize: 13 }}>🔍</span>
                    <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search listings…" style={{ width: "100%", padding: "9px 12px 9px 36px", background: C.panel, border: `1px solid ${C.border2}`, borderRadius: 6, color: C.text, fontSize: 13, outline: "none" }} />
                  </div>
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                    {CATEGORIES.map((cat) => {
                      const cs = catStyle(cat); const active = selectedCategory === cat;
                      return <button key={cat} onClick={() => setSelectedCategory(cat)} style={{ padding: "7px 13px", border: `1px solid ${active ? (cs.color || C.green) + "50" : C.border}`, borderRadius: 5, background: active ? `${cs.color || C.green}14` : C.panel, color: active ? cs.color || C.green : C.muted, fontSize: 11, fontWeight: 600, cursor: "pointer", transition: "all .15s", display: "flex", alignItems: "center", gap: 5 }}>{cat !== "All" && cs.icon} {cat}</button>
                    })}
                  </div>
                </div>

                {loading ? (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 14, marginBottom: 24 }}>{[...Array(6)].map((_, i) => <Skel key={i} h={420} />)}</div>
                ) : filtered.length === 0 ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 10, padding: 60, textAlign: "center", marginBottom: 24 }}>
                    <p style={{ fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 6 }}>No listings found</p>
                  </motion.div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 14, marginBottom: 24 }}>
                    {filtered.map((l, i) => (
                      <div key={l.id} style={{ position: "relative" }}>
                        <button onClick={() => { toggleWatch(l.id); showToast(watchlist.includes(l.id) ? "Removed from watchlist" : "Added to watchlist ⭐"); }} style={{ position: "absolute", top: 14, right: 14, zIndex: 5, background: `${watchlist.includes(l.id) ? C.yellow : C.muted}18`, border: `1px solid ${watchlist.includes(l.id) ? C.yellow : C.border}40`, borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 13 }}>{watchlist.includes(l.id) ? "⭐" : "☆"}</button>
                        <ListingCard listing={l} idx={i} isOwner={currentUserId && l.producerId && l.producerId.toString() === currentUserId.toString()} onTrade={handleTrade} onEdit={handleEdit} onRemove={handleRemove} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === "dashboard" && isProsumer && (
            <motion.div key="db" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <div style={{ padding: "20px" }}>
                <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>My Analytics & Transactions</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 10, marginBottom: 20 }}>
                  <StatCard label="Total Listings" icon="📋" value={analytics?.totalListings || 0} />
                  <StatCard label="ETK Earned (Analytics)" icon="💰" color={C.yellow} value={analytics?.totalETKEarned || 0} />
                  <StatCard label="kWh Sold" icon="🔋" color={C.green} value={analytics?.totalKwhSold || 0} />
                  <StatCard label="Total Sales" icon="⚡" color={C.blue} value={analytics?.totalSales || 0} />
                </div>
                <Panel>
                  <PHead title="Transaction History" />
                  <div style={{ overflowX: "auto", padding: 12 }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                      <thead><tr style={{ background: C.bg2 }}><th style={{ padding: "8px 12px", textAlign: "left" }}>Date</th><th style={{ padding: "8px 12px", textAlign: "left" }}>Type</th><th style={{ padding: "8px 12px", textAlign: "left" }}>Amount ETK</th><th style={{ padding: "8px 12px", textAlign: "left" }}>Energy</th></tr></thead>
                      <tbody>
                        {transactions.map(t => (
                          <tr key={t._id} style={{ borderBottom: `1px solid ${C.border}` }}>
                            <td style={{ padding: "8px 12px" }}>{new Date(t.timestamp).toLocaleDateString()}</td>
                            <td style={{ padding: "8px 12px" }}><Chip color={t.type === "bought" ? C.blue : C.green}>{t.type}</Chip></td>
                            <td style={{ padding: "8px 12px", color: C.yellow }}>{t.amount}</td>
                            <td style={{ padding: "8px 12px" }}>{t.energyKwh} kWh</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Panel>
              </div>
            </motion.div>
          )}

          {activeTab === "watchlist" && (
            <motion.div key="wl" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <div style={{ padding: "20px" }}>
                {watchedListings.length === 0 ? <p style={{ textAlign: "center", padding: 40, color: C.muted }}>Watchlist is empty.</p> : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 14 }}>
                    {watchedListings.map((l, i) => (
                      <div key={l.id} style={{ position: "relative" }}>
                        <button onClick={() => { toggleWatch(l.id); showToast("Removed from watchlist"); }} style={{ position: "absolute", top: 14, right: 14, zIndex: 5, background: `${C.yellow}18`, border: `1px solid ${C.yellow}40`, borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 13 }}>⭐</button>
                        <ListingCard listing={l} idx={i} isOwner={false} onTrade={handleTrade} onEdit={handleEdit} onRemove={handleRemove} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      <TradeModal
        isOpen={showTradeModal}
        onClose={() => { setShowTradeModal(false); setSelectedListing(null); }}
        listing={selectedListing}
        onTradeComplete={async (txHash) => { handlesuccess(`Trade completed!`); showToast("⚡ Trade completed successfully!"); setTransactions(p => [...p, { _id: Date.now().toString(), type: 'bought', amount: selectedListing.price, energyKwh: selectedListing.capacity, timestamp: new Date(), txHash }]); }}
      />
      <AnimatePresence>
        {showCreateModal && <CreateModal editing={!!editingListing} initial={editingListing ? { title: editingListing.title, location: editingListing.location, capacity: editingListing.capacity, price: String(editingListing.price), category: editingListing.category, icon: editingListing.icon } : { title: "", location: "", capacity: "", price: "", category: "Solar", icon: "☀️" }} onClose={() => { setShowCreateModal(false); setEditingListing(null); }} onSubmit={handleCreate} />}
        {selectedTx && <TxDrawer tx={selectedTx} onClose={() => setSelectedTx(null)} />}
        {toast && <Toast msg={toast} onDone={() => setToast(null)} />}
      </AnimatePresence>
    </div>
  );
};

export default MarketplacePage;
