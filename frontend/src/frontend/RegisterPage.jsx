// RegisterPage.jsx — dark theme matching EnergyForecast
import React, { useState, useEffect, useRef, useContext } from "react";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import ReCAPTCHA from "react-google-recaptcha";
import NavBar from "./NavBar";
import GoogleSignIn from "../components/GoogleSignIn";
import { AuthContext } from "../Context/AuthContext";
import { handlesuccess } from "../../utils";

const C = {
  bg: "#060810", bg2: "#0c0f1a", bg3: "#111525",
  border: "#1e2440", border2: "#2a3155",
  text: "#e8eaf6", text2: "#8892b0", text3: "#4a5568",
  green: "#00e5a0", red: "#ff4d6d", yellow: "#ffd166", blue: "#4d9fff",
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=JetBrains+Mono:wght@300;400;500&display=swap');
  @keyframes floatUp{0%{transform:translateY(0);opacity:.15}100%{transform:translateY(-120px);opacity:0}}
  * { box-sizing: border-box; }
  input, select { outline: none; }
`

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080/api", withCredentials: true });

const Field = ({ label, type = "text", value, onChange, placeholder, icon, error, children }) => (
  <div>
    <p style={{ fontSize: 9, color: C.text3, textTransform: "uppercase", letterSpacing: 1, marginBottom: 5 }}>{label}</p>
    {children || (
      <div style={{ position: "relative" }}>
        {icon && <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13 }}>{icon}</span>}
        <input type={type} value={value} onChange={onChange} placeholder={placeholder}
          style={{ width: "100%", padding: icon ? "8px 12px 8px 30px" : "8px 12px", background: C.bg3, border: `1px solid ${error ? C.red : C.border2}`, borderRadius: 4, color: C.text, fontFamily: "'JetBrains Mono',monospace", fontSize: 12, transition: "border-color .2s" }}
          onFocus={e => e.target.style.borderColor = error ? C.red : C.green}
          onBlur={e => e.target.style.borderColor = error ? C.red : C.border2} />
      </div>
    )}
    {error && <p style={{ fontSize: 10, color: C.red, marginTop: 3 }}>{error}</p>}
  </div>
)

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
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [profileData, setProfileData] = useState({ location: "", energyUsage: "", hasSolarPanels: null });
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
      setSuccess("Account created! Redirecting...");
      setTimeout(() => navigate('/login'), 1800);
    } catch (err) {
      if (err.response?.data?.error === 'recaptcha-failed') { setError("reCAPTCHA failed. Try again."); recaptchaRef.current?.reset(); setRecaptchaToken(""); }
      else setError(err.response?.data?.message || "Registration failed.");
    }
    finally { setIsLoading(false); }
  };

  const handleGoogleSuccess = (data) => {
    if (data.isNewUser) setShowOnboarding(true);
    else { setIsAuthenticated(true); handlesuccess("Logged in"); navigate('/dashboard'); }
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
      setShowOnboarding(false); setIsAuthenticated(true); handlesuccess("Profile created!"); navigate('/dashboard');
    } catch { setError("Failed to save profile."); }
    finally { setIsLoading(false); }
  };

  const btnStyle = (active) => ({ flex: 1, padding: "8px 0", border: `1px solid ${active ? C.green : C.border2}`, borderRadius: 4, background: active ? `${C.green}22` : C.bg3, color: active ? C.green : C.text2, fontSize: 12, cursor: "pointer", fontFamily: "'JetBrains Mono',monospace" });

  const renderOnboarding = () => {
    if (onboardingStep === 0) return (
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 14 }}>🌿</div>
        <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 18, color: C.green, marginBottom: 8 }}>Welcome to EcoGrid!</p>
        <p style={{ fontSize: 12, color: C.text2, marginBottom: 22 }}>Let's set up your energy profile.</p>
        <motion.button onClick={() => setOnboardingStep(1)} whileHover={{ scale: 1.03 }}
          style={{ width: "100%", padding: "10px 0", background: `linear-gradient(135deg,${C.green},#00b4d8)`, border: "none", borderRadius: 4, color: "#060810", fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: 1, textTransform: "uppercase", cursor: "pointer" }}>
          Get Started →
        </motion.button>
      </div>
    );
    if (onboardingStep === 1) return (
      <>
        <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 14 }}>📍 Your Location</p>
        <Field label="Location" value={profileData.location} onChange={e => setProfileData(p => ({ ...p, location: e.target.value }))} placeholder="City, State, Country" />
        <div style={{ height: 10 }} />
        <button onClick={handleDetectLocation} style={{ width: "100%", padding: "8px 0", background: `${C.blue}18`, border: `1px solid ${C.blue}44`, borderRadius: 4, color: C.blue, fontSize: 11, cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", marginBottom: 14 }}>📡 Use My Location</button>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setOnboardingStep(0)} style={btnStyle(false)}>Back</button>
          <button onClick={() => setOnboardingStep(2)} disabled={!profileData.location} style={btnStyle(!!profileData.location)}>Next</button>
        </div>
      </>
    );
    return (
      <>
        <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 14 }}>⚡ Energy Profile</p>
        <Field label="Monthly Usage (kWh)" type="number" value={profileData.energyUsage} onChange={e => setProfileData(p => ({ ...p, energyUsage: e.target.value }))} placeholder="e.g. 300" />
        <div style={{ height: 12 }} />
        <p style={{ fontSize: 9, color: C.text3, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Solar Panels?</p>
        <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
          <button onClick={() => setProfileData(p => ({ ...p, hasSolarPanels: true }))} style={btnStyle(profileData.hasSolarPanels === true)}>☀ Yes</button>
          <button onClick={() => setProfileData(p => ({ ...p, hasSolarPanels: false }))} style={btnStyle(profileData.hasSolarPanels === false)}>✗ No</button>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setOnboardingStep(1)} style={btnStyle(false)}>Back</button>
          <motion.button onClick={handleOnboardingComplete} disabled={!profileData.energyUsage || profileData.hasSolarPanels === null || isLoading}
            whileHover={{ scale: 1.03 }}
            style={{ flex: 1, padding: "9px 0", background: `linear-gradient(135deg,${C.green},#00b4d8)`, border: "none", borderRadius: 4, color: "#060810", fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: 1, textTransform: "uppercase", cursor: "pointer" }}>
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

        {["⚡", "🌱", "🔋", "☀️", "💨", "💧"].map((icon, i) => (
          <span key={i} style={{ position: "absolute", fontSize: 18, left: `${8 + i * 14}%`, bottom: "5%", opacity: 0.12, animation: `floatUp ${9 + i * 2}s linear ${i * 1.2}s infinite` }}>{icon}</span>
        ))}
        <div style={{ position: "absolute", top: "30%", left: "50%", transform: "translate(-50%,-50%)", width: 600, height: 600, background: `radial-gradient(circle, ${C.green}06 0%, transparent 70%)`, pointerEvents: "none" }} />

        <motion.div initial={{ opacity: 0, y: 30, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.5 }}
          style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 8, padding: 30, maxWidth: 500, width: "100%", boxShadow: "0 40px 80px rgba(0,0,0,.6)", position: "relative", zIndex: 10 }}>

          {!showOnboarding ? (
            <>
              <div style={{ textAlign: "center", marginBottom: 24 }}>
                <motion.div whileHover={{ scale: 1.06, rotate: -5 }}
                  style={{ width: 48, height: 48, background: `${C.green}20`, border: `1px solid ${C.green}44`, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", fontSize: 22 }}>
                  🌿
                </motion.div>
                <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 20, color: C.green, marginBottom: 4 }}>Create Account</p>
                <p style={{ fontSize: 11, color: C.text3 }}>Join the sustainable energy revolution</p>
              </div>

              {error && <div style={{ background: `${C.red}12`, border: `1px solid ${C.red}40`, borderRadius: 4, padding: "9px 12px", color: C.red, fontSize: 12, marginBottom: 14 }}>⚠ {error}</div>}
              {success && <div style={{ background: `${C.green}12`, border: `1px solid ${C.green}40`, borderRadius: 4, padding: "9px 12px", color: C.green, fontSize: 12, marginBottom: 14 }}>✓ {success}</div>}

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {/* Row 1 */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <Field label="Full Name" value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" icon="👤" error={formErrors.name} />
                  <Field label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" icon="📧" error={formErrors.email} />
                </div>

                {/* Row 2 */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <Field label="User Type" error={formErrors.userType}>
                    <select value={userType} onChange={e => setUserType(e.target.value)}
                      style={{ width: "100%", padding: "8px 12px", background: C.bg3, border: `1px solid ${formErrors.userType ? C.red : C.border2}`, borderRadius: 4, color: userType ? C.text : C.text3, fontFamily: "'JetBrains Mono',monospace", fontSize: 12 }}>
                      <option value="">Select type</option>
                      <option value="prosumer">⚡ Prosumer</option>
                      <option value="consumer">🏠 Consumer</option>
                      <option value="utility">🏭 Utility</option>
                    </select>
                  </Field>
                  <div>
                    <Field label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" icon="🔒" error={formErrors.password} />
                    {password && (
                      <div style={{ marginTop: 4 }}>
                        <div style={{ height: 3, background: C.border, borderRadius: 2, overflow: "hidden" }}>
                          <motion.div animate={{ width: `${(passwordStrength / 5) * 100}%` }} style={{ height: "100%", background: strengthColor, borderRadius: 2 }} />
                        </div>
                        <p style={{ fontSize: 9, color: strengthColor, marginTop: 2 }}>{strengthLabel}</p>
                      </div>
                    )}
                  </div>
                </div>

                <Field label="Confirm Password" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" icon="🔐" error={formErrors.confirmPassword} />

                <div style={{ marginTop: 4, transform: "scale(.88)", transformOrigin: "left" }}>
                  <ReCAPTCHA ref={recaptchaRef} sitekey="6LeVOu4qAAAAAAGhilpcdGTdXpm19PNWAQb-K2ad"
                    onChange={v => { setRecaptchaToken(v); setFormErrors(p => ({ ...p, recaptcha: "" })); }}
                    onExpired={() => { setRecaptchaToken(""); setFormErrors(p => ({ ...p, recaptcha: "Expired, verify again." })); }} />
                  {formErrors.recaptcha && <p style={{ fontSize: 10, color: C.red, marginTop: 3 }}>{formErrors.recaptcha}</p>}
                </div>

                <motion.button type="submit" disabled={isLoading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  style={{ padding: "11px 0", background: isLoading ? C.border : `linear-gradient(135deg,${C.green},#00b4d8)`, border: "none", borderRadius: 4, color: "#060810", fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: 1, textTransform: "uppercase", cursor: isLoading ? "not-allowed" : "pointer" }}>
                  {isLoading ? "Creating Account..." : "Create Account →"}
                </motion.button>
              </form>

              <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "18px 0 14px" }}>
                <div style={{ flex: 1, height: 1, background: C.border }} />
                <span style={{ fontSize: 10, color: C.text3 }}>or sign up with</span>
                <div style={{ flex: 1, height: 1, background: C.border }} />
              </div>
              <GoogleSignIn onSuccess={handleGoogleSuccess} onError={setError} userType={userType || 'consumer'} buttonText="Sign up with Google" />

              <p style={{ textAlign: "center", marginTop: 18, fontSize: 12, color: C.text2 }}>
                Already have an account?{" "}
                <Link to="/login" style={{ color: C.green, textDecoration: "none", fontWeight: 600 }}>Sign in</Link>
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

export default RegisterPage;