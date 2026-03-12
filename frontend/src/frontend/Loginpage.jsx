// LoginPage.jsx — Premium split-layout redesign
import React, { useState, useRef, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../Context/AuthContext";
import { handlesuccess } from "../../utils";
import ReCAPTCHA from "react-google-recaptcha";
import GoogleSignIn from "../components/GoogleSignIn";
import { API_BASE_URL } from "../config";
import {
  Zap, Eye, EyeOff, ArrowRight, Home, Building2, Sun, Wind,
  BatteryCharging, MapPin, Navigation, CheckCircle, ChevronRight, ChevronLeft, Leaf, Shield, BarChart3
} from "lucide-react";

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

const C = {
  bg: "#060810", bg2: "#0c0f1a", bg3: "#111525", bg4: "#161b2e",
  border: "#1e2440", border2: "#2a3155",
  text: "#e8eaf6", text2: "#8892b0", text3: "#4a5568",
  green: "#00e5a0", red: "#ff4d6d", yellow: "#ffd166", blue: "#4d9fff", purple: "#a78bfa",
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=JetBrains+Mono:wght@300;400;500&display=swap');
  @keyframes scanLine{0%{top:-4px}100%{top:100%}}
  @keyframes pulse2{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.8)}}
  @keyframes slideUp{0%{opacity:0;transform:translateY(12px)}100%{opacity:1;transform:translateY(0)}}
  * { box-sizing: border-box; }
  input { outline: none; transition: border-color .2s; }
  input:focus { border-color: ${C.green}80 !important; }
  @media (max-width: 768px) { .split-left { display: none !important; } }
