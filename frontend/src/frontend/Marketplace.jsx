import React, { useState, useEffect, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import NavBar from "./NavBar";
import TradeModal from "../components/TradeModal";
import { handleerror, handlesuccess } from "../../utils";
import { AuthContext } from "../Context/AuthContext";
import useSocket from "../hooks/useSocket";
import { apiUrl } from "../config";

// ── Same design tokens as EnergyForecast ─────────────────────────────────────
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
  @keyframes floatUp{0%{transform:translateY(0);opacity:.1}100%{transform:translateY(-80px);opacity:0}}
  * { box-sizing: border-box; }
  ::-webkit-scrollbar{width:3px} ::-webkit-scrollbar-track{background:#060810} ::-webkit-scrollbar-thumb{background:#2a3155;border-radius:2px}
  input,select{outline:none}
`

const Card = ({ title, badge, children, style = {} }) => (
  <div style={{ background: C.bg3, border: `1px solid ${C.border}`, borderRadius: 6, padding: 16, ...style }}>
    {(title || badge) && (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 11, fontWeight: 700, color: C.text2, letterSpacing: "1.5px", textTransform: "uppercase" }}>{title}</span>
        {badge}
      </div>
    )}
    {children}
  </div>
)

const Badge = ({ children, color = C.green, bg = "rgba(0,229,160,.12)", border = "rgba(0,229,160,.2)" }) => (
  <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 2, letterSpacing: ".5px", textTransform: "uppercase", background: bg, color, border: `1px solid ${border}` }}>{children}</span>
)

const catColor = c => ({
  Solar: { color: C.yellow, bg: "rgba(255,209,102,.12)", border: "rgba(255,209,102,.2)" },
  Wind: { color: C.blue, bg: "rgba(77,159,255,.12)", border: "rgba(77,159,255,.2)" },
  Hydro: { color: C.green, bg: "rgba(0,229,160,.12)", border: "rgba(0,229,160,.2)" },
  Biomass: { color: C.purple, bg: "rgba(167,139,250,.12)", border: "rgba(167,139,250,.2)" },
}[c] || { color: C.text2, bg: C.bg2, border: C.border })

const catIcon = c => ({ Solar: "☀️", Wind: "💨", Hydro: "💧", Biomass: "🌿" }[c] || "⚡")

const MarketplacePage = () => {
  const { user } = useContext(AuthContext);
  const currentUserId = user?.user?._id || user?._id;
  const isProsumer = user?.user?.userType === 'prosumer' || user?.userType === 'prosumer';
  const [openMenuId, setOpenMenuId] = useState(null);
  const [activeTab, setActiveTab] = useState('marketplace');
  const [myListings, setMyListings] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [showTransactionDetails, setShowTransactionDetails] = useState(null);
  const { isConnected: socketConnected, energyData: liveEnergyData, subscribeToEnergyData } = useSocket();
  const [userProfile, setUserProfile] = useState({ ETK: '--', totalTrades: '--', energyBalance: '--' });
  const [showCreateListingModal, setShowCreateListingModal] = useState(false);
  const [editingListing, setEditingListing] = useState(null);
  const [newListing, setNewListing] = useState({ title: "", location: "", capacity: "", price: "", category: "Solar", icon: "☀️" });
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);
  const [energyListings, setEnergyListings] = useState([]);
  const [opportunities, setOpportunities] = useState([]);

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
  }, [isProsumer, energyListings]);

  useEffect(() => {
    const go = async () => {
      try {
        const r = await fetch(apiUrl(`/listings?category=${selectedCategory !== "All" ? selectedCategory : ""}&search=${searchTerm}`));
        const d = await r.json();
        if (d.success) setEnergyListings(d.listings.map(l => ({ id: l._id, title: l.title, location: l.location, capacity: l.capacity, price: l.price, category: l.category, icon: l.icon, producer: l.producer?.name || 'Unknown', producerId: l.producer?._id || l.producer })));
      } catch {}
    }
    go();
  }, [selectedCategory, searchTerm]);

  useEffect(() => { subscribeToEnergyData(); }, [subscribeToEnergyData]);

  const resetForm = () => setNewListing({ title: "", location: "", capacity: "", price: "", category: "Solar", icon: "☀️" });

  const handleCreateListing = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      if (!token) return;
      const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
      if (editingListing) {
        const r = await fetch(apiUrl(`/listings/${editingListing.id}`), { method: 'PUT', headers, body: JSON.stringify({ ...newListing, price: parseFloat(newListing.price) }) });
        const d = await r.json();
        if (d.success) setEnergyListings(p => p.map(l => l.id === editingListing.id ? { id: d.listing._id, title: d.listing.title, location: d.listing.location, capacity: d.listing.capacity, price: d.listing.price, category: d.listing.category, icon: d.listing.icon, producer: d.listing.producer?.name || "User" } : l));
      } else {
        const r = await fetch(apiUrl('/listings'), { method: 'POST', headers, body: JSON.stringify({ ...newListing, price: parseFloat(newListing.price) }) });
        const d = await r.json();
        if (d.success) setEnergyListings(p => [...p, { id: d.listing._id, title: d.listing.title, location: d.listing.location, capacity: d.listing.capacity, price: d.listing.price, category: d.listing.category, icon: d.listing.icon, producer: d.listing.producer?.name || "User" }]);
      }
      resetForm(); setShowCreateListingModal(false); setEditingListing(null);
    } catch (err) { console.error(err); }
  };

  const handleEditListing = (l) => { setEditingListing(l); setNewListing({ title: l.title, location: l.location, capacity: l.capacity, price: l.price.toString(), category: l.category, icon: l.icon }); setShowCreateListingModal(true); };
  const handleRemoveListing = async (id) => {
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      if (!token) return;
      const r = await fetch(apiUrl(`/listings/${id}`), { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      const d = await r.json();
      if (d.success) setEnergyListings(p => p.filter(l => l.id !== id));
    } catch {}
  };

  const filteredListings = energyListings.filter(l =>
    (selectedCategory === "All" || l.category === selectedCategory) &&
    l.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const TABS_PROSUMER = [{ id: 'marketplace', label: '🌐 Marketplace' }, { id: 'dashboard', label: '📊 My Dashboard' }];
  const CATEGORIES = ["All", "Solar", "Wind", "Hydro", "Biomass"];

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'JetBrains Mono',monospace", fontSize: 13 }}>
      <style>{css}</style>
      <NavBar />

      {/* paddingTop: 52 = NavBar height */}
      <div style={{ paddingTop: 52 }}>

        {/* ── Top strip + hero — same as EnergyForecast ── */}
        <div style={{ background: "rgba(6,8,16,.97)", borderBottom: `1px solid ${C.border}`, padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 44, backdropFilter: "blur(20px)" }}>
          <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 15, color: C.green }}>
            EcoGrid <span style={{ color: C.text2, fontWeight: 400 }}>/ Energy Marketplace</span>
          </span>
          <span style={{ fontSize: 10, color: C.text3 }}>Trade Renewable Energy · Peer-to-Peer</span>
        </div>

        {/* Prosumer tab bar — same style as EnergyForecast's tab bar */}
        {isProsumer && (
          <div style={{ borderBottom: `1px solid ${C.border}`, padding: "0 20px", display: "flex", gap: 0, background: C.bg2 }}>
            {TABS_PROSUMER.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                style={{ padding: "11px 22px", border: "none", borderBottom: `2px solid ${activeTab === t.id ? C.green : "transparent"}`, background: "transparent", color: activeTab === t.id ? C.green : C.text2, fontFamily: "'JetBrains Mono',monospace", fontSize: 11, cursor: "pointer", transition: "all .2s" }}>
                {t.label}
              </button>
            ))}
          </div>
        )}

        {/* ── MY DASHBOARD TAB ── */}
        {isProsumer && activeTab === 'dashboard' && (
          <div style={{ padding: 20 }}>
            {/* Analytics */}
            <p style={{ fontFamily: "'Syne',sans-serif", fontSize: 11, fontWeight: 700, color: C.text2, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 12 }}>📈 Analytics</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 10, marginBottom: 20 }}>
              {[
                { label: "Listings", value: analytics?.totalListings ?? 0, color: C.green },
                { label: "ETK Earned", value: `${analytics?.totalETKEarned ?? 0}`, color: C.yellow },
                { label: "kWh Sold", value: `${analytics?.totalKwhSold ?? 0}`, color: C.red },
                { label: "Total Sales", value: analytics?.totalSales ?? 0, color: C.blue },
                { label: "Available", value: analytics?.statusBreakdown?.available ?? 0, color: C.green },
                { label: "Sold Out", value: analytics?.statusBreakdown?.sold_out ?? 0, color: C.red },
              ].map(({ label, value, color }) => (
                <motion.div key={label} whileHover={{ scale: 1.03, y: -2 }} style={{ background: C.bg3, border: `1px solid ${C.border}`, borderRadius: 6, padding: "12px 10px", textAlign: "center" }}>
                  <p style={{ fontSize: 9, color: C.text3, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>{label}</p>
                  <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 22, color, lineHeight: 1 }}>{value}</p>
                </motion.div>
              ))}
            </div>

            {/* My Listings */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <p style={{ fontFamily: "'Syne',sans-serif", fontSize: 11, fontWeight: 700, color: C.text2, letterSpacing: "1.5px", textTransform: "uppercase" }}>🗂 My Listings</p>
              <motion.button onClick={() => setShowCreateListingModal(true)} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                style={{ padding: "6px 14px", background: `${C.green}18`, border: `1px solid ${C.green}44`, borderRadius: 4, color: C.green, fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 10, letterSpacing: 1, textTransform: "uppercase", cursor: "pointer" }}>
                + New Listing
              </motion.button>
            </div>

            {myListings.length === 0 ? (
              <div style={{ background: C.bg3, border: `1px solid ${C.border}`, borderRadius: 6, padding: 40, textAlign: "center" }}>
                <p style={{ fontSize: 36, marginBottom: 10 }}>🌱</p>
                <p style={{ fontSize: 11, color: C.text2, textTransform: "uppercase", letterSpacing: 1 }}>No listings yet — create your first to start trading</p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 14, marginBottom: 24 }}>
                {myListings.map(listing => {
                  const avail = listing.availability === 'sold_out' ? { label: "Sold Out", color: C.red, bg: `${C.red}11` } : listing.availability === 'limited' ? { label: "Limited", color: C.yellow, bg: `${C.yellow}11` } : { label: "Available", color: C.green, bg: `${C.green}11` }
                  return (
                    <motion.div key={listing.id} whileHover={{ scale: 1.02, borderColor: C.border2 }} style={{ background: C.bg3, border: `1px solid ${C.border}`, borderRadius: 6, padding: 14, position: "relative", transition: "border-color .2s" }}>
                      <span style={{ position: "absolute", top: 10, right: 10, fontSize: 9, padding: "2px 6px", borderRadius: 2, textTransform: "uppercase", letterSpacing: ".5px", background: avail.bg, color: avail.color }}>{avail.label}</span>
                      <div style={{ fontSize: 32, marginBottom: 10 }}>{listing.icon}</div>
                      <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 3 }}>{listing.title}</p>
                      <p style={{ fontSize: 10, color: C.text3 }}>📍 {listing.location}</p>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 10 }}>
                        {[["Capacity", listing.capacity, C.text], ["Price", `${listing.price} ETK`, C.green]].map(([lbl, val, col]) => (
                          <div key={lbl} style={{ background: C.bg2, border: `1px solid ${C.border}`, padding: "7px 8px", borderRadius: 4 }}>
                            <p style={{ fontSize: 9, color: C.text3, textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 }}>{lbl}</p>
                            <p style={{ fontSize: 11, color: col, fontWeight: 600 }}>{val}</p>
                          </div>
                        ))}
                      </div>
                      <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                        <button onClick={() => handleEditListing(listing)} style={{ flex: 1, padding: "6px 0", borderRadius: 4, background: `${C.blue}11`, border: `1px solid ${C.blue}40`, color: C.blue, fontSize: 10, cursor: "pointer", fontFamily: "'JetBrains Mono',monospace" }}>✏ Edit</button>
                        <button onClick={() => handleRemoveListing(listing.id)} style={{ flex: 1, padding: "6px 0", borderRadius: 4, background: `${C.red}11`, border: `1px solid ${C.red}40`, color: C.red, fontSize: 10, cursor: "pointer", fontFamily: "'JetBrains Mono',monospace" }}>🗑 Remove</button>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}

            {/* Transaction table */}
            <p style={{ fontFamily: "'Syne',sans-serif", fontSize: 11, fontWeight: 700, color: C.text2, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 12 }}>📑 Transaction History</p>
            <div style={{ background: C.bg3, border: `1px solid ${C.border}`, borderRadius: 6, overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: C.bg2 }}>
                      {["Date", "Listing", "Type", "kWh", "ETK", "Status", "Tx Hash"].map(h => (
                        <th key={h} style={{ padding: "9px 14px", fontSize: 9, color: C.text3, textTransform: "uppercase", letterSpacing: 1, borderBottom: `1px solid ${C.border}`, textAlign: "left" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.length === 0 ? (
                      <tr><td colSpan={7} style={{ padding: "30px", textAlign: "center", color: C.text3, fontSize: 11 }}>No transactions yet.</td></tr>
                    ) : transactions.map((tx, i) => (
                      <tr key={tx._id || i} style={{ borderBottom: `1px solid rgba(30,36,64,.5)`, background: i % 2 ? "rgba(255,255,255,.01)" : "transparent" }}>
                        <td style={{ padding: "9px 14px", color: C.text2, fontSize: 11 }}>{new Date(tx.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                        <td style={{ padding: "9px 14px", color: C.text, fontSize: 11, maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tx.listingTitle || '—'}</td>
                        <td style={{ padding: "9px 14px" }}>
                          <Badge color={tx.type === 'bought' ? C.blue : C.green} bg={tx.type === 'bought' ? "rgba(77,159,255,.12)" : "rgba(0,229,160,.12)"} border={tx.type === 'bought' ? "rgba(77,159,255,.2)" : "rgba(0,229,160,.2)"}>
                            {tx.type === 'bought' ? '⬇ Bought' : '⬆ Sold'}
                          </Badge>
                        </td>
                        <td style={{ padding: "9px 14px", color: C.text, fontSize: 11 }}>{tx.energyKwh}</td>
                        <td style={{ padding: "9px 14px", color: C.yellow, fontSize: 11, fontWeight: 600 }}>{tx.amount}</td>
                        <td style={{ padding: "9px 14px" }}><Badge>{tx.status}</Badge></td>
                        <td style={{ padding: "9px 14px", fontSize: 11 }}>
                          {tx.txHash ? <a href={`https://amoy.polygonscan.com/tx/${tx.txHash}`} target="_blank" rel="noopener noreferrer" style={{ color: C.blue, textDecoration: "none", fontFamily: "'JetBrains Mono',monospace" }}>{tx.txHash.slice(0, 8)}…{tx.txHash.slice(-6)}</a> : <span style={{ color: C.text3 }}>—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── MARKETPLACE TAB ── */}
        {(activeTab === 'marketplace' || !isProsumer) && (
          <div style={{ padding: 20 }}>

            {/* Stats bar */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 20 }}>
              {[
                { icon: "💰", label: "ETK Earned", value: userProfile.ETK, color: C.yellow },
                { icon: "⚡", label: "Total Trades", value: userProfile.totalTrades, color: C.green },
                { icon: "🔋", label: "Energy Balance", value: userProfile.energyBalance, color: C.blue },
              ].map(({ icon, label, value, color }) => (
                <motion.div key={label} whileHover={{ scale: 1.02, y: -2 }} style={{ background: C.bg3, border: `1px solid ${C.border}`, borderRadius: 6, padding: "14px 16px", display: "flex", alignItems: "center", gap: 14 }}>
                  <span style={{ fontSize: 28 }}>{icon}</span>
                  <div>
                    <p style={{ fontSize: 9, color: C.text3, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>{label}</p>
                    <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 20, color, lineHeight: 1 }}>{value}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Search + filters */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
              <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
                <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.text3, fontSize: 13 }}>🔍</span>
                <input type="text" placeholder="Search listings..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px 8px 32px", background: C.bg3, border: `1px solid ${C.border2}`, borderRadius: 4, color: C.text, fontFamily: "'JetBrains Mono',monospace", fontSize: 12 }} />
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {CATEGORIES.map(cat => (
                  <motion.button key={cat} onClick={() => setSelectedCategory(cat)} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                    style={{ padding: "7px 14px", border: `1px solid ${selectedCategory === cat ? C.green : C.border}`, borderRadius: 4, background: selectedCategory === cat ? `${C.green}18` : C.bg3, color: selectedCategory === cat ? C.green : C.text2, fontFamily: "'JetBrains Mono',monospace", fontSize: 10, cursor: "pointer", transition: "all .15s" }}>
                    {catIcon(cat)} {cat}
                  </motion.button>
                ))}
                {isProsumer && (
                  <motion.button onClick={() => setShowCreateListingModal(true)} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                    style={{ padding: "7px 14px", border: `1px solid ${C.green}50`, borderRadius: 4, background: `${C.green}18`, color: C.green, fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 10, cursor: "pointer", letterSpacing: 1 }}>
                    + Create
                  </motion.button>
                )}
              </div>
            </div>

            {opportunities.length > 0 && (
              <>
                <p style={{ fontFamily: "'Syne',sans-serif", fontSize: 11, fontWeight: 700, color: C.text2, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 12 }}>Live Site Opportunities</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 14, marginBottom: 20 }}>
                  {opportunities.map((opportunity) => (
                    <motion.div key={opportunity.id} whileHover={{ scale: 1.02, y: -2 }} style={{ background: C.bg3, border: `1px solid ${opportunity.type === 'sell' ? C.green : C.yellow}`, borderRadius: 6, padding: 16 }}>
                      <Badge color={opportunity.type === 'sell' ? C.green : C.yellow} bg={opportunity.type === 'sell' ? "rgba(0,229,160,.12)" : "rgba(255,209,102,.12)"} border={opportunity.type === 'sell' ? "rgba(0,229,160,.2)" : "rgba(255,209,102,.2)"}>
                        {opportunity.type}
                      </Badge>
                      <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 14, color: C.text, marginTop: 10, marginBottom: 6 }}>{opportunity.title}</p>
                      <p style={{ fontSize: 10, color: C.text2, lineHeight: 1.6, marginBottom: 10 }}>{opportunity.message}</p>
                      <p style={{ fontSize: 10, color: C.text3 }}>Recommended Price</p>
                      <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 16, color: opportunity.type === 'sell' ? C.green : C.yellow }}>{opportunity.recommendedPrice} ETK</p>
                    </motion.div>
                  ))}
                </div>
              </>
            )}

            {/* Listings grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 14, marginBottom: 30 }}>
              {filteredListings.map(listing => {
                const cc = catColor(listing.category)
                return (
                  <motion.div key={listing.id} whileHover={{ scale: 1.02, borderColor: cc.color + "60" }}
                    style={{ background: C.bg3, border: `1px solid ${C.border}`, borderRadius: 6, padding: 16, position: "relative", transition: "border-color .2s", cursor: "default" }}>

                    {/* Owner menu */}
                    {currentUserId && listing.producerId?.toString() === currentUserId?.toString() && (
                      <div style={{ position: "absolute", top: 10, right: 10 }}>
                        <button onClick={e => { e.stopPropagation(); setOpenMenuId(openMenuId === listing.id ? null : listing.id); }}
                          style={{ background: "transparent", border: "none", cursor: "pointer", color: C.text3, fontSize: 16, lineHeight: 1 }}>⋮</button>
                        {openMenuId === listing.id && (
                          <div style={{ position: "absolute", right: 0, top: 22, width: 160, background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 5, zIndex: 20, boxShadow: "0 10px 30px rgba(0,0,0,.5)" }}>
                            <button onClick={e => { e.stopPropagation(); setOpenMenuId(null); handleEditListing(listing); }} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "9px 12px", background: "transparent", border: "none", color: C.text, fontSize: 11, cursor: "pointer", fontFamily: "'JetBrains Mono',monospace" }}>✏ Edit Listing</button>
                            <button onClick={e => { e.stopPropagation(); setOpenMenuId(null); handleRemoveListing(listing.id); }} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "9px 12px", background: "transparent", border: "none", color: C.red, fontSize: 11, cursor: "pointer", fontFamily: "'JetBrains Mono',monospace" }}>🗑 Remove</button>
                          </div>
                        )}
                      </div>
                    )}

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 5, background: C.bg2, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>{listing.icon}</div>
                      <Badge color={cc.color} bg={cc.bg} border={cc.border}>{listing.category}</Badge>
                    </div>
                    <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 15, color: C.text, marginBottom: 4 }}>{listing.title}</p>
                    <p style={{ fontSize: 10, color: C.text3, marginBottom: 12 }}>📍 {listing.location}</p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 14 }}>
                      {[["Capacity", listing.capacity, C.text], ["Price", `${listing.price} ETK`, C.green], ["Producer", listing.producer, C.text], ["Type", listing.category, cc.color]].map(([lbl, val, col]) => (
                        <div key={lbl} style={{ background: C.bg2, border: `1px solid ${C.border}`, padding: "7px 8px", borderRadius: 4 }}>
                          <p style={{ fontSize: 9, color: C.text3, textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 }}>{lbl}</p>
                          <p style={{ fontSize: 11, color: col, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{val}</p>
                        </div>
                      ))}
                    </div>
                    <motion.button
                      onClick={() => { setSelectedListing(listing); setShowTradeModal(true); }}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      style={{ width: "100%", padding: "9px 0", background: `${C.green}18`, border: `1px solid ${C.green}50`, borderRadius: 4, color: C.green, fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: 1, textTransform: "uppercase", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                      ⚡ Trade Energy
                    </motion.button>
                  </motion.div>
                )
              })}
            </div>

            {filteredListings.length === 0 && (
              <div style={{ background: C.bg3, border: `1px solid ${C.border}`, borderRadius: 6, padding: 60, textAlign: "center" }}>
                <p style={{ fontSize: 40, marginBottom: 12 }}>🔍</p>
                <p style={{ fontSize: 13, color: C.text2, marginBottom: 6 }}>No listings found</p>
                <p style={{ fontSize: 10, color: C.text3, marginBottom: 14 }}>Try adjusting your search or category filter</p>
                <motion.button onClick={() => { setSearchTerm(''); setSelectedCategory('All'); }} whileHover={{ scale: 1.04 }}
                  style={{ padding: "7px 18px", background: `${C.green}18`, border: `1px solid ${C.green}44`, borderRadius: 4, color: C.green, fontSize: 11, cursor: "pointer", fontFamily: "'JetBrains Mono',monospace" }}>
                  Reset Filters
                </motion.button>
              </div>
            )}

            {/* Transaction history */}
            <p style={{ fontFamily: "'Syne',sans-serif", fontSize: 11, fontWeight: 700, color: C.text2, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 12 }}>Transaction History</p>
            <div style={{ background: C.bg3, border: `1px solid ${C.border}`, borderRadius: 6, overflow: "hidden", marginBottom: 20 }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: C.bg2 }}>
                      {["ID", "Date", "Type", "Energy", "Price", "Status", "Actions"].map(h => (
                        <th key={h} style={{ padding: "9px 14px", fontSize: 9, color: C.text3, textTransform: "uppercase", letterSpacing: 1, borderBottom: `1px solid ${C.border}`, textAlign: "left" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.length === 0 ? (
                      <tr><td colSpan={7} style={{ padding: 30, textAlign: "center", color: C.text3, fontSize: 11 }}>No transactions yet.</td></tr>
                    ) : transactions.map((tx, i) => (
                      <motion.tr key={tx._id} whileHover={{ backgroundColor: C.bg2 }} style={{ borderBottom: `1px solid rgba(30,36,64,.5)`, cursor: "default", background: i % 2 ? "rgba(255,255,255,.01)" : "transparent" }}>
                        <td style={{ padding: "9px 14px", color: C.text3, fontSize: 11, fontFamily: "'JetBrains Mono',monospace" }}>{tx._id?.slice(-6).toUpperCase() || '—'}</td>
                        <td style={{ padding: "9px 14px", color: C.text2, fontSize: 11 }}>{tx.timestamp ? new Date(tx.timestamp).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : '—'}</td>
                        <td style={{ padding: "9px 14px" }}>
                          <Badge color={tx.type === 'sold' ? C.green : C.blue} bg={tx.type === 'sold' ? "rgba(0,229,160,.12)" : "rgba(77,159,255,.12)"} border={tx.type === 'sold' ? "rgba(0,229,160,.2)" : "rgba(77,159,255,.2)"}>
                            {tx.type === 'sold' ? '⬆ Sale' : '⬇ Purchase'}
                          </Badge>
                        </td>
                        <td style={{ padding: "9px 14px", color: C.text, fontSize: 11 }}>⚡ {tx.energyKwh ?? '—'} kWh</td>
                        <td style={{ padding: "9px 14px", color: C.yellow, fontWeight: 600, fontSize: 11 }}>{tx.amount ?? '—'} ETK</td>
                        <td style={{ padding: "9px 14px" }}><Badge>Completed</Badge></td>
                        <td style={{ padding: "9px 14px" }}>
                          <button onClick={() => setShowTransactionDetails(tx._id === showTransactionDetails ? null : tx._id)}
                            style={{ background: "transparent", border: "none", color: C.blue, fontSize: 11, cursor: "pointer", fontFamily: "'JetBrains Mono',monospace" }}>
                            Details
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Trade Modal */}
      <TradeModal isOpen={showTradeModal} onClose={() => { setShowTradeModal(false); setSelectedListing(null); }} listing={selectedListing}
        onTradeComplete={async (txHash) => {
          handlesuccess(`Trade completed! Tx: ${txHash.slice(0, 10)}...`);
          try {
            const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
            const r = await fetch(apiUrl('/user/transactions'), { headers: { Authorization: `Bearer ${token}` } });
            const d = await r.json();
            if (d.success) {
              const etk = d.transactions.filter(t => t.type === 'sold').reduce((s, t) => s + (Number(t.amount) || 0), 0);
              const kwh = d.transactions.filter(t => t.type === 'bought').reduce((s, t) => s + (Number(t.energyKwh) || 0), 0);
              setTransactions(d.transactions);
              setUserProfile({ ETK: etk.toFixed(1), totalTrades: d.transactions.length, energyBalance: `${kwh.toFixed(1)} kWh` });
            }
          } catch {}
        }}
      />

      {/* Create/Edit Listing Modal */}
      <AnimatePresence>
        {showCreateListingModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.75)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 99, padding: 16 }}
            onClick={() => { setShowCreateListingModal(false); setEditingListing(null); resetForm(); }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 8, padding: 24, maxWidth: 440, width: "100%", boxShadow: "0 40px 80px rgba(0,0,0,.8)" }}
              onClick={e => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, paddingBottom: 14, borderBottom: `1px solid ${C.border}` }}>
                <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 14, color: C.text }}>{editingListing ? '✏ Edit Listing' : '+ New Energy Listing'}</span>
                <button onClick={() => { setShowCreateListingModal(false); setEditingListing(null); resetForm(); }}
                  style={{ background: "transparent", border: "none", color: C.text3, cursor: "pointer", fontSize: 18, lineHeight: 1 }}>✕</button>
              </div>
              <form onSubmit={handleCreateListing} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {[
                  { label: "Title", name: "title", placeholder: "Solar Surplus", type: "text" },
                  { label: "Location", name: "location", placeholder: "City, State", type: "text" },
                ].map(({ label, name, placeholder, type }) => (
                  <div key={name}>
                    <p style={{ fontSize: 9, color: C.text3, textTransform: "uppercase", letterSpacing: 1, marginBottom: 5 }}>{label}</p>
                    <input type={type} name={name} value={newListing[name]} onChange={e => setNewListing(p => ({ ...p, [name]: e.target.value }))} placeholder={placeholder} required
                      style={{ width: "100%", padding: "8px 12px", background: C.bg3, border: `1px solid ${C.border2}`, borderRadius: 4, color: C.text, fontFamily: "'JetBrains Mono',monospace", fontSize: 12 }} />
                  </div>
                ))}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <p style={{ fontSize: 9, color: C.text3, textTransform: "uppercase", letterSpacing: 1, marginBottom: 5 }}>Capacity</p>
                    <input type="text" name="capacity" value={newListing.capacity} onChange={e => setNewListing(p => ({ ...p, capacity: e.target.value }))} placeholder="1 kWh" required
                      style={{ width: "100%", padding: "8px 12px", background: C.bg3, border: `1px solid ${C.border2}`, borderRadius: 4, color: C.text, fontFamily: "'JetBrains Mono',monospace", fontSize: 12 }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 9, color: C.text3, textTransform: "uppercase", letterSpacing: 1, marginBottom: 5 }}>Price (ETK)</p>
                    <input type="number" name="price" value={newListing.price} onChange={e => setNewListing(p => ({ ...p, price: e.target.value }))} placeholder="20" required
                      style={{ width: "100%", padding: "8px 12px", background: C.bg3, border: `1px solid ${C.border2}`, borderRadius: 4, color: C.text, fontFamily: "'JetBrains Mono',monospace", fontSize: 12 }} />
                  </div>
                </div>
                <div>
                  <p style={{ fontSize: 9, color: C.text3, textTransform: "uppercase", letterSpacing: 1, marginBottom: 5 }}>Category</p>
                  <select value={newListing.category}
                    onChange={e => { const c = e.target.value; const icons = { Solar: '☀️', Wind: '💨', Hydro: '💧', Biomass: '🌿' }; setNewListing(p => ({ ...p, category: c, icon: icons[c] || '⚡' })); }}
                    style={{ width: "100%", padding: "8px 12px", background: C.bg3, border: `1px solid ${C.border2}`, borderRadius: 4, color: C.text, fontFamily: "'JetBrains Mono',monospace", fontSize: 12 }}>
                    <option value="Solar">☀️ Solar</option>
                    <option value="Wind">💨 Wind</option>
                    <option value="Hydro">💧 Hydro</option>
                    <option value="Biomass">🌿 Biomass</option>
                  </select>
                </div>
                <motion.button type="submit" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  style={{ padding: "10px 0", background: `linear-gradient(135deg,${C.green},#00b4d8)`, border: "none", borderRadius: 4, color: "#060810", fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: 1, textTransform: "uppercase", cursor: "pointer", marginTop: 4 }}>
                  {editingListing ? '✅ Update Listing' : '🌱 Create Listing'}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <div style={{ borderTop: `1px solid ${C.border}`, padding: "10px 24px", display: "flex", justifyContent: "space-between", fontSize: 10, color: C.text3 }}>
        <span style={{ color: C.text2 }}>EcoGrid · Energy Marketplace</span>
        <span>© {new Date().getFullYear()}</span>
      </div>
    </div>
  );
};

export default MarketplacePage;
