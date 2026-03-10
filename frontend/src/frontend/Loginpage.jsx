// LoginPage.jsx — dark theme matching EnergyForecast
import React, { useState, useRef, useContext } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../Context/AuthContext";
import { handlesuccess } from "../../utils";
import ReCAPTCHA from "react-google-recaptcha";
import NavBar from "./NavBar";
import GoogleSignIn from "../components/GoogleSignIn";

const C = {
  bg: "#060810", bg2: "#0c0f1a", bg3: "#111525",
  border: "#1e2440", border2: "#2a3155",
  text: "#e8eaf6", text2: "#8892b0", text3: "#4a5568",
  green: "#00e5a0", red: "#ff4d6d", yellow: "#ffd166", blue: "#4d9fff",
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=JetBrains+Mono:wght@300;400;500&display=swap');
  @keyframes pulse2{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.8)}}
  @keyframes floatUp{0%{transform:translateY(0);opacity:.15}100%{transform:translateY(-120px);opacity:0}}
  * { box-sizing: border-box; }
  input { outline: none; }
`

const Field = ({ label, type, value, onChange, placeholder, icon }) => (
  <div style={{ marginBottom: 14 }}>
    <p style={{ fontSize: 9, color: C.text3, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>{label}</p>
    <div style={{ position: "relative" }}>
      {icon && <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", fontSize: 14 }}>{icon}</span>}
      <input type={type} value={value} onChange={onChange} placeholder={placeholder}
        style={{ width: "100%", padding: icon ? "9px 12px 9px 34px" : "9px 12px", background: C.bg3, border: `1px solid ${C.border2}`, borderRadius: 4, color: C.text, fontFamily: "'JetBrains Mono',monospace", fontSize: 12, transition: "border-color .2s" }}
        onFocus={e => e.target.style.borderColor = C.green}
        onBlur={e => e.target.style.borderColor = C.border2}
      />
    </div>
  </div>
)

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [profileData, setProfileData] = useState({ location: "", energyUsage: "", hasSolarPanels: null });
  const recaptchaRef = useRef(null);
  const [recaptchaValue, setRecaptchaValue] = useState(null);
  const [recaptchaErr, setRecaptchaErr] = useState("");

  const navigate = useNavigate();
  const { setIsAuthenticated } = useContext(AuthContext);
  const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080/api", withCredentials: true });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setRecaptchaErr("");
    if (!email || !password) return setError("Please fill in all fields");
    if (!recaptchaValue) return setRecaptchaErr("Please complete the reCAPTCHA");
    setIsLoading(true);
    try {
      const response = await api.post("/login", { email, password, recaptchaToken: recaptchaValue });
      const payload = response.data;
      if (rememberMe) localStorage.setItem('authToken', payload.token);
      else sessionStorage.setItem('authToken', payload.token);
      
      localStorage.setItem('userType', payload.userType || 'consumer');

      if (payload.isNewUser) setShowOnboarding(true);
      else { 
        setIsAuthenticated(true); 
        handlesuccess("Logged in Successfully"); 
        
        switch(payload.userType) {
          case 'prosumer': navigate('/dashboard'); break;
          case 'utility': navigate('/utility-dashboard'); break;
          default: navigate('/consumer-dashboard'); break;
        }
      }
    } catch { setError("Invalid credentials. Please try again."); recaptchaRef.current?.reset(); setRecaptchaValue(null); }
    finally { setIsLoading(false); }
  };

  const handleGoogleSuccess = (data) => {
    localStorage.setItem('userType', data.userType || data.user?.userType || 'consumer');

    if (data.isNewUser) setShowOnboarding(true);
    else { 
      setIsAuthenticated(true); 
      const uType = data.userType || data.user?.userType || 'consumer';
      switch(uType) {
        case 'prosumer': navigate('/dashboard'); break;
        case 'utility': navigate('/utility-dashboard'); break;
        default: navigate('/consumer-dashboard'); break;
      }
    }
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async ({ coords: { latitude, longitude } }) => {
      try {
        const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
        const d = await r.json();
        if (d.display_name) setProfileData(p => ({ ...p, location: d.display_name }));
      } catch {}
    });
  };

  const handleOnboardingComplete = async () => {
    try {
      setIsLoading(true);
      const authToken = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
      await api.post("/user/profile", profileData, { headers: { Authorization: `Bearer ${authToken}` } });
      setShowOnboarding(false); 
      setIsAuthenticated(true); 
      handlesuccess("Profile created!"); 

      // Retrieve userType from localStorage to route correctly after onboarding finishes
      const uType = localStorage.getItem('userType') || 'consumer';
      switch(uType) {
        case 'prosumer': navigate('/dashboard'); break;
        case 'utility': navigate('/utility-dashboard'); break;
        default: navigate('/consumer-dashboard'); break;
      }
    } catch { setError("Failed to save profile."); }
    finally { setIsLoading(false); }
  };

  const renderOnboarding = () => {
    const btnStyle = (active) => ({ flex: 1, padding: "9px 0", border: `1px solid ${active ? C.green : C.border2}`, borderRadius: 4, background: active ? `${C.green}22` : C.bg3, color: active ? C.green : C.text2, fontSize: 12, cursor: "pointer", fontFamily: "'JetBrains Mono',monospace" });
    if (onboardingStep === 0) return (
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 14 }}>🌱</div>
        <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 18, color: C.green, marginBottom: 8 }}>Welcome to EcoGrid!</p>
        <p style={{ fontSize: 12, color: C.text2, marginBottom: 22 }}>Let's set up your profile to get started.</p>
        <motion.button onClick={() => setOnboardingStep(1)} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          style={{ width: "100%", padding: "10px 0", background: `linear-gradient(135deg,${C.green},#00b4d8)`, border: "none", borderRadius: 4, color: "#060810", fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: 1, textTransform: "uppercase", cursor: "pointer" }}>
          Get Started →
        </motion.button>
      </div>
    );
    if (onboardingStep === 1) return (
      <>
        <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 14 }}>📍 Your Location</p>
        <Field label="Location" type="text" value={profileData.location} onChange={e => setProfileData(p => ({ ...p, location: e.target.value }))} placeholder="City, State, Country" />
        <button onClick={handleDetectLocation} style={{ width: "100%", padding: "8px 0", background: `${C.blue}18`, border: `1px solid ${C.blue}44`, borderRadius: 4, color: C.blue, fontSize: 11, cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", marginBottom: 12 }}>📡 Use My Location</button>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setOnboardingStep(0)} style={btnStyle(false)}>Back</button>
          <button onClick={() => setOnboardingStep(2)} disabled={!profileData.location} style={btnStyle(!!profileData.location)}>Next</button>
        </div>
      </>
    );
    if (onboardingStep === 2) return (
      <>
        <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 14 }}>⚡ Energy Profile</p>
        <Field label="Monthly Usage (kWh)" type="number" value={profileData.energyUsage} onChange={e => setProfileData(p => ({ ...p, energyUsage: e.target.value }))} placeholder="e.g. 300" />
        <p style={{ fontSize: 9, color: C.text3, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Solar Panels?</p>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <button onClick={() => setProfileData(p => ({ ...p, hasSolarPanels: true }))} style={btnStyle(profileData.hasSolarPanels === true)}>☀ Yes</button>
          <button onClick={() => setProfileData(p => ({ ...p, hasSolarPanels: false }))} style={btnStyle(profileData.hasSolarPanels === false)}>✗ No</button>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setOnboardingStep(1)} style={btnStyle(false)}>Back</button>
          <motion.button onClick={handleOnboardingComplete} disabled={!profileData.energyUsage || profileData.hasSolarPanels === null || isLoading}
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            style={{ flex: 1, padding: "9px 0", background: profileData.energyUsage && profileData.hasSolarPanels !== null ? `linear-gradient(135deg,${C.green},#00b4d8)` : C.border, border: "none", borderRadius: 4, color: "#060810", fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: 1, textTransform: "uppercase", cursor: "pointer" }}>
            {isLoading ? "Saving..." : "Complete Setup"}
          </motion.button>
        </div>
      </>
    );
  };

  return (
    <>
      <style>{css}</style>
      <NavBar />
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 16px 40px", position: "relative", overflow: "hidden", fontFamily: "'JetBrains Mono',monospace" }}>

        {/* Floating particles */}
        {["⚡", "🌱", "🔋", "☀️", "💨", "💧"].map((icon, i) => (
          <span key={i} style={{ position: "absolute", fontSize: 20, left: `${10 + i * 15}%`, bottom: "10%", opacity: 0.12, animation: `floatUp ${8 + i * 2}s linear ${i * 1.5}s infinite` }}>{icon}</span>
        ))}
        {/* Glow */}
        <div style={{ position: "absolute", top: "30%", left: "50%", transform: "translate(-50%,-50%)", width: 500, height: 500, background: `radial-gradient(circle, ${C.green}08 0%, transparent 70%)`, pointerEvents: "none" }} />

        <motion.div initial={{ opacity: 0, y: 30, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.5 }}
          style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 8, padding: 32, maxWidth: 420, width: "100%", boxShadow: "0 40px 80px rgba(0,0,0,.6)", position: "relative", zIndex: 10 }}>

          {!showOnboarding ? (
            <>
              {/* Header */}
              <div style={{ textAlign: "center", marginBottom: 28 }}>
                <motion.div whileHover={{ scale: 1.06, rotate: 5 }}
                  style={{ width: 52, height: 52, background: `${C.green}20`, border: `1px solid ${C.green}44`, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", fontSize: 24 }}>
                  🌱
                </motion.div>
                <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 22, color: C.green, marginBottom: 4 }}>Welcome Back</p>
                <p style={{ fontSize: 11, color: C.text3 }}>Sign in to continue your sustainable journey</p>
              </div>

              {error && (
                <div style={{ background: `${C.red}12`, border: `1px solid ${C.red}40`, borderRadius: 4, padding: "10px 12px", color: C.red, fontSize: 12, marginBottom: 16 }}>⚠ {error}</div>
              )}

              <form onSubmit={handleSubmit}>
                <Field label="Email Address" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" icon="📧" />
                <Field label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" icon="🔒" />

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 7, cursor: "pointer", fontSize: 11, color: C.text2 }}>
                    <input type="checkbox" checked={rememberMe} onChange={() => setRememberMe(!rememberMe)} style={{ accentColor: C.green }} />
                    Remember me
                  </label>
                  <Link to="/forgot-password" style={{ fontSize: 11, color: C.green, textDecoration: "none" }}>Forgot password?</Link>
                </div>

                <div style={{ marginBottom: 16, transform: "scale(.9)", transformOrigin: "left" }}>
                  <ReCAPTCHA ref={recaptchaRef} sitekey="6LeVOu4qAAAAAAGhilpcdGTdXpm19PNWAQb-K2ad"
                    onChange={v => { setRecaptchaValue(v); setRecaptchaErr(""); }} onExpired={() => { setRecaptchaValue(null); setRecaptchaErr("reCAPTCHA expired."); }} />
                  {recaptchaErr && <p style={{ color: C.red, fontSize: 10, marginTop: 4 }}>{recaptchaErr}</p>}
                </div>

                <motion.button type="submit" disabled={isLoading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  style={{ width: "100%", padding: "11px 0", background: isLoading ? C.border : `linear-gradient(135deg,${C.green},#00b4d8)`, border: "none", borderRadius: 4, color: "#060810", fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: 1, textTransform: "uppercase", cursor: isLoading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  {isLoading ? "Signing In..." : "Sign In →"}
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
            </>
          ) : (
            <div style={{ padding: "8px 0" }}>{renderOnboarding()}</div>
          )}
        </motion.div>
      </div>
    </>
  );
};

export default LoginPage;