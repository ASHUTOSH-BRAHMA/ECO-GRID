import { useState, useEffect, useRef } from "react"
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion"
import { ChevronRight, ChevronLeft, Sun, Wind, Zap, Home, BarChart3, Shield, ArrowRight, Twitter, Facebook, Instagram, Linkedin } from "lucide-react"
import NavBar from "./NavBar"

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
  @keyframes floatUp{0%{transform:translateY(0px);opacity:.18}100%{transform:translateY(-110px);opacity:0}}
  @keyframes gridScroll{0%{background-position:0 0}100%{background-position:0 60px}}
  @keyframes scanLine{0%{top:-4px}100%{top:100%}}
  *{box-sizing:border-box}
  ::-webkit-scrollbar{width:3px}
  ::-webkit-scrollbar-track{background:#060810}
  ::-webkit-scrollbar-thumb{background:#2a3155;border-radius:2px}
`

// ── Shared primitives ─────────────────────────────────────────────────────────
const SectionLabel = ({ children }) => (
  <div style={{ display: "inline-flex", alignItems: "center", gap: 7, marginBottom: 14 }}>
    <div style={{ width: 20, height: 1, background: C.green }} />
    <span style={{ fontSize: 10, color: C.green, textTransform: "uppercase", letterSpacing: 2, fontFamily: "'JetBrains Mono',monospace" }}>{children}</span>
    <div style={{ width: 20, height: 1, background: C.green }} />
  </div>
)

const Card = ({ children, style = {} }) => (
  <div style={{ background: C.bg3, border: `1px solid ${C.border}`, borderRadius: 6, padding: 20, overflow: "hidden", ...style }}>
    {children}
  </div>
)

const Dot = ({ color = C.green }) => (
  <div style={{ width: 6, height: 6, borderRadius: "50%", background: color, animation: "pulse2 2s infinite" }} />
)

// ── Floating particles ────────────────────────────────────────────────────────
const Particles = () => (
  <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
    {["⚡", "🌱", "🔋", "☀", "💨", "💧", "⚡", "🌿"].map((icon, i) => (
      <span key={i} style={{
        position: "absolute", fontSize: 16, opacity: 0,
        left: `${8 + i * 12}%`, bottom: "5%",
        animation: `floatUp ${10 + i * 2}s linear ${i * 1.8}s infinite`,
      }}>{icon}</span>
    ))}
  </div>
)

// ── Animated grid bg ──────────────────────────────────────────────────────────
const GridBg = ({ children, style = {} }) => (
  <div style={{
    position: "relative", overflow: "hidden", ...style,
    backgroundImage: `linear-gradient(${C.border} 1px, transparent 1px), linear-gradient(90deg, ${C.border} 1px, transparent 1px)`,
    backgroundSize: "60px 60px",
    animation: "gridScroll 8s linear infinite",
  }}>
    {/* fade overlay */}
    <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to bottom, transparent 60%, ${C.bg})`, pointerEvents: "none", zIndex: 1 }} />
    <div style={{ position: "relative", zIndex: 2 }}>{children}</div>
  </div>
)

