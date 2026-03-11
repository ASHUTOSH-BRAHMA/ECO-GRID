import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import NavBar from "./NavBar";
import {
  Check, Zap, Shield, BarChart3, ArrowRight, ChevronDown, ChevronUp,
  Users, Building2, Home, Star, TrendingUp, Clock, Globe,
} from "lucide-react";

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg: "#060810", bg2: "#0c0f1a", bg3: "#111525", bg4: "#161b2e",
  border: "#1e2440", border2: "#2a3155",
  text: "#e8eaf6", text2: "#8892b0", text3: "#4a5568",
  green: "#00e5a0", red: "#ff4d6d", yellow: "#ffd166",
  blue: "#4d9fff", purple: "#a78bfa",
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=JetBrains+Mono:wght@300;400;500&display=swap');
  @keyframes pulse2{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.8)}}
  @keyframes scanLine{0%{top:-4px}100%{top:100%}}
  @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
  *{box-sizing:border-box}
  ::-webkit-scrollbar{width:4px}
  ::-webkit-scrollbar-track{background:${C.bg}}
  ::-webkit-scrollbar-thumb{background:${C.border2};border-radius:2px}
  .plan-card:hover{transform:translateY(-4px)}
  .plan-card{transition:transform .25s ease, border-color .2s ease}
`;

// ─── Shared primitives ────────────────────────────────────────────────────────
const SLabel = ({ children }) => (
  <div style={{ display: "inline-flex", alignItems: "center", gap: 7, marginBottom: 14 }}>
    <div style={{ width: 20, height: 1, background: C.green }} />
    <span style={{ fontSize: 10, color: C.green, textTransform: "uppercase", letterSpacing: 2, fontFamily: "'JetBrains Mono',monospace" }}>{children}</span>
    <div style={{ width: 20, height: 1, background: C.green }} />
  </div>
);

const FeatureRow = ({ text, included = true, color = C.green }) => (
  <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "7px 0", borderBottom: `1px solid ${C.border}` }}>
    <div style={{ width: 16, height: 16, borderRadius: "50%", background: included ? `${color}20` : `${C.border}50`, border: `1px solid ${included ? color + "50" : C.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
      {included && <Check size={9} style={{ color }} />}
    </div>
    <span style={{ fontSize: 12, color: included ? C.text2 : C.text3, fontFamily: "'JetBrains Mono',monospace", lineHeight: 1.4 }}>{text}</span>
  </div>
);

const TableRow = ({ cols, alt, accent }) => (
  <tr style={{ background: alt ? C.bg3 : C.bg2, borderBottom: `1px solid ${C.border}` }}>
    {cols.map((c, i) => (
      <td key={i} style={{ padding: "12px 16px", fontSize: i === 0 ? 13 : 12, color: i === 0 ? C.text : i === 1 ? (accent || C.green) : C.text3, fontFamily: "'JetBrains Mono',monospace", fontWeight: i === 1 ? 700 : 400 }}>{c}</td>
    ))}
  </tr>
);

const TableHead = ({ cols, accent = C.green }) => (
  <thead>
    <tr style={{ background: `${accent}10`, borderBottom: `1px solid ${C.border}` }}>
      {cols.map((c, i) => (
        <th key={i} style={{ padding: "12px 16px", textAlign: "left", fontSize: 10, color: accent, fontFamily: "'JetBrains Mono',monospace", textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 }}>{c}</th>
      ))}
    </tr>
  </thead>
);

const DataTable = ({ headers, rows, accent = C.green }) => (
  <div style={{ overflowX: "auto", borderRadius: 6, border: `1px solid ${C.border}`, marginBottom: 24 }}>
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <TableHead cols={headers} accent={accent} />
      <tbody>
        {rows.map((r, i) => <TableRow key={i} cols={r} alt={i % 2 === 0} accent={accent} />)}
      </tbody>
    </table>
  </div>
);

// ─── Plan Card ────────────────────────────────────────────────────────────────
const PlanCard = ({ label, price, sub, features, color, icon: Icon, popular = false, cta, onCta }) => (
  <motion.div className="plan-card" whileTap={{ scale: 0.99 }}
    style={{ flex: "1 1 260px", background: popular ? `linear-gradient(160deg, ${C.bg3}, ${C.bg4})` : C.bg3, border: `1px solid ${popular ? color + "60" : C.border}`, borderRadius: 10, padding: 24, position: "relative", overflow: "hidden", minWidth: 240, maxWidth: 320 }}>

    {/* Glow accent top */}
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />

    {popular && (
      <div style={{ position: "absolute", top: 14, right: 14, fontSize: 9, padding: "3px 10px", borderRadius: 3, background: `${color}20`, border: `1px solid ${color}40`, color, textTransform: "uppercase", letterSpacing: 1, fontFamily: "'JetBrains Mono',monospace", display: "flex", alignItems: "center", gap: 4 }}>
        <Star size={9} /> Most Popular
      </div>
    )}

    <div style={{ width: 40, height: 40, borderRadius: 8, background: `${color}15`, border: `1px solid ${color}30`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
      <Icon size={18} style={{ color }} />
    </div>

    <p style={{ fontSize: 10, color: C.text3, textTransform: "uppercase", letterSpacing: 1.5, fontFamily: "'JetBrains Mono',monospace", marginBottom: 6 }}>{label}</p>

    <div style={{ marginBottom: 6 }}>
      <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 32, color: C.text }}>{price}</span>
      {sub && <span style={{ fontSize: 11, color: C.text3, marginLeft: 4, fontFamily: "'JetBrains Mono',monospace" }}>{sub}</span>}
    </div>

    <div style={{ height: 1, background: C.border, margin: "16px 0" }} />

    <div style={{ marginBottom: 20 }}>
      {features.map((f, i) => <FeatureRow key={i} text={f.text} included={f.included !== false} color={color} />)}
    </div>

    <motion.button onClick={onCta} whileHover={{ scale: 1.03, boxShadow: `0 0 20px ${color}30` }} whileTap={{ scale: 0.97 }}
      style={{ width: "100%", padding: "10px", background: popular ? `linear-gradient(135deg, ${color}30, ${color}10)` : "transparent", border: `1px solid ${color}50`, borderRadius: 6, color, fontSize: 12, fontFamily: "'JetBrains Mono',monospace", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "box-shadow .2s" }}>
      {cta} <ArrowRight size={12} />
    </motion.button>
  </motion.div>
);

// ─── FAQ Item ─────────────────────────────────────────────────────────────────
const FAQ = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ border: `1px solid ${C.border}`, borderRadius: 6, marginBottom: 8, overflow: "hidden" }}>
      <button onClick={() => setOpen(!open)} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", background: C.bg3, border: "none", cursor: "pointer", color: C.text, fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 13, textAlign: "left" }}>
        {q}
        {open ? <ChevronUp size={14} style={{ color: C.green, flexShrink: 0 }} /> : <ChevronDown size={14} style={{ color: C.text3, flexShrink: 0 }} />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} style={{ overflow: "hidden", background: C.bg2 }}>
            <p style={{ padding: "14px 18px", fontSize: 13, color: C.text2, fontFamily: "'JetBrains Mono',monospace", lineHeight: 1.7 }}>{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────
const PricingPage = () => {
  const [userType, setUserType] = useState("prosumer");
  const navigate = useNavigate();

  const prosumerPlans = [
    { label: "Standard", price: "Free", color: C.blue, icon: Home, cta: "Get Started", features: [{ text: "Basic P2P trading" }, { text: "Standard AI forecasting" }, { text: "Marketplace access" }, { text: "1% transaction fee" }, { text: "Dashboard analytics", included: false }, { text: "Priority listings", included: false }] },
    { label: "Premium", price: "$10", sub: "/mo", color: C.green, icon: Zap, popular: true, cta: "Go Premium", features: [{ text: "Reduced fee (0.5%)" }, { text: "Priority marketplace listings" }, { text: "Advanced AI forecasting" }, { text: "Full dashboard analytics" }, { text: "Energy export reports" }, { text: "API access", included: false }] },
    { label: "Enterprise", price: "$50", sub: "/mo", color: C.purple, icon: Building2, cta: "Contact Sales", features: [{ text: "Zero transaction fees" }, { text: "Full API access" }, { text: "Custom analytics & reports" }, { text: "Dedicated support" }, { text: "Blockchain audit logs" }, { text: "White-label option" }] },
  ];

  const consumerPlans = [
    { label: "Basic", price: "Free", color: C.blue, icon: Home, cta: "Sign Up Free", features: [{ text: "Marketplace access" }, { text: "Basic consumption analytics" }, { text: "Standard rates" }, { text: "Email support" }, { text: "Price alerts", included: false }, { text: "Auto-purchase", included: false }] },
    { label: "Plus", price: "$5", sub: "/mo", color: C.green, icon: TrendingUp, popular: true, cta: "Start Plus", features: [{ text: "Preferred P2P rates" }, { text: "Real-time price alerts" }, { text: "Consumption optimisation" }, { text: "Extended analytics" }, { text: "Priority support" }, { text: "Automated purchasing", included: false }] },
    { label: "Premium", price: "$15", sub: "/mo", color: C.purple, icon: Star, cta: "Go Premium", features: [{ text: "Automated smart purchasing" }, { text: "Advanced AI forecasting" }, { text: "Carbon footprint tracker" }, { text: "All analytics unlocked" }, { text: "Dedicated account manager" }, { text: "Custom alerts & rules" }] },
  ];

  const utilityPlans = [
    { label: "Standard", price: "$100", sub: "/mo", color: C.blue, icon: Globe, cta: "Get Access", features: [{ text: "Basic grid monitoring" }, { text: "Market analytics" }, { text: "Standard reporting" }, { text: "Email support" }, { text: "API access", included: false }, { text: "Custom integrations", included: false }] },
    { label: "Professional", price: "$500", sub: "/mo", color: C.green, icon: BarChart3, popular: true, cta: "Contact Us", features: [{ text: "Advanced grid optimisation" }, { text: "Detailed market insights" }, { text: "Full API access" }, { text: "Anomaly detection" }, { text: "Priority support" }, { text: "White-label", included: false }] },
    { label: "Enterprise", price: "Custom", color: C.purple, icon: Building2, cta: "Request Quote", features: [{ text: "Full system integration" }, { text: "White-label solutions" }, { text: "Custom development" }, { text: "SLA guarantees" }, { text: "On-site training" }, { text: "Dedicated engineering team" }] },
  ];

  const plans = userType === "prosumer" ? prosumerPlans : userType === "consumer" ? consumerPlans : utilityPlans;

  const tabs = [
    { id: "prosumer", label: "Prosumers", icon: Zap, color: C.green },
    { id: "consumer", label: "Consumers", icon: Home, color: C.blue },
    { id: "utility", label: "Utilities", icon: Building2, color: C.purple },
  ];

  const faqs = [
    { q: "What is an EcoToken?", a: "EcoToken (ETK) is EcoGrid's native energy token. 1 ETK = 1 kWh of energy at the initial base rate of $0.12 USD. The rate adjusts dynamically based on market supply and demand." },
    { q: "Are there transaction fees?", a: "Standard accounts pay 1% per transaction. Premium prosumers pay 0.5%, and Enterprise tiers pay 0% transaction fees. All fees go toward platform maintenance, grid stabilisation, and AI model improvements." },
    { q: "How does dynamic pricing work?", a: "Prices adjust in real time based on supply/demand ratio, time of day (peak vs off-peak: 0.8×–1.4×), seasonal factors (0.9×–1.2×), and volume discounts. AI forecasts help you choose the best trading window." },
    { q: "Can I switch plans anytime?", a: "Yes. You can upgrade or downgrade your plan at any time. Changes take effect from the next billing cycle. No lock-in contracts." },
    { q: "Is there a free trial?", a: "All paid plans include a 14-day free trial with no credit card required. Standard and Basic plans are permanently free with no time limit." },
    { q: "How are settlements processed?", a: "Standard settlement takes 24–48 hours at no extra cost. Express settlement (4h) adds +1%, and Instant settlement adds +2.5%. Payments are accepted via card, PayPal, bank transfer, and major cryptocurrencies." },
  ];

  return (
    <>
      <style>{css}</style>
      <NavBar />
      <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'JetBrains Mono',monospace", paddingTop: 52 }}>

        {/* Scan line */}
        <div style={{ position: "fixed", left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${C.green}20, transparent)`, animation: "scanLine 10s linear infinite", zIndex: 1, pointerEvents: "none" }} />

        {/* ── Hero ── */}
        <div style={{ position: "relative", padding: "70px 24px 60px", textAlign: "center", overflow: "hidden", borderBottom: `1px solid ${C.border}`, background: C.bg2 }}>
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 700, height: 300, background: `radial-gradient(ellipse, ${C.green}08 0%, transparent 70%)`, pointerEvents: "none" }} />
          <div style={{ position: "relative", maxWidth: 740, margin: "0 auto" }}>
            <SLabel>Transparent Pricing</SLabel>
            <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "clamp(2.2rem,5vw,3.5rem)", color: C.text, marginBottom: 18, lineHeight: 1.1 }}>
              Simple, Fair,&nbsp;<span style={{ color: C.green }}>Sustainable</span>
            </h1>
            <p style={{ fontSize: 15, color: C.text2, maxWidth: 560, margin: "0 auto 36px", lineHeight: 1.8 }}>
              EcoGrid's economic model is built on transparency. No hidden fees — just fair P2P energy pricing that benefits producers, consumers, and the planet.
            </p>

            {/* Key metrics strip */}
            <div style={{ display: "flex", justifyContent: "center", gap: 32, flexWrap: "wrap" }}>
              {[
                { label: "Base rate", value: "$0.12/kWh", color: C.green },
                { label: "Transaction fee", value: "From 0%", color: C.blue },
                { label: "vs. grid savings", value: "Up to 35%", color: C.yellow },
                { label: "Settlement", value: "24–48h", color: C.purple },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ textAlign: "center" }}>
                  <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 22, color, lineHeight: 1 }}>{value}</p>
                  <p style={{ fontSize: 10, color: C.text3, textTransform: "uppercase", letterSpacing: 1, marginTop: 4 }}>{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 16px" }}>

          {/* ── User type tabs ── */}
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 48 }}>
            {tabs.map(({ id, label, icon: Icon, color }) => (
              <motion.button key={id} whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }} onClick={() => setUserType(id)}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 24px", borderRadius: 6, background: userType === id ? `${color}18` : C.bg3, border: `1px solid ${userType === id ? color + "60" : C.border}`, color: userType === id ? color : C.text2, fontSize: 12, fontFamily: "'JetBrains Mono',monospace", cursor: "pointer", transition: "all .2s" }}>
                <Icon size={14} />{label}
              </motion.button>
            ))}
          </div>

          {/* ── Plan cards ── */}
          <AnimatePresence mode="wait">
            <motion.div key={userType} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}
              style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap", marginBottom: 72 }}>
              {plans.map((plan, i) => (
                <PlanCard key={i} {...plan} onCta={() => plan.cta.toLowerCase().includes("contact") || plan.cta.toLowerCase().includes("quote") ? window.location.href = "mailto:support@ecogrid.io" : navigate("/register")} />
              ))}
            </motion.div>
          </AnimatePresence>

          {/* ── Dynamic pricing section ── */}
          <div style={{ marginBottom: 72 }}>
            <div style={{ textAlign: "center", marginBottom: 36 }}>
              <SLabel>How Pricing Works</SLabel>
              <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "clamp(1.6rem,3vw,2.2rem)", color: C.text, marginBottom: 10 }}>AI-Driven Dynamic Pricing</h2>
              <p style={{ fontSize: 13, color: C.text2, maxWidth: 520, margin: "0 auto" }}>Prices update in real time based on 5 key variables. Our ML models predict the optimal trading window for every user.</p>
            </div>

            {/* Price formula */}
            <div style={{ background: C.bg3, border: `1px solid ${C.border}`, borderRadius: 8, padding: "20px 24px", marginBottom: 28, overflow: "auto" }}>
              <p style={{ fontSize: 10, color: C.text3, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Price formula</p>
              <code style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, color: C.green, lineHeight: 1.8, display: "block", whiteSpace: "pre-wrap" }}>
                Final Price = Base Price × Supply/Demand Factor × Time Factor × Seasonal Factor × (1 − Volume Discount)
              </code>
            </div>

            {/* Factor table */}
            <DataTable
              headers={["Factor", "Range", "Description"]}
              rows={[
                ["Supply / Demand", "0.8× – 1.5×", "Adjusts with real-time marketplace balance"],
                ["Time of Day", "0.8× – 1.4×", "0.8× off-peak · 1.4× peak demand hours"],
                ["Seasonal", "0.9× – 1.2×", "Weather-influenced production adjustments"],
                ["Volume Discount", "0% – 15%", "Applies to purchases exceeding 100 kWh"],
                ["Renewable Premium", "+5% – +10%", "Certified 100% renewable energy sources"],
              ]}
              accent={C.green}
            />

            {/* P2P pricing table */}
            <h3 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 15, color: C.text, marginBottom: 14 }}>P2P Trading Rates</h3>
            <DataTable
              headers={["Component", "Rate", "Notes"]}
              rows={[
                ["Prosumer Base Price", "$0.08 – $0.15/kWh", "Set by seller, adjusted dynamically"],
                ["Platform Transaction", "0% – 1%", "Waived on Enterprise & higher tiers"],
                ["Grid Stabilisation", "3% of transaction", "Maintains grid reliability"],
                ["Energy Storage", "$0.03/kWh stored", "Virtual battery storage service"],
                ["Grid Access", "$5/month", "Base connection fee"],
              ]}
              accent={C.blue}
            />
          </div>

          {/* ── Settlement & incentives ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 72 }}>
            {/* Settlement */}
            <div>
              <h3 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 15, color: C.text, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                <Clock size={15} style={{ color: C.blue }} /> Settlement Timeline
              </h3>
              <DataTable
                headers={["Type", "Time", "Extra Fee"]}
                rows={[
                  ["Standard", "24 – 48 hours", "Included"],
                  ["Express", "4 hours", "+1%"],
                  ["Instant", "Immediate", "+2.5%"],
                ]}
                accent={C.blue}
              />
              <h3 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 10 }}>Payment Methods</h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {["Credit / Debit Cards", "PayPal", "Bank Transfer", "Bitcoin / ETH", "Mobile Wallets"].map(m => (
                  <span key={m} style={{ fontSize: 10, padding: "4px 12px", borderRadius: 3, background: `${C.blue}12`, border: `1px solid ${C.blue}30`, color: C.blue, fontFamily: "'JetBrains Mono',monospace" }}>{m}</span>
                ))}
              </div>
            </div>

            {/* Incentives */}
            <div>
              <h3 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 15, color: C.text, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                <Star size={15} style={{ color: C.yellow }} /> Incentive Programs
              </h3>
              {[
                { title: "Early Adopter Bonus", value: "+20% ETK", desc: "First 1,000 prosumers on the network", color: C.green },
                { title: "Referral Reward", value: "10 ETK", desc: "Per successful referral, all users", color: C.blue },
                { title: "Consistency Bonus", value: "+5% price premium", desc: "Prosumers maintaining >90% uptime", color: C.purple },
                { title: "Peak Contribution", value: "+15% on sales", desc: "Energy sold during peak hours", color: C.yellow },
                { title: "Demand Response", value: "$0.05/kWh", desc: "Reducing consumption during grid alerts", color: C.red },
                { title: "Green Certificate", value: "Official badge", desc: "Verified 100% renewable sources", color: C.green },
              ].map(({ title, value, desc, color }) => (
                <div key={title} style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ width: 6, borderRadius: 3, background: color, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                      <span style={{ fontSize: 12, fontFamily: "'Syne',sans-serif", fontWeight: 700, color: C.text }}>{title}</span>
                      <span style={{ fontSize: 11, color, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace" }}>{value}</span>
                    </div>
                    <p style={{ fontSize: 10, color: C.text3 }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Roadmap ── */}
          <div style={{ marginBottom: 72 }}>
            <div style={{ textAlign: "center", marginBottom: 36 }}>
              <SLabel>Roadmap</SLabel>
              <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "clamp(1.6rem,3vw,2.2rem)", color: C.text, marginBottom: 10 }}>Implementation Phases</h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
              {[
                { phase: "01", title: "Foundation", desc: "Basic P2P trading for standard prosumers and consumers. Fixed-rate EcoToken conversion and marketplace launch.", color: C.green, active: true },
                { phase: "02", title: "Dynamic Markets", desc: "Smart algorithm activation for real-time pricing. Peak-hour adjustments and supply/demand balancing.", color: C.blue, active: false },
                { phase: "03", title: "Grid Services", desc: "Utility-scale tier access. Grid stabilisation incentives, demand response programs, and white-label solutions.", color: C.purple, active: false },
              ].map(({ phase, title, desc, color, active }) => (
                <motion.div key={phase} whileHover={{ y: -3 }}
                  style={{ background: C.bg3, border: `1px solid ${active ? color + "50" : C.border}`, borderRadius: 8, padding: 24, position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${color}, transparent)` }} />
                  <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 48, color: `${color}15`, position: "absolute", top: 8, right: 14, lineHeight: 1 }}>{phase}</div>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: active ? color : C.border2, boxShadow: active ? `0 0 12px ${color}80` : "none", marginBottom: 14 }} />
                  <h3 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 16, color: active ? color : C.text, marginBottom: 8 }}>Phase {phase}: {title}</h3>
                  <p style={{ fontSize: 12, color: C.text2, lineHeight: 1.7 }}>{desc}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* ── Revenue breakdown ── */}
          <div style={{ marginBottom: 72 }}>
            <div style={{ textAlign: "center", marginBottom: 36 }}>
              <SLabel>Revenue Model</SLabel>
              <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "clamp(1.6rem,3vw,2.2rem)", color: C.text }}>How EcoGrid Sustains Itself</h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
              {[
                { stream: "Transaction Fees", pct: 35, growth: "+15%/yr", color: C.green },
                { stream: "Subscriptions", pct: 25, growth: "+30%/yr", color: C.blue },
                { stream: "Grid Services", pct: 20, growth: "+10%/yr", color: C.purple },
                { stream: "Data Analytics", pct: 10, growth: "+40%/yr", color: C.yellow },
                { stream: "Value-Added", pct: 10, growth: "+25%/yr", color: C.red },
              ].map(({ stream, pct, growth, color }) => (
                <motion.div key={stream} whileHover={{ y: -2 }}
                  style={{ background: C.bg3, border: `1px solid ${C.border}`, borderRadius: 8, padding: 16, textAlign: "center" }}>
                  <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 28, color, marginBottom: 4 }}>{pct}%</p>
                  <div style={{ height: 3, background: C.border, borderRadius: 2, margin: "8px 0", overflow: "hidden" }}>
                    <motion.div initial={{ width: 0 }} whileInView={{ width: `${pct}%` }} viewport={{ once: true }} transition={{ duration: 1, ease: "easeOut" }}
                      style={{ height: "100%", background: color, borderRadius: 2 }} />
                  </div>
                  <p style={{ fontSize: 11, color: C.text, fontFamily: "'Syne',sans-serif", fontWeight: 700, marginBottom: 4 }}>{stream}</p>
                  <p style={{ fontSize: 10, color: C.text3 }}>{growth}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* ── FAQ ── */}
          <div style={{ maxWidth: 780, margin: "0 auto 72px" }}>
            <div style={{ textAlign: "center", marginBottom: 36 }}>
              <SLabel>FAQ</SLabel>
              <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "clamp(1.6rem,3vw,2.2rem)", color: C.text }}>Common Questions</h2>
            </div>
            {faqs.map((f, i) => <FAQ key={i} q={f.q} a={f.a} />)}
          </div>

          {/* ── CTA banner ── */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            style={{ background: `linear-gradient(135deg, ${C.bg3}, ${C.bg4})`, border: `1px solid ${C.green}40`, borderRadius: 12, padding: "48px 32px", textAlign: "center", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${C.green}, ${C.blue}, transparent)` }} />
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "clamp(1.6rem,3vw,2.4rem)", color: C.text, marginBottom: 12 }}>Start Trading Clean Energy Today</h2>
            <p style={{ fontSize: 13, color: C.text2, marginBottom: 28, maxWidth: 480, margin: "0 auto 28px", lineHeight: 1.7 }}>Join thousands of prosumers, consumers, and utilities building a more sustainable energy future.</p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <motion.button whileHover={{ scale: 1.05, boxShadow: `0 0 30px ${C.green}40` }} whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/register")}
                style={{ padding: "12px 28px", background: `linear-gradient(135deg, ${C.green}, #00b4d8)`, border: "none", borderRadius: 6, color: "#060810", fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                Create Free Account <ArrowRight size={15} />
              </motion.button>
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                onClick={() => window.location.href = "mailto:support@ecogrid.io"}
                style={{ padding: "12px 28px", background: "transparent", border: `1px solid ${C.border2}`, borderRadius: 6, color: C.text2, fontFamily: "'JetBrains Mono',monospace", fontSize: 13, cursor: "pointer" }}>
                Talk to Sales
              </motion.button>
            </div>
          </motion.div>
        </div>

        {/* Footer */}
        <div style={{ borderTop: `1px solid ${C.border}`, padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 10, color: C.text3 }}>
          <span style={{ color: C.text2 }}>EcoGrid · Pricing & Economic Model</span>
          <span>© {new Date().getFullYear()} EcoGrid. All rights reserved.</span>
        </div>
      </div>
    </>
  );
};

export default PricingPage;