`;

// ─── Shared ──────────────────────────────────────────────────────────────────
const Field = ({ label, type = "text", value, onChange, placeholder, icon: Icon, error, suffix }) => (
  <div style={{ marginBottom: 14 }}>
    <p style={{ fontSize: 9, color: C.text3, textTransform: "uppercase", letterSpacing: 1, marginBottom: 5 }}>{label}</p>
    <div style={{ position: "relative" }}>
      {Icon && <Icon size={13} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: C.text3 }} />}
      <input type={type} value={value} onChange={onChange} placeholder={placeholder}
        style={{ width: "100%", padding: `9px ${suffix ? "38px" : "12px"} 9px ${Icon ? "32px" : "12px"}`, background: C.bg3, border: `1px solid ${error ? C.red : C.border2}`, borderRadius: 5, color: C.text, fontFamily: "'JetBrains Mono',monospace", fontSize: 12 }} />
      {suffix && <div style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", cursor: "pointer" }}>{suffix}</div>}
    </div>
    {error && <p style={{ fontSize: 10, color: C.red, marginTop: 3 }}>{error}</p>}
  </div>
);

// ─── Onboarding (same wizard as RegisterPage, inline here) ─────────────────
const StepBar = ({ current, total, labels }) => (
  <div style={{ marginBottom: 24 }}>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0 }}>
      {labels.map((label, i) => (
        <React.Fragment key={i}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <motion.div animate={{ background: i < current ? C.green : i === current ? `${C.green}30` : C.bg3, borderColor: i <= current ? C.green : C.border2 }}
              style={{ width: 26, height: 26, borderRadius: "50%", border: `2px solid`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontFamily: "'Syne',sans-serif", fontWeight: 700, color: i < current ? "#060810" : i === current ? C.green : C.text3 }}>
              {i < current ? <CheckCircle size={12} /> : i + 1}
            </motion.div>
            <span style={{ fontSize: 8, color: i <= current ? C.green : C.text3, textTransform: "uppercase", letterSpacing: 0.8, whiteSpace: "nowrap" }}>{label}</span>
          </div>
          {i < total - 1 && (
            <div style={{ flex: 1, height: 2, background: C.border, margin: "0 4px", marginBottom: 14, position: "relative", minWidth: 20 }}>
              <motion.div animate={{ width: i < current ? "100%" : "0%" }} transition={{ duration: 0.4 }} style={{ position: "absolute", top: 0, left: 0, height: "100%", background: C.green, borderRadius: 1 }} />
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  </div>
);

const RoleCard = ({ id, label, desc, icon: Icon, color, selected, onClick }) => (
  <motion.button type="button" onClick={() => onClick(id)} whileHover={{ y: -3 }} whileTap={{ scale: 0.97 }}
    style={{ flex: "1 1 110px", padding: "14px 8px", borderRadius: 7, border: `2px solid ${selected ? color : C.border}`, background: selected ? `${color}12` : C.bg3, cursor: "pointer", textAlign: "center", position: "relative" }}>
    {selected && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />}
    <div style={{ width: 36, height: 36, borderRadius: 8, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px" }}>
      <Icon size={16} style={{ color: selected ? color : C.text3 }} />
    </div>
    <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 11, color: selected ? color : C.text, marginBottom: 3 }}>{label}</p>
    <p style={{ fontSize: 9, color: C.text3, lineHeight: 1.3 }}>{desc}</p>
    {selected && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ position: "absolute", top: 6, right: 6 }}><CheckCircle size={12} style={{ color }} /></motion.div>}
  </motion.button>
);

const SourceCard = ({ id, label, icon: Icon, color, selected, onClick }) => (
  <motion.button type="button" onClick={() => onClick(id)} whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
    style={{ padding: "10px 8px", borderRadius: 7, border: `1px solid ${selected ? color : C.border}`, background: selected ? `${color}15` : C.bg3, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 5, flex: "1 1 70px" }}>
    <Icon size={16} style={{ color: selected ? color : C.text3 }} />
    <span style={{ fontSize: 9, color: selected ? color : C.text3, fontFamily: "'JetBrains Mono',monospace" }}>{label}</span>
  </motion.button>
);

const OnboardingWizard = ({ onComplete, isLoading, error }) => {
  const [step, setStep] = useState(0);
  const [data, setData] = useState({ role: "", location: "", energyUsage: 300, hasSolarPanels: null, energySources: [] });
  const [locLoading, setLocLoading] = useState(false);
  const [dir, setDir] = useState(1);
  const STEPS = ["Role", "Location", "Energy", "Ready"];

  const detectLocation = async () => {
    setLocLoading(true);
    navigator.geolocation?.getCurrentPosition(async ({ coords: { latitude, longitude } }) => {
      try {
        const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
        const d = await r.json();
        if (d.address) {
          const loc = [d.address.city || d.address.town, d.address.state, d.address.country].filter(Boolean).join(", ");
          setData(p => ({ ...p, location: loc }));
        }
      } catch {} finally { setLocLoading(false); }
    }, () => setLocLoading(false));
  };

  const toggleSource = (src) => setData(p => ({ ...p, energySources: p.energySources.includes(src) ? p.energySources.filter(s => s !== src) : [...p.energySources, src] }));
  const canNext = [() => !!data.role, () => !!data.location.trim(), () => data.hasSolarPanels !== null];
  const go = (n) => { setDir(n > step ? 1 : -1); setStep(n); };
  const slideV = { enter: (d) => ({ x: d > 0 ? 50 : -50, opacity: 0 }), center: { x: 0, opacity: 1 }, exit: (d) => ({ x: d < 0 ? 50 : -50, opacity: 0 }) };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(6,8,16,.92)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }}>
      <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 160, damping: 20 }}
        style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 12, padding: "26px 26px 22px", width: "100%", maxWidth: 480, position: "relative", overflow: "hidden", boxShadow: `0 0 80px ${C.green}12` }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${C.green}, ${C.blue}, transparent)` }} />
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: `${C.green}20`, border: `1px solid ${C.green}40`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Zap size={15} style={{ color: C.green }} />
          </div>
          <div>
            <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 13, color: C.text }}>EcoGrid Setup</p>
            <p style={{ fontSize: 9, color: C.text3, textTransform: "uppercase", letterSpacing: 1 }}>Step {step + 1} of {STEPS.length}</p>
          </div>
        </div>
        <StepBar current={step} total={STEPS.length} labels={STEPS} />
        <div style={{ minHeight: 260, overflow: "hidden" }}>
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div key={step} custom={dir} variants={slideV} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
              {step === 0 && (
                <div>
                  <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 5 }}>How do you use energy?</p>
                  <p style={{ fontSize: 11, color: C.text2, marginBottom: 16 }}>This personalises your EcoGrid experience.</p>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <RoleCard id="prosumer" label="Prosumer" desc="Produce & sell energy" icon={Zap} color={C.green} selected={data.role === "prosumer"} onClick={v => setData(p => ({ ...p, role: v }))} />
                    <RoleCard id="consumer" label="Consumer" desc="Buy clean energy" icon={Home} color={C.blue} selected={data.role === "consumer"} onClick={v => setData(p => ({ ...p, role: v }))} />
                    <RoleCard id="utility" label="Utility" desc="Grid management" icon={Building2} color={C.purple} selected={data.role === "utility"} onClick={v => setData(p => ({ ...p, role: v }))} />
                  </div>
                </div>
              )}
              {step === 1 && (
                <div>
                  <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 5 }}>Where are you located?</p>
                  <p style={{ fontSize: 11, color: C.text2, marginBottom: 16 }}>Helps us show local pricing and nearby prosumers.</p>
                  <div style={{ position: "relative", marginBottom: 10 }}>
                    <MapPin size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: data.location ? C.green : C.text3 }} />
                    <input value={data.location} onChange={e => setData(p => ({ ...p, location: e.target.value }))} placeholder="City, State, Country"
                      style={{ width: "100%", padding: "10px 12px 10px 30px", background: C.bg3, border: `1px solid ${data.location ? C.green + "60" : C.border2}`, borderRadius: 6, color: C.text, fontFamily: "'JetBrains Mono',monospace", fontSize: 12 }} />
                  </div>
                  <motion.button type="button" onClick={detectLocation} whileHover={{ scale: 1.02 }} disabled={locLoading}
                    style={{ width: "100%", padding: "9px", background: `${C.blue}15`, border: `1px solid ${C.blue}40`, borderRadius: 5, color: C.blue, fontSize: 11, cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, marginBottom: 12 }}>
                    <Navigation size={11} /> {locLoading ? "Detecting…" : "Auto-detect location"}
                  </motion.button>
                  {data.location && (
                    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} style={{ padding: "8px 12px", background: `${C.green}10`, border: `1px solid ${C.green}30`, borderRadius: 5, fontSize: 11, color: C.green, display: "flex", gap: 7, alignItems: "center" }}>
                      <CheckCircle size={12} /> {data.location}
                    </motion.div>
                  )}
                </div>
              )}
              {step === 2 && (
                <div>
                  <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 5 }}>Your energy profile</p>
                  <p style={{ fontSize: 11, color: C.text2, marginBottom: 14 }}>Personalises your dashboard and recommendations.</p>
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 9, color: C.text3, textTransform: "uppercase", letterSpacing: 1 }}>Monthly Usage</span>
                      <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 15, color: C.green }}>{data.energyUsage} <span style={{ fontSize: 10, color: C.text3 }}>kWh</span></span>
                    </div>
                    <input type="range" min={50} max={1200} step={10} value={data.energyUsage} onChange={e => setData(p => ({ ...p, energyUsage: Number(e.target.value) }))}
                      style={{ width: "100%", accentColor: C.green, cursor: "pointer", marginBottom: 6 }} />
                    <p style={{ fontSize: 10, color: C.text3 }}>{data.energyUsage < 200 ? "Small apartment" : data.energyUsage < 400 ? "Average household" : data.energyUsage < 700 ? "Large home" : "Commercial"}</p>
                  </div>
                  <p style={{ fontSize: 9, color: C.text3, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Energy sources</p>
                  <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 14 }}>
                    <SourceCard id="solar" label="Solar" icon={Sun} color={C.yellow} selected={data.energySources.includes("solar")} onClick={toggleSource} />
                    <SourceCard id="wind" label="Wind" icon={Wind} color={C.blue} selected={data.energySources.includes("wind")} onClick={toggleSource} />
                    <SourceCard id="battery" label="Battery" icon={BatteryCharging} color={C.green} selected={data.energySources.includes("battery")} onClick={toggleSource} />
                    <SourceCard id="grid" label="Grid Only" icon={Zap} color={C.text3} selected={data.energySources.includes("grid")} onClick={toggleSource} />
                  </div>
                  <p style={{ fontSize: 9, color: C.text3, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Solar panels?</p>
                  <div style={{ display: "flex", gap: 8 }}>
                    {[{ v: true, label: "Yes ☀" }, { v: false, label: "No" }].map(({ v, label }) => (
                      <motion.button key={String(v)} type="button" whileHover={{ scale: 1.03 }} onClick={() => setData(p => ({ ...p, hasSolarPanels: v }))}
                        style={{ flex: 1, padding: "8px", border: `1px solid ${data.hasSolarPanels === v ? C.yellow : C.border}`, borderRadius: 5, background: data.hasSolarPanels === v ? `${C.yellow}18` : C.bg3, color: data.hasSolarPanels === v ? C.yellow : C.text2, fontSize: 11, cursor: "pointer", fontFamily: "'JetBrains Mono',monospace" }}>
                        {label}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}
              {step === 3 && (
                <div style={{ textAlign: "center", paddingTop: 16 }}>
                  <motion.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 200, damping: 14 }}
                    style={{ width: 64, height: 64, borderRadius: "50%", background: `${C.green}20`, border: `2px solid ${C.green}60`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", boxShadow: `0 0 32px ${C.green}30` }}>
                    <CheckCircle size={32} style={{ color: C.green }} />
                  </motion.div>
                  <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 18, color: C.text, marginBottom: 8 }}>You're all set!</p>
                  <p style={{ fontSize: 11, color: C.text2, lineHeight: 1.7, marginBottom: 16 }}>Your <strong style={{ color: C.green }}>{data.role}</strong> profile is ready. Let's start trading.</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 7, justifyContent: "center" }}>
                    {[{ l: data.role, c: data.role === "prosumer" ? C.green : data.role === "consumer" ? C.blue : C.purple }, { l: data.location.split(",")[0], c: C.yellow }, { l: `${data.energyUsage} kWh/mo`, c: C.blue }, ...(data.hasSolarPanels ? [{ l: "Solar ☀", c: C.yellow }] : [])].map(({ l, c }) => (
                      <span key={l} style={{ fontSize: 10, padding: "3px 10px", borderRadius: 3, background: `${c}18`, border: `1px solid ${c}40`, color: c, fontFamily: "'JetBrains Mono',monospace" }}>{l}</span>
                    ))}
                  </div>
                  {error && <div style={{ background: `${C.red}12`, border: `1px solid ${C.red}40`, borderRadius: 4, padding: "9px 12px", color: C.red, fontSize: 12, margin: "14px 0 0" }}>⚠ {error}</div>}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
          {step > 0 && step < 3 && (
            <motion.button type="button" whileHover={{ scale: 1.03 }} onClick={() => go(step - 1)}
              style={{ padding: "9px 14px", background: "transparent", border: `1px solid ${C.border2}`, borderRadius: 5, color: C.text2, fontSize: 11, cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", display: "flex", alignItems: "center", gap: 5 }}>
              <ChevronLeft size={12} /> Back
            </motion.button>
          )}
          {step < 3 ? (
            <motion.button type="button" whileHover={{ scale: 1.03 }} onClick={() => go(step + 1)} disabled={!canNext[step]?.()}
              style={{ flex: 1, padding: "10px 0", background: canNext[step]?.() ? `linear-gradient(135deg, ${C.green}, #00b4d8)` : C.border, border: "none", borderRadius: 5, color: canNext[step]?.() ? "#060810" : C.text3, fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 12, cursor: canNext[step]?.() ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
              {step === 2 ? "Review" : "Continue"} <ChevronRight size={13} />
            </motion.button>
          ) : (
            <motion.button type="button" whileHover={{ scale: 1.03 }} onClick={() => onComplete({ userType: data.role, location: data.location, energyUsage: data.energyUsage, hasSolarPanels: data.hasSolarPanels, energySources: data.energySources })} disabled={isLoading}
              style={{ flex: 1, padding: "10px 0", background: isLoading ? C.border : `linear-gradient(135deg, ${C.green}, #00b4d8)`, border: "none", borderRadius: 5, color: "#060810", fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 12, cursor: isLoading ? "not-allowed" : "pointer" }}>
              {isLoading ? "Saving…" : "Enter EcoGrid →"}
            </motion.button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

// ─── Left panel live stats ────────────────────────────────────────────────────
const LiveTicker = () => {
  const [tick, setTick] = React.useState(0);
  React.useEffect(() => { const iv = setInterval(() => setTick(t => t + 1), 3000); return () => clearInterval(iv); }, []);

  const stats = [
    { label: "Grid Load", value: `${(72 + Math.sin(tick * 0.7) * 6).toFixed(1)}%`, color: C.green },
    { label: "P2P Rate", value: `$${(0.09 + Math.sin(tick * 0.5) * 0.02).toFixed(3)}/kWh`, color: C.blue },
    { label: "Producers Online", value: `${142 + (tick % 4)}`, color: C.purple },
    { label: "CO₂ Saved Today", value: `${(3.2 + tick * 0.04).toFixed(1)} t`, color: C.green },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 28 }}>
      {stats.map(({ label, value, color }) => (
        <motion.div key={label} animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 3, repeat: Infinity }}
          style={{ background: `${color}0d`, border: `1px solid ${color}25`, borderRadius: 7, padding: "11px 12px" }}>
          <p style={{ fontSize: 9, color: C.text3, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>{label}</p>
          <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 16, color }}>
            <motion.span key={value} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>{value}</motion.span>
          </p>
        </motion.div>
      ))}
    </div>
  );
};

const features = [
  { icon: BarChart3, color: "#a78bfa", title: "AI Forecasting", desc: "LSTM-powered energy demand prediction" },
  { icon: Shield, color: "#4d9fff", title: "Blockchain P2P", desc: "Secure trading on Polygon network" },
  { icon: Zap, color: "#00e5a0", title: "Live Grid Data", desc: "Real-time monitoring via IoT sensors" },
];

const testimonials = [
  { quote: "EcoGrid cut our community's energy bills by 35% in the first month.", name: "Sarah J.", role: "Community Solar Manager" },
  { quote: "The AI forecasting is incredibly accurate — better than any service we've tried.", name: "Michael C.", role: "Energy Consultant" },
  { quote: "Seamless setup, beautiful dashboard, and genuine cost savings.", name: "Lisa R.", role: "Sustainability Director" },
];

// ─── Main ─────────────────────────────────────────────────────────────────────
const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [tIdx, setTIdx] = useState(0);
  const recaptchaRef = useRef(null);
  const [recaptchaValue, setRecaptchaValue] = useState(null);
  const [recaptchaErr, setRecaptchaErr] = useState("");

  const navigate = useNavigate();
  const { setIsAuthenticated, setUser, login } = useContext(AuthContext);
  const api = axios.create({ baseURL: API_BASE_URL, withCredentials: true });

  React.useEffect(() => { const iv = setInterval(() => setTIdx(t => (t + 1) % testimonials.length), 5000); return () => clearInterval(iv); }, []);

  const route = (uType) => {
    switch (uType) {
      case "prosumer": navigate("/dashboard"); break;
      case "utility": navigate("/utility-dashboard"); break;
      default: navigate("/consumer-dashboard"); break;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setRecaptchaErr("");
    if (!email || !password) return setError("Please fill in all fields.");
    if (!recaptchaValue) return setRecaptchaErr("Please complete the reCAPTCHA.");
    setIsLoading(true);
    try {
      const response = await api.post("/login", { email, password, recaptchaToken: recaptchaValue });
      const payload = response.data;
      login?.({
        token: payload.token,
        persist: rememberMe,
        user: {
          name: payload.name,
          email,
          userType: payload.userType || "consumer",
          onboardingCompleted: !payload.isNewUser,
        },
      });
      localStorage.setItem("userType", payload.userType || "consumer");
      if (payload.isNewUser) setShowOnboarding(true);
      else { setIsAuthenticated(true); handlesuccess("Logged in Successfully"); route(payload.userType); }
    } catch { setError("Invalid credentials. Please try again."); recaptchaRef.current?.reset(); setRecaptchaValue(null); }
    finally { setIsLoading(false); }
  };

  const handleGoogleSuccess = (data) => {
    localStorage.setItem("userType", data.userType || data.user?.userType || "consumer");
    if (data.isNewUser) setShowOnboarding(true);
    else { setIsAuthenticated(true); route(data.userType || data.user?.userType || "consumer"); }
  };

  const handleOnboardingComplete = async (profileData) => {
    try {
      setIsLoading(true);
      const authToken = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
      const response = await api.post("/user/profile", profileData, { headers: { Authorization: `Bearer ${authToken}` } });
      localStorage.setItem("userType", profileData.userType || "consumer");
      setUser((prev) => ({
        ...(prev || {}),
        ...(response.data?.profile?.user || {}),
        userType: profileData.userType || response.data?.profile?.user?.userType || prev?.userType || "consumer",
        onboardingCompleted: true,
        profile: {
          ...(prev?.profile || {}),
          location: response.data?.profile?.location ?? profileData.location,
          energyUsage: response.data?.profile?.energyUsage ?? profileData.energyUsage,
          hasSolarPanels: response.data?.profile?.hasSolarPanels ?? profileData.hasSolarPanels,
          energySources: response.data?.profile?.energySources ?? profileData.energySources,
          walletAddress: response.data?.profile?.walletAddress ?? prev?.profile?.walletAddress,
          forecastEngine: response.data?.profile?.forecastEngine ?? prev?.profile?.forecastEngine,
          forecastZone: response.data?.profile?.forecastZone ?? prev?.profile?.forecastZone,
        },
      }));
      setShowOnboarding(false); setIsAuthenticated(true); handlesuccess("Profile created!");
      route(localStorage.getItem("userType") || "consumer");
    } catch { setError("Failed to save profile."); }
    finally { setIsLoading(false); }
  };

  return (
    <>
      <style>{css}</style>
      {showOnboarding && <OnboardingWizard onComplete={handleOnboardingComplete} isLoading={isLoading} error={error} />}

      {/* Scan line */}
      <div style={{ position: "fixed", left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${C.green}20, transparent)`, animation: "scanLine 10s linear infinite", zIndex: 1, pointerEvents: "none" }} />

      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", fontFamily: "'JetBrains Mono',monospace" }}>

        {/* ── LEFT PANEL ── */}
        <div className="split-left" style={{ flex: "0 0 52%", background: C.bg2, borderRight: `1px solid ${C.border}`, padding: "60px 48px", display: "flex", flexDirection: "column", justifyContent: "center", position: "relative", overflow: "hidden" }}>

          {/* Background glow */}
          <div style={{ position: "absolute", top: "40%", left: "40%", transform: "translate(-50%,-50%)", width: 500, height: 500, background: `radial-gradient(circle, ${C.green}07 0%, transparent 70%)`, pointerEvents: "none" }} />

          {/* Brand */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 40 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: `${C.green}20`, border: `1px solid ${C.green}40`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Zap size={18} style={{ color: C.green }} />
            </div>
            <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 20, color: C.text }}>EcoGrid</span>
            <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 3, background: `${C.green}15`, border: `1px solid ${C.green}30`, color: C.green, textTransform: "uppercase", letterSpacing: 1 }}>v2.0 Live</span>
          </div>

          <div style={{ marginBottom: 28 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 7, marginBottom: 14 }}>
              <div style={{ width: 18, height: 1, background: C.green }} />
              <span style={{ fontSize: 9, color: C.green, textTransform: "uppercase", letterSpacing: 2 }}>Live Network</span>
            </div>
            <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "clamp(1.8rem,3vw,2.5rem)", color: C.text, marginBottom: 12, lineHeight: 1.1 }}>
              The Future of <span style={{ color: C.green }}>Energy</span> Trading
            </h1>
            <p style={{ fontSize: 13, color: C.text2, lineHeight: 1.7, maxWidth: 420 }}>
              AI-powered P2P energy marketplace. Buy and sell renewable energy directly — no middlemen, full transparency.
            </p>
          </div>

          {/* Live stats */}
          <LiveTicker />

          {/* Features */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
            {features.map(({ icon: Icon, color, title, desc }) => (
              <div key={title} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: 7, background: `${color}15`, border: `1px solid ${color}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon size={14} style={{ color }} />
                </div>
                <div>
                  <p style={{ fontSize: 12, fontFamily: "'Syne',sans-serif", fontWeight: 700, color: C.text }}>{title}</p>
                  <p style={{ fontSize: 10, color: C.text3 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Testimonial */}
          <div style={{ background: C.bg3, border: `1px solid ${C.border}`, borderRadius: 8, padding: "14px 16px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${C.green}, transparent)` }} />
            <AnimatePresence mode="wait">
              <motion.div key={tIdx} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.4 }}>
                <p style={{ fontSize: 12, color: C.text2, lineHeight: 1.6, marginBottom: 10, fontStyle: "italic" }}>"{testimonials[tIdx].quote}"</p>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: `${C.green}20`, border: `1px solid ${C.green}40`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 12, color: C.green }}>
                    {testimonials[tIdx].name[0]}
                  </div>
                  <div>
                    <p style={{ fontSize: 11, fontFamily: "'Syne',sans-serif", fontWeight: 700, color: C.text }}>{testimonials[tIdx].name}</p>
                    <p style={{ fontSize: 9, color: C.text3 }}>{testimonials[tIdx].role}</p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* ── RIGHT PANEL (login form) ── */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px", minHeight: "100vh" }}>
          <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}
            style={{ width: "100%", maxWidth: 400 }}>

            {/* Header */}
            <div style={{ marginBottom: 28 }}>
              <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 26, color: C.text, marginBottom: 6 }}>Welcome back</p>
              <p style={{ fontSize: 12, color: C.text3 }}>Sign in to continue your energy journey.</p>
            </div>

            {error && <div style={{ background: `${C.red}12`, border: `1px solid ${C.red}40`, borderRadius: 5, padding: "10px 12px", color: C.red, fontSize: 12, marginBottom: 18 }}>⚠ {error}</div>}

            <form onSubmit={handleSubmit}>
              <Field label="Email Address" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" icon={({ style }) => <div style={style}>📧</div>} />
              <Field label="Password" type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                icon={({ style }) => <div style={style}>🔒</div>}
                suffix={
                  <motion.button type="button" onClick={() => setShowPw(!showPw)} whileHover={{ scale: 1.1 }} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", display: "flex" }}>
                    {showPw ? <EyeOff size={14} style={{ color: C.text3 }} /> : <Eye size={14} style={{ color: C.text3 }} />}
                  </motion.button>
                } />

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 7, cursor: "pointer", fontSize: 11, color: C.text2 }}>
                  <input type="checkbox" checked={rememberMe} onChange={() => setRememberMe(!rememberMe)} style={{ accentColor: C.green }} />
                  Remember me
                </label>
                <Link to="/forgot-password" style={{ fontSize: 11, color: C.green, textDecoration: "none" }}>Forgot password?</Link>
              </div>

              {/* reCAPTCHA */}
              <div style={{ marginBottom: 16, transform: "scale(.9)", transformOrigin: "left" }}>
                {RECAPTCHA_SITE_KEY ? (
                  <ReCAPTCHA ref={recaptchaRef} sitekey={RECAPTCHA_SITE_KEY}
                    onChange={v => { setRecaptchaValue(v); setRecaptchaErr(""); }}
                    onExpired={() => { setRecaptchaValue(null); setRecaptchaErr("reCAPTCHA expired."); }} />
                ) : (
                  <p style={{ color: C.red, fontSize: 10 }}>reCAPTCHA not configured. Set VITE_RECAPTCHA_SITE_KEY.</p>
                )}
                {recaptchaErr && <p style={{ color: C.red, fontSize: 10, marginTop: 4 }}>{recaptchaErr}</p>}
              </div>

              <motion.button type="submit" disabled={isLoading} whileHover={{ scale: 1.02, boxShadow: `0 0 24px ${C.green}35` }} whileTap={{ scale: 0.98 }}
                style={{ width: "100%", padding: "12px 0", background: isLoading ? C.border : `linear-gradient(135deg,${C.green},#00b4d8)`, border: "none", borderRadius: 6, color: "#060810", fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: 0.8, textTransform: "uppercase", cursor: isLoading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                {isLoading ? "Signing In…" : <>Sign In <ArrowRight size={14} /></>}
              </motion.button>
            </form>

            <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "20px 0 16px" }}>
              <div style={{ flex: 1, height: 1, background: C.border }} />
              <span style={{ fontSize: 10, color: C.text3 }}>or continue with</span>
              <div style={{ flex: 1, height: 1, background: C.border }} />
            </div>

            <GoogleSignIn onSuccess={handleGoogleSuccess} onError={setError} />

            <p style={{ textAlign: "center", marginTop: 20, fontSize: 12, color: C.text2 }}>
              Don't have an account?{" "}
              <Link to="/register" style={{ color: C.green, textDecoration: "none", fontWeight: 600 }}>Create account</Link>
            </p>

            {/* Trust badges */}
            <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 24 }}>
              {[{ icon: Shield, label: "SSL Secured" }, { icon: Leaf, label: "Carbon Neutral" }, { icon: Zap, label: "Live Grid" }].map(({ icon: Icon, label }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 9, color: C.text3 }}>
                  <Icon size={10} style={{ color: C.green }} /> {label}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;