const LandingPage = () => {
  const [showCTA, setShowCTA] = useState(false)
  const [currentTestimonial, setCurrentTestimonial] = useState(0)
  const [hoveredFeature, setHoveredFeature] = useState(null)
  const heroRef = useRef(null)

  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] })
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0])
  const heroY = useTransform(scrollYProgress, [0, 0.6], [0, 60])

  useEffect(() => { const t = setTimeout(() => setShowCTA(true), 1400); return () => clearTimeout(t) }, [])
  useEffect(() => {
    const t = setInterval(() => setCurrentTestimonial(p => (p + 1) % testimonials.length), 6000)
    return () => clearInterval(t)
  }, [])

  const testimonials = [
    { quote: "EcoGrid has reduced our energy costs by 35% while helping us go green.", author: "Sarah Johnson", title: "Community Solar Manager" },
    { quote: "The AI forecasting feature has revolutionized how we manage our microgrid.", author: "Michael Chen", title: "Energy Consultant" },
    { quote: "Seamless integration with our existing infrastructure. Worth every penny.", author: "Lisa Rodriguez", title: "Sustainability Director" },
  ]

  const features = [
    { title: "AI-Driven Forecasting", desc: "Predict energy demand with LSTM neural networks trained on real weather and grid data.", icon: <BarChart3 size={22} />, color: C.purple, bg: "rgba(167,139,250,.12)" },
    { title: "Blockchain Trading", desc: "Secure P2P energy transactions via Polygon smart contracts and ERC-20 tokens.", icon: <Shield size={22} />, color: C.blue, bg: "rgba(77,159,255,.12)" },
    { title: "Smart Grid Optimization", desc: "Real-time monitoring and automated demand-response for optimal distribution.", icon: <Zap size={22} />, color: C.green, bg: "rgba(0,229,160,.12)" },
  ]

  const stats = [
    { value: "150+", label: "Communities Powered", icon: <Home size={18} />, color: C.green },
    { value: "35%", label: "Avg Cost Reduction", icon: <BarChart3 size={18} />, color: C.yellow },
    { value: "45K", label: "Tonnes CO₂ Saved", icon: <Wind size={18} />, color: C.blue },
  ]

  const steps = [
    { title: "Energy Production", desc: "Solar, wind, and hydro sources feed clean energy into the grid.", icon: <Sun size={20} />, color: C.yellow },
    { title: "AI Processing", desc: "LSTM models forecast demand, detect anomalies, and set optimal pricing.", icon: <BarChart3 size={20} />, color: C.purple },
    { title: "Peer Trading", desc: "Consumers and prosumers trade directly via smart contracts.", icon: <Zap size={20} />, color: C.green },
  ]

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'JetBrains Mono',monospace", overflowX: "hidden" }}>
      <style>{css}</style>
      <NavBar />

      {/* ══════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════ */}
      <motion.section ref={heroRef} style={{ opacity: heroOpacity, y: heroY, position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", paddingTop: 52, overflow: "hidden" }}>
        <GridBg style={{ position: "absolute", inset: 0, background: C.bg }} />
        <Particles />

        {/* Glow orbs */}
        <div style={{ position: "absolute", top: "25%", left: "50%", transform: "translate(-50%,-50%)", width: 700, height: 700, background: `radial-gradient(circle, ${C.green}0d 0%, transparent 70%)`, pointerEvents: "none", zIndex: 2 }} />
        <div style={{ position: "absolute", top: "60%", left: "20%", width: 300, height: 300, background: `radial-gradient(circle, ${C.blue}0a 0%, transparent 70%)`, pointerEvents: "none", zIndex: 2 }} />
        <div style={{ position: "absolute", top: "40%", right: "10%", width: 250, height: 250, background: `radial-gradient(circle, ${C.purple}0a 0%, transparent 70%)`, pointerEvents: "none", zIndex: 2 }} />

        {/* Scan line */}
        <div style={{ position: "absolute", left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${C.green}30, transparent)`, animation: "scanLine 6s linear infinite", zIndex: 3, pointerEvents: "none" }} />

        <div style={{ position: "relative", zIndex: 10, maxWidth: 860, padding: "0 24px" }}>
          {/* Status pill */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, background: C.bg3, border: `1px solid ${C.border}`, borderRadius: 20, padding: "5px 14px", marginBottom: 28, fontSize: 10, color: C.text2 }}>
            <Dot /> <span>System Online</span>
            <span style={{ width: 1, height: 10, background: C.border }} />
            <span style={{ color: C.green }}>v2.0 Live</span>
          </motion.div>

          {/* Logo icon */}
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3, type: "spring", stiffness: 120 }}
            style={{ marginBottom: 24 }}>
            <motion.div
              animate={{ y: [0, -10, 0], rotate: [0, 4, 0, -4, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              style={{ width: 80, height: 80, margin: "0 auto", background: `${C.green}15`, border: `1px solid ${C.green}40`, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 40px ${C.green}20` }}>
              <Zap size={36} color={C.green} />
            </motion.div>
          </motion.div>

          {/* Headline */}
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.8 }}
            style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "clamp(3rem, 8vw, 6rem)", lineHeight: 1.05, marginBottom: 20 }}>
            <span style={{ color: C.text }}>Eco</span>
            <span style={{ color: C.green }}>Grid</span>
            <br />
            <span style={{ fontSize: "clamp(1.4rem, 3.5vw, 2.6rem)", fontWeight: 600, color: C.text2 }}>
              Renewable Energy, <span style={{ color: C.text }}>Reimagined</span>
            </span>
          </motion.h1>

          {/* Sub */}
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6, duration: 0.8 }}
            style={{ fontSize: 15, color: C.text2, maxWidth: 560, margin: "0 auto 36px", lineHeight: 1.7 }}>
            AI-powered forecasting · Blockchain P2P trading · Real-time smart grid monitoring. Built for a sustainable future.
          </motion.p>

          {/* CTA buttons */}
          <AnimatePresence>
            {showCTA && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                <motion.button whileHover={{ scale: 1.04, boxShadow: `0 0 30px ${C.green}40` }} whileTap={{ scale: 0.97 }}
                  style={{ padding: "12px 28px", background: `linear-gradient(135deg, ${C.green}, #00b4d8)`, border: "none", borderRadius: 5, color: "#060810", fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: 1, textTransform: "uppercase", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                  Get Started <ArrowRight size={16} />
                </motion.button>
                <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                  style={{ padding: "12px 28px", background: "transparent", border: `1px solid ${C.border2}`, borderRadius: 5, color: C.text2, fontFamily: "'JetBrains Mono',monospace", fontSize: 13, cursor: "pointer" }}>
                  Learn More
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tech stack pills */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
            style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginTop: 40 }}>
            {["LSTM Neural Nets", "Polygon Blockchain", "Socket.io Live", "XGBoost Demand"].map(tag => (
              <span key={tag} style={{ fontSize: 9, padding: "3px 10px", background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 2, color: C.text3, textTransform: "uppercase", letterSpacing: 1 }}>{tag}</span>
            ))}
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity }}
          style={{ position: "absolute", bottom: 28, left: "50%", transform: "translateX(-50%)", zIndex: 10 }}>
          <div style={{ width: 28, height: 28, border: `1px solid ${C.border2}`, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ChevronRight size={14} color={C.text3} style={{ transform: "rotate(90deg)" }} />
          </div>
        </motion.div>
      </motion.section>

      {/* ══════════════════════════════════════════════════
          STATS COUNTER
      ══════════════════════════════════════════════════ */}
      <section style={{ padding: "80px 24px", background: C.bg2, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16 }}>
          {stats.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15, duration: 0.6 }}
              whileHover={{ scale: 1.03, borderColor: s.color + "60" }}
              style={{ background: C.bg3, border: `1px solid ${C.border}`, borderRadius: 6, padding: "22px 20px", textAlign: "center", transition: "border-color .2s" }}>
              <div style={{ width: 44, height: 44, margin: "0 auto 12px", borderRadius: "50%", background: `${s.color}15`, border: `1px solid ${s.color}30`, display: "flex", alignItems: "center", justifyContent: "center", color: s.color }}>
                {s.icon}
              </div>
              <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 36, color: s.color, lineHeight: 1, marginBottom: 6 }}>{s.value}</p>
              <p style={{ fontSize: 10, color: C.text2, textTransform: "uppercase", letterSpacing: 1 }}>{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════════════════ */}
      <section style={{ padding: "100px 24px", background: C.bg }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: "center", marginBottom: 60 }}>
            <SectionLabel>How It Works</SectionLabel>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "clamp(1.8rem,4vw,2.8rem)", color: C.text, marginBottom: 12 }}>From Source to Smart Trade</h2>
            <p style={{ fontSize: 13, color: C.text2, maxWidth: 500, margin: "0 auto" }}>Our platform connects renewable energy producers to consumers through a transparent, automated pipeline.</p>
          </motion.div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 16, position: "relative" }}>
            {/* Connector line (desktop only) */}
            <div style={{ position: "absolute", top: 44, left: "16.5%", right: "16.5%", height: 1, background: `linear-gradient(90deg, ${C.yellow}60, ${C.purple}60, ${C.green}60)`, display: "none" }} className="connector" />

            {steps.map((step, i) => (
              <motion.div key={step.title} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.2 }}
                whileHover={{ y: -4 }}
                style={{ background: C.bg3, border: `1px solid ${C.border}`, borderRadius: 6, padding: 24, textAlign: "center", position: "relative" }}>
                {/* Step number */}
                <div style={{ position: "absolute", top: 12, right: 14, fontSize: 9, color: C.text3, fontFamily: "'JetBrains Mono',monospace" }}>0{i + 1}</div>
                {/* Icon */}
                <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 3 + i, repeat: Infinity, ease: "easeInOut" }}
                  style={{ width: 56, height: 56, margin: "0 auto 16px", borderRadius: 8, background: `${step.color}15`, border: `1px solid ${step.color}40`, display: "flex", alignItems: "center", justifyContent: "center", color: step.color }}>
                  {step.icon}
                </motion.div>
                <h3 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 15, color: C.text, marginBottom: 8 }}>{step.title}</h3>
                <p style={{ fontSize: 12, color: C.text2, lineHeight: 1.6 }}>{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          FEATURES
      ══════════════════════════════════════════════════ */}
      <section style={{ padding: "100px 24px", background: C.bg2, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: "center", marginBottom: 60 }}>
            <SectionLabel>Key Features</SectionLabel>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "clamp(1.8rem,4vw,2.8rem)", color: C.text, marginBottom: 12 }}>Built for the Energy Stack</h2>
            <p style={{ fontSize: 13, color: C.text2, maxWidth: 500, margin: "0 auto" }}>Cutting-edge ML, blockchain, and IoT technology woven into one platform.</p>
          </motion.div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 16 }}>
            {features.map((f, i) => (
              <motion.div key={f.title}
                initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}
                whileHover={{ y: -6, borderColor: f.color + "60" }}
                onHoverStart={() => setHoveredFeature(i)} onHoverEnd={() => setHoveredFeature(null)}
                style={{ background: C.bg3, border: `1px solid ${C.border}`, borderRadius: 6, padding: 24, overflow: "hidden", position: "relative", cursor: "default", transition: "border-color .2s" }}>
                {/* Top accent bar */}
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${f.color}, transparent)` }} />
                <motion.div animate={hoveredFeature === i ? { scale: 1.15, rotate: 5 } : { scale: 1, rotate: 0 }} transition={{ duration: 0.3 }}
                  style={{ width: 52, height: 52, borderRadius: 8, background: f.bg, border: `1px solid ${f.color}40`, display: "flex", alignItems: "center", justifyContent: "center", color: f.color, marginBottom: 18 }}>
                  {f.icon}
                </motion.div>
                <h3 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 10 }}>{f.title}</h3>
                <p style={{ fontSize: 12, color: C.text2, lineHeight: 1.7, marginBottom: 18 }}>{f.desc}</p>
                <motion.div animate={hoveredFeature === i ? { x: 6 } : { x: 0 }} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: f.color }}>
                  <span>Learn more</span><ArrowRight size={13} />
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          TECH STACK STRIP
      ══════════════════════════════════════════════════ */}
      <section style={{ padding: "60px 24px", background: C.bg }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} style={{ textAlign: "center", marginBottom: 36 }}>
            <SectionLabel>Tech Stack</SectionLabel>
          </motion.div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 10 }}>
            {[
              { name: "React + Vite", icon: "⚛", color: C.blue },
              { name: "Node.js / Express", icon: "🟢", color: C.green },
              { name: "MongoDB", icon: "🍃", color: C.green },
              { name: "Polygon Amoy", icon: "🔷", color: C.purple },
              { name: "LSTM / Keras", icon: "🧠", color: C.yellow },
              { name: "XGBoost", icon: "📊", color: C.red },
              { name: "Socket.io", icon: "⚡", color: C.yellow },
              { name: "Flask ML", icon: "🔬", color: C.blue },
            ].map((tech, i) => (
              <motion.div key={tech.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}
                whileHover={{ scale: 1.05, borderColor: tech.color + "60" }}
                style={{ background: C.bg3, border: `1px solid ${C.border}`, borderRadius: 6, padding: "14px 12px", textAlign: "center", cursor: "default", transition: "border-color .2s" }}>
                <span style={{ fontSize: 22, display: "block", marginBottom: 7 }}>{tech.icon}</span>
                <p style={{ fontSize: 10, color: C.text2, textTransform: "uppercase", letterSpacing: 1 }}>{tech.name}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          TESTIMONIALS
      ══════════════════════════════════════════════════ */}
      <section style={{ padding: "100px 24px", background: C.bg2, borderTop: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: "center", marginBottom: 52 }}>
            <SectionLabel>Testimonials</SectionLabel>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "clamp(1.8rem,4vw,2.8rem)", color: C.text, marginBottom: 10 }}>What Our Users Say</h2>
          </motion.div>

          {/* Carousel */}
          <div style={{ position: "relative", minHeight: 200 }}>
            <AnimatePresence mode="wait">
              {testimonials.map((t, i) => currentTestimonial === i && (
                <motion.div key={i} initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -60 }} transition={{ duration: 0.4 }}
                  style={{ background: C.bg3, border: `1px solid ${C.border}`, borderRadius: 6, padding: 28 }}>
                  {/* Quote mark */}
                  <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 60, color: C.green, lineHeight: 0.6, marginBottom: 18, opacity: 0.3 }}>"</div>
                  <p style={{ fontSize: 15, color: C.text, lineHeight: 1.7, marginBottom: 22, fontStyle: "italic" }}>{t.quote}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 38, height: 38, borderRadius: "50%", background: `${C.green}20`, border: `1px solid ${C.green}40`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 16, color: C.green }}>
                      {t.author.charAt(0)}
                    </div>
                    <div>
                      <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 13, color: C.text }}>{t.author}</p>
                      <p style={{ fontSize: 10, color: C.text3 }}>{t.title}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Controls */}
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 16, marginTop: 24 }}>
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setCurrentTestimonial(p => (p - 1 + testimonials.length) % testimonials.length)}
              style={{ width: 36, height: 36, borderRadius: "50%", background: C.bg3, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.text2 }}>
              <ChevronLeft size={16} />
            </motion.button>
            <div style={{ display: "flex", gap: 6 }}>
              {testimonials.map((_, i) => (
                <button key={i} onClick={() => setCurrentTestimonial(i)}
                  style={{ width: i === currentTestimonial ? 20 : 6, height: 6, borderRadius: 3, background: i === currentTestimonial ? C.green : C.border, border: "none", cursor: "pointer", transition: "all .3s" }} />
              ))}
            </div>
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setCurrentTestimonial(p => (p + 1) % testimonials.length)}
              style={{ width: 36, height: 36, borderRadius: "50%", background: C.bg3, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.text2 }}>
              <ChevronRight size={16} />
            </motion.button>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          CTA SECTION
      ══════════════════════════════════════════════════ */}
      <section style={{ padding: "100px 24px", background: C.bg, borderTop: `1px solid ${C.border}`, position: "relative", overflow: "hidden" }}>
        {/* BG glow */}
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 600, height: 400, background: `radial-gradient(ellipse, ${C.green}0a 0%, transparent 70%)`, pointerEvents: "none" }} />
        <Particles />

        <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center", position: "relative", zIndex: 5 }}>
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <SectionLabel>Get Started</SectionLabel>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "clamp(2rem,5vw,3.5rem)", color: C.text, marginBottom: 14, lineHeight: 1.1 }}>
              Join the <span style={{ color: C.green }}>Sustainable</span> Energy Revolution
            </h2>
            <p style={{ fontSize: 13, color: C.text2, marginBottom: 36, lineHeight: 1.7, maxWidth: 520, margin: "0 auto 36px" }}>
              Together we can transform how energy is produced, traded, and consumed. Start your EcoGrid journey today.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <motion.button whileHover={{ scale: 1.04, boxShadow: `0 0 30px ${C.green}40` }} whileTap={{ scale: 0.97 }}
                style={{ padding: "12px 28px", background: `linear-gradient(135deg, ${C.green}, #00b4d8)`, border: "none", borderRadius: 5, color: "#060810", fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: 1, textTransform: "uppercase", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                Get Started Free <ArrowRight size={16} />
              </motion.button>
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                style={{ padding: "12px 28px", background: "transparent", border: `1px solid ${C.border2}`, borderRadius: 5, color: C.text2, fontFamily: "'JetBrains Mono',monospace", fontSize: 13, cursor: "pointer" }}>
                Contact Sales
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════════ */}
      <footer style={{ background: C.bg2, borderTop: `1px solid ${C.border}`, padding: "48px 24px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 32, marginBottom: 40 }}>
            {/* Brand */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <div style={{ width: 34, height: 34, background: `${C.green}20`, border: `1px solid ${C.green}40`, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Zap size={18} color={C.green} />
                </div>
                <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 18, color: C.text }}>EcoGrid</span>
              </div>
              <p style={{ fontSize: 12, color: C.text3, lineHeight: 1.7, maxWidth: 260 }}>
                AI-powered peer-to-peer renewable energy trading platform. Built for a sustainable future.
              </p>
              <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                {[<Twitter size={15} />, <Facebook size={15} />, <Instagram size={15} />, <Linkedin size={15} />].map((icon, i) => (
                  <motion.a key={i} href="#" whileHover={{ scale: 1.2, color: C.green }} style={{ width: 30, height: 30, background: C.bg3, border: `1px solid ${C.border}`, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", color: C.text3, cursor: "pointer" }}>
                    {icon}
                  </motion.a>
                ))}
              </div>
            </div>

            {/* Links */}
            {[
              { heading: "Product", links: ["Dashboard", "Marketplace", "Forecast", "Pricing"] },
              { heading: "Resources", links: ["Documentation", "Case Studies", "Blog", "Support"] },
              { heading: "Company", links: ["About Us", "Careers", "Partners", "Contact"] },
            ].map(({ heading, links }) => (
              <div key={heading}>
                <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 12, color: C.text, marginBottom: 14, textTransform: "uppercase", letterSpacing: 1 }}>{heading}</p>
                {links.map(link => (
                  <motion.a key={link} href="#" whileHover={{ color: C.green, x: 3 }}
                    style={{ display: "block", marginBottom: 9, fontSize: 12, color: C.text3, textDecoration: "none", transition: "color .15s" }}>
                    {link}
                  </motion.a>
                ))}
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 20, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <p style={{ fontSize: 10, color: C.text3 }}>© {new Date().getFullYear()} EcoGrid. All Rights Reserved.</p>
            <div style={{ display: "flex", gap: 16 }}>
              {["Privacy Policy", "Terms of Service", "Cookie Policy"].map(link => (
                <a key={link} href="#" style={{ fontSize: 10, color: C.text3, textDecoration: "none" }}>{link}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage