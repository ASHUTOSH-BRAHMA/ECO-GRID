// NotFound.jsx — Custom animated 404 page
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Zap, Home, ArrowLeft, Search } from "lucide-react";

const C = {
  bg: "#060810", bg2: "#0c0f1a", border: "#1e2440",
  text: "#e8eaf6", text2: "#8892b0", text3: "#4a5568",
  green: "#00e5a0", blue: "#4d9fff",
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=JetBrains+Mono:wght@300;400&display=swap');
  @keyframes glitch1{0%,100%{clip-path:inset(40% 0 61% 0);transform:translate(-2px,0)}20%{clip-path:inset(92% 0 1% 0)}40%{clip-path:inset(43% 0 1% 0);transform:translate(2px,0)}60%{clip-path:inset(25% 0 58% 0)}80%{clip-path:inset(54% 0 7% 0)}}
  @keyframes glitch2{0%,100%{clip-path:inset(78% 0 3% 0);transform:translate(2px,0)}20%{clip-path:inset(1% 0 30% 0)}40%{clip-path:inset(67% 0 14% 0);transform:translate(-2px,0)}60%{clip-path:inset(5% 0 67% 0)}80%{clip-path:inset(12% 0 74% 0)}}
  @keyframes scanLine{0%{top:-4px}100%{top:100%}}
  @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
  * { box-sizing: border-box; }
`;

const GlitchText = ({ text, color }) => (
  <div style={{ position: "relative", display: "inline-block" }}>
    <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "clamp(6rem,18vw,11rem)", color, lineHeight: 1, position: "relative", display: "block" }}>
      {text}
      <span style={{ position: "absolute", top: 0, left: 0, color, animation: "glitch1 3.5s infinite linear alternate-reverse", fontFamily: "inherit", fontSize: "inherit", fontWeight: "inherit", lineHeight: "inherit", filter: "drop-shadow(2px 0 #ff4d6d)" }}>{text}</span>
      <span style={{ position: "absolute", top: 0, left: 0, color, animation: "glitch2 3s infinite linear alternate", fontFamily: "inherit", fontSize: "inherit", fontWeight: "inherit", lineHeight: "inherit", filter: "drop-shadow(-2px 0 #4d9fff)" }}>{text}</span>
    </span>
  </div>
);

const links = [
  { label: "Home", to: "/", icon: Home },
  { label: "Dashboard", to: "/dashboard", icon: Zap },
  { label: "Marketplace", to: "/marketplace", icon: Search },
];

export default function NotFound() {
  const [dots, setDots] = useState(".");
  useEffect(() => { const iv = setInterval(() => setDots(d => d.length >= 3 ? "." : d + "."), 500); return () => clearInterval(iv); }, []);

  return (
    <>
      <style>{css}</style>
      {/* Scan line */}
      <div style={{ position: "fixed", left: 0, right: 0, height: 1, background: `linear-gradient(90deg,transparent,${C.green}25,transparent)`, animation: "scanLine 8s linear infinite", zIndex: 1, pointerEvents: "none" }} />

      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px", fontFamily: "'JetBrains Mono',monospace", overflow: "hidden", position: "relative" }}>

        {/* Background glow */}
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 600, height: 600, background: `radial-gradient(circle, ${C.green}07 0%, transparent 70%)`, pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: "20%", right: "10%", width: 300, height: 300, background: `radial-gradient(circle, ${C.blue}07 0%, transparent 70%)`, pointerEvents: "none" }} />

        {/* Grid lines */}
        {[...Array(8)].map((_, i) => (
          <div key={i} style={{ position: "absolute", left: `${i * 14}%`, top: 0, bottom: 0, width: 1, background: "#ffffff03", pointerEvents: "none" }} />
        ))}

        {/* Top brand */}
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
          style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 48 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: `${C.green}20`, border: `1px solid ${C.green}40`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Zap size={16} style={{ color: C.green }} />
          </div>
          <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 18, color: C.text }}>EcoGrid</span>
        </motion.div>

        {/* 404 Glitch */}
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 120, delay: 0.2 }}
          style={{ animation: "float 5s ease-in-out infinite", marginBottom: 24 }}>
          <GlitchText text="404" color={C.green} />
        </motion.div>

        {/* Terminal-style message */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 8, padding: "20px 28px", marginBottom: 28, maxWidth: 520, width: "100%", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${C.green}, transparent)` }} />
          <p style={{ fontSize: 10, color: C.text3, textTransform: "uppercase", letterSpacing: 2, marginBottom: 10 }}>EcoGrid // system error</p>
          <p style={{ fontSize: 13, color: C.text, marginBottom: 6 }}>
            <span style={{ color: C.green }}>ERROR:</span> Grid node not found{dots}
          </p>
          <p style={{ fontSize: 12, color: C.text2, lineHeight: 1.7 }}>
            The energy node you were looking for has been decommissioned, moved, or never existed. Check your grid coordinates and try again.
          </p>
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${C.border}`, fontSize: 10, color: C.text3 }}>
            <span style={{ color: C.green }}>$</span> node_resolve --path "/{window.location.pathname.replace(/^\//, "")}" --status <span style={{ color: "#ff4d6d" }}>NOT_FOUND</span>
          </div>
        </motion.div>

        {/* Navigation options */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
          style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", marginBottom: 28 }}>
          {links.map(({ label, to, icon: Icon }) => (
            <Link key={to} to={to}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 6, color: C.text2, fontSize: 12, textDecoration: "none", transition: "border-color .2s, color .2s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.green + "60"; e.currentTarget.style.color = C.green; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.text2; }}>
              <Icon size={13} /> {label}
            </Link>
          ))}
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
          <Link to={-1} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11, color: C.text3, textDecoration: "none" }}
            onMouseEnter={e => e.currentTarget.style.color = C.text}
            onMouseLeave={e => e.currentTarget.style.color = C.text3}>
            <ArrowLeft size={12} /> Go back to previous page
          </Link>
        </motion.div>
      </div>
    </>
  );
}
