import React, { useContext, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../Context/AuthContext";
import { API_BASE_URL } from "../config";
import { handlesuccess } from "../../utils";
import {
  BatteryCharging,
  Building2,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Home,
  MapPin,
  Navigation,
  Sun,
  Wind,
  Zap,
} from "lucide-react";

const C = {
  bg: "#060810", bg2: "#0c0f1a", bg3: "#111525",
  border: "#1e2440", border2: "#2a3155",
  text: "#e8eaf6", text2: "#8892b0", text3: "#4a5568",
  green: "#00e5a0", red: "#ff4d6d", yellow: "#ffd166", blue: "#4d9fff", purple: "#a78bfa",
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=JetBrains+Mono:wght@300;400;500&display=swap');
  * { box-sizing: border-box; }
  input { outline: none; transition: border-color .2s; }
  input:focus { border-color: ${C.green}80 !important; }
`;

const StepBar = ({ current, labels }) => (
  <div style={{ marginBottom: 24 }}>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0 }}>
      {labels.map((label, i) => (
        <React.Fragment key={label}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <motion.div
              animate={{ background: i < current ? C.green : i === current ? `${C.green}30` : C.bg3, borderColor: i <= current ? C.green : C.border2 }}
              style={{ width: 26, height: 26, borderRadius: "50%", border: "2px solid", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontFamily: "'Syne',sans-serif", fontWeight: 700, color: i < current ? "#060810" : i === current ? C.green : C.text3 }}
            >
              {i < current ? <CheckCircle size={12} /> : i + 1}
            </motion.div>
            <span style={{ fontSize: 8, color: i <= current ? C.green : C.text3, textTransform: "uppercase", letterSpacing: 0.8, whiteSpace: "nowrap" }}>{label}</span>
          </div>
          {i < labels.length - 1 && (
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
  </motion.button>
);

const SourceCard = ({ id, label, icon: Icon, color, selected, onClick }) => (
  <motion.button type="button" onClick={() => onClick(id)} whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
    style={{ padding: "10px 8px", borderRadius: 7, border: `1px solid ${selected ? color : C.border}`, background: selected ? `${color}15` : C.bg3, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 5, flex: "1 1 70px" }}>
    <Icon size={16} style={{ color: selected ? color : C.text3 }} />
    <span style={{ fontSize: 9, color: selected ? color : C.text3, fontFamily: "'JetBrains Mono',monospace" }}>{label}</span>
  </motion.button>
);

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user, setUser, setIsAuthenticated } = useContext(AuthContext);
  const api = useMemo(() => axios.create({ baseURL: API_BASE_URL, withCredentials: true }), []);
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [locLoading, setLocLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState({
    role: user?.userType || "",
    location: user?.profile?.location || "",
    energyUsage: user?.profile?.energyUsage || 300,
    hasSolarPanels: user?.profile?.hasSolarPanels ?? null,
    energySources: user?.profile?.energySources || [],
  });

  const steps = ["Role", "Location", "Energy", "Ready"];
  const canNext = [() => !!data.role, () => !!data.location.trim(), () => data.hasSolarPanels !== null];
  const go = (n) => { setDir(n > step ? 1 : -1); setStep(n); };
  const slideV = { enter: (d) => ({ x: d > 0 ? 50 : -50, opacity: 0 }), center: { x: 0, opacity: 1 }, exit: (d) => ({ x: d < 0 ? 50 : -50, opacity: 0 }) };

  const detectLocation = async () => {
    setLocLoading(true);
    navigator.geolocation?.getCurrentPosition(async ({ coords: { latitude, longitude } }) => {
      try {
        const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
        const d = await r.json();
        if (d.address) {
          const loc = [d.address.city || d.address.town, d.address.state, d.address.country].filter(Boolean).join(", ");
          setData((p) => ({ ...p, location: loc }));
        }
      } catch {}
      finally { setLocLoading(false); }
    }, () => setLocLoading(false));
  };

  const toggleSource = (src) => setData((p) => ({ ...p, energySources: p.energySources.includes(src) ? p.energySources.filter((s) => s !== src) : [...p.energySources, src] }));

  const completeOnboarding = async () => {
    try {
      setIsSaving(true);
      setError("");
      const authToken = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
      const response = await api.post("/user/profile", {
        userType: data.role,
        location: data.location,
        energyUsage: data.energyUsage,
        hasSolarPanels: data.hasSolarPanels,
        energySources: data.energySources,
      }, { headers: { Authorization: `Bearer ${authToken}` } });

      localStorage.setItem("userType", data.role || "consumer");
      setUser((prev) => ({
        ...(prev || {}),
        ...(response.data?.profile?.user || {}),
        userType: data.role || response.data?.profile?.user?.userType || prev?.userType || "consumer",
        onboardingCompleted: true,
        profile: {
          ...(prev?.profile || {}),
          location: response.data?.profile?.location ?? data.location,
          energyUsage: response.data?.profile?.energyUsage ?? data.energyUsage,
          hasSolarPanels: response.data?.profile?.hasSolarPanels ?? data.hasSolarPanels,
          energySources: response.data?.profile?.energySources ?? data.energySources,
          walletAddress: response.data?.profile?.walletAddress ?? prev?.profile?.walletAddress,
          forecastEngine: response.data?.profile?.forecastEngine ?? prev?.profile?.forecastEngine,
          forecastZone: response.data?.profile?.forecastZone ?? prev?.profile?.forecastZone,
        },
      }));
      setIsAuthenticated(true);
      handlesuccess("Profile created!");
      navigate("/dashboard", { replace: true });
    } catch {
      setError("Failed to save profile.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <style>{css}</style>
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, fontFamily: "'JetBrains Mono',monospace" }}>
        <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 160, damping: 20 }}
          style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 12, padding: "26px 26px 22px", width: "100%", maxWidth: 480, position: "relative", overflow: "hidden", boxShadow: `0 0 80px ${C.green}12` }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${C.green}, ${C.blue}, transparent)` }} />
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: `${C.green}20`, border: `1px solid ${C.green}40`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Zap size={15} style={{ color: C.green }} />
            </div>
            <div>
              <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 13, color: C.text }}>Complete Onboarding</p>
              <p style={{ fontSize: 9, color: C.text3, textTransform: "uppercase", letterSpacing: 1 }}>Step {step + 1} of {steps.length}</p>
            </div>
          </div>

          <StepBar current={step} labels={steps} />

          <div style={{ minHeight: 260, overflow: "hidden" }}>
            <AnimatePresence mode="wait" custom={dir}>
              <motion.div key={step} custom={dir} variants={slideV} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
                {step === 0 && (
                  <div>
                    <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 5 }}>How do you use energy?</p>
                    <p style={{ fontSize: 11, color: C.text2, marginBottom: 16 }}>This personalises your EcoGrid experience.</p>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <RoleCard id="prosumer" label="Prosumer" desc="Produce & sell energy" icon={Zap} color={C.green} selected={data.role === "prosumer"} onClick={(v) => setData((p) => ({ ...p, role: v }))} />
                      <RoleCard id="consumer" label="Consumer" desc="Buy clean energy" icon={Home} color={C.blue} selected={data.role === "consumer"} onClick={(v) => setData((p) => ({ ...p, role: v }))} />
                      <RoleCard id="utility" label="Utility" desc="Grid management" icon={Building2} color={C.purple} selected={data.role === "utility"} onClick={(v) => setData((p) => ({ ...p, role: v }))} />
                    </div>
                  </div>
                )}
                {step === 1 && (
                  <div>
                    <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 5 }}>Where are you located?</p>
                    <p style={{ fontSize: 11, color: C.text2, marginBottom: 16 }}>Helps us show local pricing and nearby prosumers.</p>
                    <div style={{ position: "relative", marginBottom: 10 }}>
                      <MapPin size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: data.location ? C.green : C.text3 }} />
                      <input value={data.location} onChange={(e) => setData((p) => ({ ...p, location: e.target.value }))} placeholder="City, State, Country"
                        style={{ width: "100%", padding: "10px 12px 10px 30px", background: C.bg3, border: `1px solid ${data.location ? C.green + "60" : C.border2}`, borderRadius: 6, color: C.text, fontFamily: "'JetBrains Mono',monospace", fontSize: 12 }} />
                    </div>
                    <motion.button type="button" onClick={detectLocation} whileHover={{ scale: 1.02 }} disabled={locLoading}
                      style={{ width: "100%", padding: "9px", background: `${C.blue}15`, border: `1px solid ${C.blue}40`, borderRadius: 5, color: C.blue, fontSize: 11, cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, marginBottom: 12 }}>
                      <Navigation size={11} /> {locLoading ? "Detecting..." : "Auto-detect location"}
                    </motion.button>
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
                      <input type="range" min={50} max={1200} step={10} value={data.energyUsage} onChange={(e) => setData((p) => ({ ...p, energyUsage: Number(e.target.value) }))}
                        style={{ width: "100%", accentColor: C.green, cursor: "pointer", marginBottom: 6 }} />
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
                      {[{ v: true, label: "Yes" }, { v: false, label: "No" }].map(({ v, label }) => (
                        <motion.button key={String(v)} type="button" whileHover={{ scale: 1.03 }} onClick={() => setData((p) => ({ ...p, hasSolarPanels: v }))}
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
              <motion.button type="button" whileHover={{ scale: 1.03 }} onClick={completeOnboarding} disabled={isSaving}
                style={{ flex: 1, padding: "10px 0", background: isSaving ? C.border : `linear-gradient(135deg, ${C.green}, #00b4d8)`, border: "none", borderRadius: 5, color: "#060810", fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 12, cursor: isSaving ? "not-allowed" : "pointer" }}>
                {isSaving ? "Saving..." : "Enter EcoGrid →"}
              </motion.button>
            )}
          </div>
        </motion.div>
      </div>
    </>
  );
}
