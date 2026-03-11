// RegisterPage.jsx — dark theme matching EnergyForecast
import React, { useState, useEffect, useRef, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import ReCAPTCHA from "react-google-recaptcha";
import NavBar from "./NavBar";
import GoogleSignIn from "../components/GoogleSignIn";
import { AuthContext } from "../Context/AuthContext";
import { handlesuccess } from "../../utils";
import { API_BASE_URL } from "../config";
import {
  MapPin, Zap, Home, Building2, Sun, BatteryCharging,
  CheckCircle, ChevronRight, ChevronLeft, Navigation, Wind, Leaf
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
  @keyframes floatUp{0%{transform:translateY(0);opacity:.15}100%{transform:translateY(-120px);opacity:0}}
  @keyframes scanLine{0%{top:-4px}100%{top:100%}}
  @keyframes pop{0%{transform:scale(0) rotate(-20deg)}70%{transform:scale(1.15) rotate(4deg)}100%{transform:scale(1) rotate(0)}}
  * { box-sizing: border-box; }
  input, select, textarea { outline: none; transition: border-color .2s; }
  input:focus, select:focus { border-color: ${C.green}80 !important; }
`;

const api = axios.create({ baseURL: API_BASE_URL, withCredentials: true });

// ─── Field component ──────────────────────────────────────────────────────────
const Field = ({ label, type = "text", value, onChange, placeholder, icon, error, children }) => (
  <div>
    <p style={{ fontSize: 9, color: C.text3, textTransform: "uppercase", letterSpacing: 1, marginBottom: 5 }}>{label}</p>
    {children || (
      <div style={{ position: "relative" }}>
        {icon && <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13, pointerEvents: "none" }}>{icon}</span>}
        <input type={type} value={value} onChange={onChange} placeholder={placeholder}
          style={{ width: "100%", padding: icon ? "8px 12px 8px 30px" : "8px 12px", background: C.bg3, border: `1px solid ${error ? C.red : C.border2}`, borderRadius: 4, color: C.text, fontFamily: "'JetBrains Mono',monospace", fontSize: 12 }} />
      </div>
    )}
    {error && <p style={{ fontSize: 10, color: C.red, marginTop: 3 }}>{error}</p>}
  </div>
);

// ─── Step progress bar ─────────────────────────────────────────────────────────
const StepBar = ({ current, total, labels }) => (
  <div style={{ marginBottom: 28 }}>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0 }}>
      {labels.map((label, i) => (
        <React.Fragment key={i}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <motion.div
              animate={{ background: i < current ? C.green : i === current ? `${C.green}30` : C.bg3, borderColor: i <= current ? C.green : C.border2, scale: i === current ? 1.15 : 1 }}
              transition={{ duration: 0.3 }}
              style={{ width: 28, height: 28, borderRadius: "50%", border: `2px solid`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontFamily: "'Syne',sans-serif", fontWeight: 700, color: i < current ? "#060810" : i === current ? C.green : C.text3, zIndex: 1 }}>
              {i < current ? <CheckCircle size={13} /> : i + 1}
            </motion.div>
            <span style={{ fontSize: 8, color: i <= current ? C.green : C.text3, textTransform: "uppercase", letterSpacing: 0.8, fontFamily: "'JetBrains Mono',monospace", whiteSpace: "nowrap" }}>{label}</span>
          </div>
          {i < total - 1 && (
            <div style={{ flex: 1, height: 2, background: C.border, margin: "0 4px", marginBottom: 14, position: "relative", minWidth: 24 }}>
              <motion.div animate={{ width: i < current ? "100%" : "0%" }} transition={{ duration: 0.4 }} style={{ position: "absolute", top: 0, left: 0, height: "100%", background: C.green, borderRadius: 1 }} />
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  </div>
);

// ─── Role card ────────────────────────────────────────────────────────────────
const RoleCard = ({ id, label, desc, icon: Icon, color, selected, onClick }) => (
  <motion.button type="button" onClick={() => onClick(id)}
    whileHover={{ y: -4, borderColor: color + "80" }}
    whileTap={{ scale: 0.97 }}
    style={{ flex: "1 1 130px", padding: "18px 12px", borderRadius: 8, border: `2px solid ${selected ? color : C.border}`, background: selected ? `${color}12` : C.bg3, cursor: "pointer", textAlign: "center", position: "relative", overflow: "hidden", transition: "border-color .2s, background .2s" }}>
    {selected && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />}
    <div style={{ width: 44, height: 44, borderRadius: 10, background: `${color}18`, border: `1px solid ${color}30`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
      <Icon size={20} style={{ color: selected ? color : C.text3 }} />
    </div>
    <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 13, color: selected ? color : C.text, marginBottom: 5 }}>{label}</p>
    <p style={{ fontSize: 10, color: C.text3, lineHeight: 1.4, fontFamily: "'JetBrains Mono',monospace" }}>{desc}</p>
    {selected && (
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ position: "absolute", top: 8, right: 8 }}>
        <CheckCircle size={14} style={{ color }} />
      </motion.div>
    )}
  </motion.button>
);

// ─── Energy source card ────────────────────────────────────────────────────────
const SourceCard = ({ id, label, icon: Icon, color, selected, onClick }) => (
  <motion.button type="button" onClick={() => onClick(id)}
    whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
    style={{ padding: "12px 10px", borderRadius: 8, border: `1px solid ${selected ? color : C.border}`, background: selected ? `${color}15` : C.bg3, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flex: "1 1 80px", transition: "all .2s" }}>
    <Icon size={20} style={{ color: selected ? color : C.text3 }} />
    <span style={{ fontSize: 10, color: selected ? color : C.text3, fontFamily: "'JetBrains Mono',monospace", textAlign: "center" }}>{label}</span>
  </motion.button>
);

// ─── kWh Slider ───────────────────────────────────────────────────────────────
const KwhSlider = ({ value, onChange }) => {
  const marks = [100, 200, 300, 500, 750, 1000];
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontSize: 9, color: C.text3, textTransform: "uppercase", letterSpacing: 1 }}>Monthly Usage</span>
        <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 16, color: C.green }}>{value} <span style={{ fontSize: 10, color: C.text3, fontWeight: 400 }}>kWh</span></span>
      </div>
      <input type="range" min={50} max={1200} step={10} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: "100%", accentColor: C.green, cursor: "pointer", marginBottom: 8 }} />
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        {marks.map(m => (
          <span key={m} style={{ fontSize: 9, color: value >= m - 30 && value <= m + 30 ? C.green : C.text3, fontFamily: "'JetBrains Mono',monospace" }}>{m}</span>
        ))}
      </div>
      <div style={{ marginTop: 10, padding: "8px 12px", background: C.bg, borderRadius: 4, border: `1px solid ${C.border}`, fontSize: 11, color: C.text2 }}>
        {value < 200 ? "🏠 Very low — likely a small apartment" : value < 400 ? "🏡 Average household consumption" : value < 600 ? "🏘 Above average — large home or light commercial" : "🏢 High — commercial or industrial level"}
      </div>
    </div>
  );
};

// ─── Onboarding overlay ────────────────────────────────────────────────────────
const OnboardingWizard = ({ onComplete, isLoading, error }) => {
  const [step, setStep] = useState(0);
  const [data, setData] = useState({ role: "", location: "", energyUsage: 300, hasSolarPanels: null, energySources: [], gridConnected: true });
  const [locLoading, setLocLoading] = useState(false);

  const STEPS = ["Role", "Location", "Energy", "Ready"];

  const detectLocation = async () => {
    if (!navigator.geolocation) return;
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(async ({ coords: { latitude, longitude } }) => {
      try {
        const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
        const d = await r.json();
        if (d.address) {
          const loc = [d.address.city || d.address.town, d.address.state, d.address.country].filter(Boolean).join(", ");
          setData(p => ({ ...p, location: loc }));
        }
      } catch {}
      finally { setLocLoading(false); }
    }, () => setLocLoading(false));
  };

  const toggleSource = (src) => {
    setData(p => ({ ...p, energySources: p.energySources.includes(src) ? p.energySources.filter(s => s !== src) : [...p.energySources, src] }));
  };

  const canNext = [
    () => !!data.role,
    () => !!data.location.trim(),
    () => data.hasSolarPanels !== null,
  ];

  const slideVariants = {
    enter: (dir) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir) => ({ x: dir < 0 ? 60 : -60, opacity: 0 }),
  };
  const [dir, setDir] = useState(1);
  const go = (n) => { setDir(n > step ? 1 : -1); setStep(n); };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(6,8,16,.92)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "16px" }}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 160, damping: 20 }}
        style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 12, padding: "28px 28px 24px", width: "100%", maxWidth: 500, position: "relative", overflow: "hidden", boxShadow: `0 0 80px ${C.green}12` }}>

        {/* Top accent */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${C.green}, ${C.blue}, transparent)` }} />

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: `${C.green}20`, border: `1px solid ${C.green}40`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Zap size={16} style={{ color: C.green }} />
          </div>
          <div>
            <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 14, color: C.text }}>EcoGrid Setup</p>
            <p style={{ fontSize: 9, color: C.text3, textTransform: "uppercase", letterSpacing: 1 }}>Step {step + 1} of {STEPS.length}</p>
          </div>
        </div>

        <StepBar current={step} total={STEPS.length} labels={STEPS} />

        {/* Steps */}
        <div style={{ minHeight: 280, position: "relative", overflow: "hidden" }}>
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div key={step} custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.28, ease: "easeInOut" }}>

              {/* STEP 0 — Role */}
              {step === 0 && (
                <div>
                  <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 17, color: C.text, marginBottom: 6 }}>How do you use energy?</p>
                  <p style={{ fontSize: 11, color: C.text2, marginBottom: 20, fontFamily: "'JetBrains Mono',monospace" }}>Choose the role that best describes you. This tailors your EcoGrid experience.</p>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <RoleCard id="prosumer" label="Prosumer" desc="I produce & sell excess energy" icon={Zap} color={C.green} selected={data.role === "prosumer"} onClick={v => setData(p => ({ ...p, role: v }))} />
                    <RoleCard id="consumer" label="Consumer" desc="I buy clean energy for my home" icon={Home} color={C.blue} selected={data.role === "consumer"} onClick={v => setData(p => ({ ...p, role: v }))} />
                    <RoleCard id="utility" label="Utility" desc="I manage grid infrastructure" icon={Building2} color={C.purple} selected={data.role === "utility"} onClick={v => setData(p => ({ ...p, role: v }))} />
                  </div>
                </div>
              )}

              {/* STEP 1 — Location */}
              {step === 1 && (
                <div>
                  <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 17, color: C.text, marginBottom: 6 }}>Where are you located?</p>
                  <p style={{ fontSize: 11, color: C.text2, marginBottom: 20, fontFamily: "'JetBrains Mono',monospace" }}>Your location helps us show local energy pricing, solar potential, and nearby prosumers.</p>
                  <div style={{ position: "relative", marginBottom: 12 }}>
                    <MapPin size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: data.location ? C.green : C.text3 }} />
                    <input value={data.location} onChange={e => setData(p => ({ ...p, location: e.target.value }))} placeholder="City, State, Country"
                      style={{ width: "100%", padding: "10px 12px 10px 32px", background: C.bg3, border: `1px solid ${data.location ? C.green + "60" : C.border2}`, borderRadius: 6, color: C.text, fontFamily: "'JetBrains Mono',monospace", fontSize: 13 }} />
                  </div>
                  <motion.button type="button" onClick={detectLocation} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} disabled={locLoading}
                    style={{ width: "100%", padding: "10px", background: `${C.blue}15`, border: `1px solid ${C.blue}40`, borderRadius: 6, color: C.blue, fontSize: 12, cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 16 }}>
                    <Navigation size={13} /> {locLoading ? "Detecting…" : "Auto-detect my location"}
                  </motion.button>
                  {data.location && (
                    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                      style={{ padding: "10px 14px", background: `${C.green}10`, border: `1px solid ${C.green}30`, borderRadius: 6, fontSize: 12, color: C.green, display: "flex", gap: 8, alignItems: "center" }}>
                      <CheckCircle size={13} /> Detected: <strong>{data.location}</strong>
                    </motion.div>
                  )}
                </div>
              )}

              {/* STEP 2 — Energy profile */}
              {step === 2 && (
                <div>
                  <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 17, color: C.text, marginBottom: 6 }}>Your energy profile</p>
                  <p style={{ fontSize: 11, color: C.text2, marginBottom: 20, fontFamily: "'JetBrains Mono',monospace" }}>This lets us personalise your dashboard and trading recommendations.</p>

                  <div style={{ marginBottom: 20 }}>
                    <KwhSlider value={data.energyUsage} onChange={v => setData(p => ({ ...p, energyUsage: v }))} />
                  </div>

                  <p style={{ fontSize: 9, color: C.text3, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Energy sources (select all that apply)</p>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
                    <SourceCard id="solar" label="Solar" icon={Sun} color={C.yellow} selected={data.energySources.includes("solar")} onClick={toggleSource} />
                    <SourceCard id="wind" label="Wind" icon={Wind} color={C.blue} selected={data.energySources.includes("wind")} onClick={toggleSource} />
                    <SourceCard id="battery" label="Battery" icon={BatteryCharging} color={C.green} selected={data.energySources.includes("battery")} onClick={toggleSource} />
                    <SourceCard id="grid" label="Grid Only" icon={Zap} color={C.text3} selected={data.energySources.includes("grid")} onClick={toggleSource} />
                  </div>

                  <p style={{ fontSize: 9, color: C.text3, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Solar panels installed?</p>
                  <div style={{ display: "flex", gap: 8 }}>
                    {[{ v: true, label: "Yes, I have solar", color: C.yellow }, { v: false, label: "No solar yet", color: C.text3 }].map(({ v, label, color }) => (
                      <motion.button type="button" key={String(v)} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                        onClick={() => setData(p => ({ ...p, hasSolarPanels: v }))}
                        style={{ flex: 1, padding: "9px", border: `1px solid ${data.hasSolarPanels === v ? color : C.border}`, borderRadius: 6, background: data.hasSolarPanels === v ? `${color}18` : C.bg3, color: data.hasSolarPanels === v ? color : C.text2, fontSize: 11, cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "all .2s" }}>
                        {v ? <Sun size={12} /> : <Zap size={12} />} {label}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 3 — Done */}
              {step === 3 && (
                <div style={{ textAlign: "center", paddingTop: 20 }}>
                  <motion.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 200, damping: 14 }}
                    style={{ width: 72, height: 72, borderRadius: "50%", background: `${C.green}20`, border: `2px solid ${C.green}60`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", boxShadow: `0 0 40px ${C.green}30` }}>
                    <CheckCircle size={36} style={{ color: C.green }} />
                  </motion.div>
                  <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 20, color: C.text, marginBottom: 10 }}>You're all set!</p>
                  <p style={{ fontSize: 12, color: C.text2, lineHeight: 1.7, marginBottom: 20, fontFamily: "'JetBrains Mono',monospace" }}>
                    Welcome to the EcoGrid community, <strong style={{ color: C.green }}>{data.role}</strong>.<br />
                    Your profile is ready — let's start trading clean energy.
                  </p>
                  {/* Summary pills */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginBottom: 20 }}>
                    {[
                      { label: data.role, color: data.role === "prosumer" ? C.green : data.role === "consumer" ? C.blue : C.purple },
                      { label: data.location.split(",")[0], color: C.yellow },
                      { label: `${data.energyUsage} kWh/mo`, color: C.blue },
                      ...(data.hasSolarPanels ? [{ label: "Solar ☀", color: C.yellow }] : []),
                    ].map(({ label, color }) => (
                      <span key={label} style={{ fontSize: 10, padding: "3px 12px", borderRadius: 3, background: `${color}18`, border: `1px solid ${color}40`, color, fontFamily: "'JetBrains Mono',monospace" }}>{label}</span>
                    ))}
                  </div>
                  {error && <div style={{ background: `${C.red}12`, border: `1px solid ${C.red}40`, borderRadius: 4, padding: "9px 12px", color: C.red, fontSize: 12, marginBottom: 14 }}>⚠ {error}</div>}
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>

        {/* Nav buttons */}
        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          {step > 0 && step < 3 && (
            <motion.button type="button" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => go(step - 1)}
              style={{ padding: "10px 16px", background: "transparent", border: `1px solid ${C.border2}`, borderRadius: 6, color: C.text2, fontSize: 12, cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", display: "flex", alignItems: "center", gap: 6 }}>
              <ChevronLeft size={13} /> Back
            </motion.button>
          )}
          {step < 3 ? (
            <motion.button type="button" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => go(step + 1)} disabled={!canNext[step]?.()}
              style={{ flex: 1, padding: "10px 0", background: canNext[step]?.() ? `linear-gradient(135deg, ${C.green}, #00b4d8)` : C.border, border: "none", borderRadius: 6, color: canNext[step]?.() ? "#060810" : C.text3, fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 13, cursor: canNext[step]?.() ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, letterSpacing: 0.5 }}>
              {step === 2 ? "Review" : "Continue"} <ChevronRight size={14} />
            </motion.button>
          ) : (
            <motion.button type="button" whileHover={{ scale: 1.03, boxShadow: `0 0 24px ${C.green}40` }} whileTap={{ scale: 0.97 }}
              onClick={() => onComplete({ location: data.location, energyUsage: data.energyUsage, hasSolarPanels: data.hasSolarPanels, energySources: data.energySources })}
              disabled={isLoading}
              style={{ flex: 1, padding: "12px 0", background: isLoading ? C.border : `linear-gradient(135deg, ${C.green}, #00b4d8)`, border: "none", borderRadius: 6, color: "#060810", fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 13, cursor: isLoading ? "not-allowed" : "pointer", letterSpacing: 0.5 }}>
              {isLoading ? "Saving…" : "Enter EcoGrid →"}
            </motion.button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

// ─── Main RegisterPage ─────────────────────────────────────────────────────────
const RegisterPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [userType, setUserType] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [recaptchaToken, setRecaptchaToken] = useState("");
  const recaptchaRef = useRef(null);
  const navigate = useNavigate();
  const { setIsAuthenticated } = useContext(AuthContext);

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (!password) { setPasswordStrength(0); return; }
    let s = 0;
    if (password.length >= 8) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[a-z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    setPasswordStrength(s);
  }, [password]);

  const strengthColor = passwordStrength <= 1 ? C.red : passwordStrength <= 3 ? C.yellow : C.green;
  const strengthLabel = ["", "Very Weak", "Weak", "Moderate", "Strong", "Very Strong"][passwordStrength] || "";

  const validate = () => {
    const errs = {};
    if (!name.trim()) errs.name = "Required";
    if (!email || !/\S+@\S+\.\S+/.test(email)) errs.email = "Invalid email";
    if (!password || password.length < 8) errs.password = "Min 8 characters";
    else if (passwordStrength < 3) errs.password = "Use a stronger password";
    if (password !== confirmPassword) errs.confirmPassword = "Passwords don't match";
    if (!userType) errs.userType = "Select a type";
    if (!recaptchaToken) errs.recaptcha = "Complete the reCAPTCHA";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!validate()) return;
    setIsLoading(true);
    try {
      await api.post("/register", { email, password, name, userType, recaptchaToken });
      setSuccess("Account created! Redirecting…");
      setTimeout(() => navigate("/login"), 1800);
    } catch (err) {
      if (err.response?.data?.error === "recaptcha-failed") { setError("reCAPTCHA failed. Try again."); recaptchaRef.current?.reset(); setRecaptchaToken(""); }
      else setError(err.response?.data?.message || "Registration failed.");
    } finally { setIsLoading(false); }
  };

  const handleGoogleSuccess = (data) => {
    if (data.isNewUser) setShowOnboarding(true);
    else { setIsAuthenticated(true); handlesuccess("Logged in"); navigate("/dashboard"); }
  };

  const handleOnboardingComplete = async (profileData) => {
    try {
      setIsLoading(true);
      const authToken = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
      await api.post("/user/profile", profileData, { headers: { Authorization: `Bearer ${authToken}` } });
      setShowOnboarding(false); setIsAuthenticated(true); handlesuccess("Profile created!"); navigate("/dashboard");
    } catch { setError("Failed to save profile."); }
    finally { setIsLoading(false); }
  };

  const userTypes = [
    { id: "prosumer", label: "Prosumer", icon: Zap, color: C.green },
    { id: "consumer", label: "Consumer", icon: Home, color: C.blue },
    { id: "utility", label: "Utility", icon: Building2, color: C.purple },
  ];

  return (
    <>
      <style>{css}</style>
      <NavBar />

      {showOnboarding && <OnboardingWizard onComplete={handleOnboardingComplete} isLoading={isLoading} error={error} />}

      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 16px 40px", position: "relative", overflow: "hidden", fontFamily: "'JetBrains Mono',monospace" }}>

        {[Zap, Leaf, BatteryCharging, Sun, Wind].map((Icon, i) => (
          <div key={i} style={{ position: "absolute", left: `${8 + i * 18}%`, bottom: "8%", opacity: 0.06, animation: `floatUp ${10 + i * 2}s linear ${i * 1.4}s infinite`, pointerEvents: "none" }}>
            <Icon size={22} color={C.green} />
          </div>
        ))}

        <div style={{ position: "absolute", top: "30%", left: "50%", transform: "translate(-50%,-50%)", width: 600, height: 600, background: `radial-gradient(circle, ${C.green}06 0%, transparent 70%)`, pointerEvents: "none" }} />

        <motion.div initial={{ opacity: 0, y: 30, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.5 }}
          style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "28px 28px 24px", maxWidth: 500, width: "100%", boxShadow: "0 40px 80px rgba(0,0,0,.6)", position: "relative", zIndex: 10, overflow: "hidden" }}>

          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${C.green}, ${C.blue}, transparent)` }} />

          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 22 }}>
            <motion.div whileHover={{ scale: 1.08, rotate: -5 }}
              style={{ width: 46, height: 46, background: `${C.green}20`, border: `1px solid ${C.green}44`, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
              <Zap size={20} style={{ color: C.green }} />
            </motion.div>
            <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 20, color: C.text, marginBottom: 4 }}>Create Account</p>
            <p style={{ fontSize: 11, color: C.text3 }}>Join the sustainable energy revolution</p>
          </div>

          {error && <div style={{ background: `${C.red}12`, border: `1px solid ${C.red}40`, borderRadius: 4, padding: "9px 12px", color: C.red, fontSize: 12, marginBottom: 14 }}>⚠ {error}</div>}
          {success && <div style={{ background: `${C.green}12`, border: `1px solid ${C.green}40`, borderRadius: 4, padding: "9px 12px", color: C.green, fontSize: 12, marginBottom: 14 }}>✓ {success}</div>}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Field label="Full Name" value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" icon="👤" error={formErrors.name} />
              <Field label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" icon="📧" error={formErrors.email} />
            </div>

            {/* User type — interactive cards */}
            <div>
              <p style={{ fontSize: 9, color: formErrors.userType ? C.red : C.text3, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Account Type {formErrors.userType && `— ${formErrors.userType}`}</p>
              <div style={{ display: "flex", gap: 8 }}>
                {userTypes.map(({ id, label, icon: Icon, color }) => (
                  <motion.button key={id} type="button" onClick={() => setUserType(id)} whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }}
                    style={{ flex: 1, padding: "10px 6px", borderRadius: 6, border: `1px solid ${userType === id ? color : C.border}`, background: userType === id ? `${color}15` : C.bg3, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 5, transition: "all .2s" }}>
                    <Icon size={14} style={{ color: userType === id ? color : C.text3 }} />
                    <span style={{ fontSize: 10, color: userType === id ? color : C.text2, fontFamily: "'JetBrains Mono',monospace" }}>{label}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <Field label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" icon="🔒" error={formErrors.password} />
                {password && (
                  <div style={{ marginTop: 5 }}>
                    <div style={{ height: 3, background: C.border, borderRadius: 2, overflow: "hidden" }}>
                      <motion.div animate={{ width: `${(passwordStrength / 5) * 100}%` }} style={{ height: "100%", background: strengthColor, borderRadius: 2 }} />
                    </div>
                    <p style={{ fontSize: 9, color: strengthColor, marginTop: 2 }}>{strengthLabel}</p>
                  </div>
                )}
              </div>
              <Field label="Confirm Password" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" icon="🔐" error={formErrors.confirmPassword} />
            </div>

            <div style={{ marginTop: 4, transform: "scale(.88)", transformOrigin: "left" }}>
              {RECAPTCHA_SITE_KEY ? (
                <ReCAPTCHA ref={recaptchaRef} sitekey={RECAPTCHA_SITE_KEY}
                  onChange={v => { setRecaptchaToken(v); setFormErrors(p => ({ ...p, recaptcha: "" })); }}
                  onExpired={() => { setRecaptchaToken(""); setFormErrors(p => ({ ...p, recaptcha: "Expired, verify again." })); }} />
              ) : (
                <p style={{ fontSize: 10, color: C.red }}>reCAPTCHA not configured. Set VITE_RECAPTCHA_SITE_KEY.</p>
              )}
              {formErrors.recaptcha && <p style={{ fontSize: 10, color: C.red, marginTop: 3 }}>{formErrors.recaptcha}</p>}
            </div>

            <motion.button type="submit" disabled={isLoading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              style={{ padding: "11px 0", background: isLoading ? C.border : `linear-gradient(135deg,${C.green},#00b4d8)`, border: "none", borderRadius: 6, color: "#060810", fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: 1, textTransform: "uppercase", cursor: isLoading ? "not-allowed" : "pointer" }}>
              {isLoading ? "Creating Account…" : "Create Account →"}
            </motion.button>
          </form>

          <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "18px 0 14px" }}>
            <div style={{ flex: 1, height: 1, background: C.border }} />
            <span style={{ fontSize: 10, color: C.text3 }}>or sign up with</span>
            <div style={{ flex: 1, height: 1, background: C.border }} />
          </div>
          <GoogleSignIn onSuccess={handleGoogleSuccess} onError={setError} userType={userType || "consumer"} buttonText="Sign up with Google" />

          <p style={{ textAlign: "center", marginTop: 18, fontSize: 12, color: C.text2 }}>
            Already have an account?{" "}
            <Link to="/login" style={{ color: C.green, textDecoration: "none", fontWeight: 600 }}>Sign in</Link>
          </p>
        </motion.div>
      </div>
    </>
  );
};

export default RegisterPage;
