import { useState, useEffect, useContext, Fragment } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { X, Menu, Leaf, LayoutDashboard, ShoppingBag, ChevronDown, LogOut, UserCircle, DollarSign, FileText } from "lucide-react"
import { AuthContext } from "../Context/AuthContext"
import { Menu as HeadlessMenu, Transition } from "@headlessui/react"
import { handlesuccess } from "../../utils"

const C = {
  bg: "#060810", bg2: "#0c0f1a", bg3: "#111525",
  border: "#1e2440", border2: "#2a3155",
  text: "#e8eaf6", text2: "#8892b0", text3: "#4a5568",
  green: "#00e5a0", red: "#ff4d6d",
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=JetBrains+Mono:wght@300;400;500&display=swap');
`

const NavBar = () => {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { isAuthenticated, setIsAuthenticated, user } = useContext(AuthContext)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => { setIsMobileMenuOpen(false) }, [location.pathname])

  const handleLogout = () => {
    sessionStorage.setItem('justLoggedOut', 'true')
    localStorage.removeItem('authToken')
    sessionStorage.removeItem('authToken')
    localStorage.removeItem('loggedInUser')
    localStorage.removeItem("userType")
    setIsAuthenticated(false)
    handlesuccess("Logged out Successfully")
    navigate('/')
    setTimeout(() => sessionStorage.removeItem('justLoggedOut'), 500)
  }

  const navItems = isAuthenticated ? [
    { name: "About", path: "/about", icon: <Leaf size={13} /> },
    { name: "Dashboard", path: "/dashboard", icon: <LayoutDashboard size={13} /> },
    { name: "EnergyForecast", path: "/prosumer", icon: <LayoutDashboard size={13} /> },
    { name: "Marketplace", path: "/marketplace", icon: <ShoppingBag size={13} /> },
    { name: "Blog", path: "/blog", icon: <FileText size={13} /> },
    { name: "Pricing", path: "/pricing", icon: <DollarSign size={13} /> },
  ] : []

  const navStyle = {
    position: "fixed", top: 0, width: "100%", zIndex: 50,
    background: isScrolled ? "rgba(6,8,16,.97)" : C.bg2,
    borderBottom: `1px solid ${C.border}`,
    backdropFilter: isScrolled ? "blur(20px)" : "none",
    transition: "all .3s",
    fontFamily: "'JetBrains Mono',monospace",
  }

  return (
    <>
      <style>{css}</style>
      <nav style={navStyle}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 20px", display: "flex", justifyContent: "space-between", alignItems: "center", height: 52 }}>

          {/* Logo */}
          <Link to="/" style={{ textDecoration: "none" }}>
            <motion.div style={{ display: "flex", alignItems: "center", gap: 10 }} whileHover={{ scale: 1.03 }}>
              <motion.div
                style={{ width: 34, height: 34, background: "linear-gradient(135deg,#ffd166,#f59e0b)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 12px rgba(255,209,102,.3)" }}
                animate={{ rotate: [0, 5, 0, -5, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              >
                <span style={{ color: "#064e3b", fontSize: 16, fontWeight: 900 }}>⚡</span>
              </motion.div>
              <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 20, color: C.text }}>
                Eco<span style={{ color: C.green }}>Grid</span>
              </span>
            </motion.div>
          </Link>

          {/* Desktop nav */}
          <div style={{ display: "flex", alignItems: "center", gap: 4 }} className="hidden-mobile">
            {navItems.map(item => {
              const active = location.pathname === item.path
              return (
                <Link key={item.name} to={item.path} style={{ textDecoration: "none" }}>
                  <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                    style={{ padding: "6px 12px", borderRadius: 4, display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontFamily: "'JetBrains Mono',monospace", cursor: "pointer", transition: "all .2s",
                      background: active ? `${C.green}18` : "transparent",
                      border: `1px solid ${active ? `${C.green}40` : "transparent"}`,
                      color: active ? C.green : C.text2,
                    }}>
                    {item.icon}
                    {item.name}
                  </motion.div>
                </Link>
              )
            })}

            {/* Auth */}
            <div style={{ marginLeft: 12, display: "flex", gap: 8 }}>
              {!isAuthenticated ? (
                <>
                  <Link to="/login" style={{ textDecoration: "none" }}>
                    <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                      style={{ padding: "6px 16px", background: `linear-gradient(135deg,${C.green},#00b4d8)`, border: "none", borderRadius: 4, color: "#060810", fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: 1, textTransform: "uppercase", cursor: "pointer" }}>
                      Login
                    </motion.button>
                  </Link>
                  <Link to="/register" style={{ textDecoration: "none" }}>
                    <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                      style={{ padding: "6px 16px", background: "transparent", border: `1px solid ${C.border2}`, borderRadius: 4, color: C.text2, fontFamily: "'JetBrains Mono',monospace", fontSize: 11, cursor: "pointer" }}>
                      Register
                    </motion.button>
                  </Link>
                </>
              ) : (
                <HeadlessMenu as="div" style={{ position: "relative" }}>
                  <HeadlessMenu.Button style={{ display: "flex", alignItems: "center", gap: 8, background: C.bg3, border: `1px solid ${C.border}`, borderRadius: 4, padding: "6px 12px", cursor: "pointer" }}>
                    <div style={{ width: 26, height: 26, borderRadius: "50%", background: `${C.green}22`, border: `1px solid ${C.green}44`, display: "flex", alignItems: "center", justifyContent: "center", color: C.green, fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 12 }}>
                      {user?.user?.name ? user.user.name.charAt(0).toUpperCase() : "G"}
                    </div>
                    <span style={{ color: C.text, fontSize: 12, fontFamily: "'JetBrains Mono',monospace" }}>{user?.user?.name || "Guest"}</span>
                    <ChevronDown size={13} color={C.text2} />
                  </HeadlessMenu.Button>
                  <Transition as={Fragment}
                    enter="transition ease-out duration-100" enterFrom="transform opacity-0 scale-95" enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75" leaveFrom="transform opacity-100 scale-100" leaveTo="transform opacity-0 scale-95">
                    <HeadlessMenu.Items style={{ position: "absolute", right: 0, marginTop: 8, width: 220, background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 6, padding: "6px 0", zIndex: 99, boxShadow: "0 20px 40px rgba(0,0,0,.5)" }}>
                      <div style={{ padding: "8px 14px", borderBottom: `1px solid ${C.border}`, marginBottom: 4 }}>
                        <p style={{ fontSize: 9, color: C.text3, textTransform: "uppercase", letterSpacing: 1 }}>Signed in as</p>
                        <p style={{ fontSize: 12, color: C.text, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.user?.email || "guest@example.com"}</p>
                      </div>
                      <HeadlessMenu.Item>
                        {({ active }) => (
                          <Link to="/profile" style={{ textDecoration: "none" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", cursor: "pointer", background: active ? C.bg3 : "transparent", color: active ? C.green : C.text, fontSize: 12 }}>
                              <UserCircle size={14} color={C.green} />
                              Profile
                            </div>
                          </Link>
                        )}
                      </HeadlessMenu.Item>
                      <HeadlessMenu.Item>
                        {({ active }) => (
                          <button onClick={handleLogout} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", cursor: "pointer", background: active ? `${C.red}11` : "transparent", color: C.red, fontSize: 12, border: "none", width: "100%", fontFamily: "'JetBrains Mono',monospace" }}>
                            <LogOut size={14} />
                            Logout
                          </button>
                        )}
                      </HeadlessMenu.Item>
                    </HeadlessMenu.Items>
                  </Transition>
                </HeadlessMenu>
              )}
            </div>
          </div>

          {/* Mobile toggle */}
          <motion.button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            style={{ display: "none", padding: 8, background: C.bg3, border: `1px solid ${C.border}`, borderRadius: 4, color: C.text2, cursor: "pointer" }}
            className="show-mobile">
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </motion.button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div style={{ background: C.bg2, borderBottom: `1px solid ${C.border}`, overflow: "hidden" }}
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
              <div style={{ padding: "12px 20px" }}>
                {navItems.map(item => {
                  const active = location.pathname === item.path
                  return (
                    <Link key={item.name} to={item.path} style={{ textDecoration: "none" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 4, marginBottom: 4, color: active ? C.green : C.text2, background: active ? `${C.green}12` : "transparent", border: `1px solid ${active ? `${C.green}30` : "transparent"}`, fontSize: 12 }}>
                        {item.icon}{item.name}
                      </div>
                    </Link>
                  )
                })}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8, paddingTop: 8, borderTop: `1px solid ${C.border}` }}>
                  {!isAuthenticated ? (
                    <>
                      <Link to="/login" style={{ textDecoration: "none" }}>
                        <div style={{ padding: "10px", background: `linear-gradient(135deg,${C.green},#00b4d8)`, borderRadius: 4, color: "#060810", textAlign: "center", fontSize: 11, fontFamily: "'Syne',sans-serif", fontWeight: 700 }}>Login</div>
                      </Link>
                      <Link to="/register" style={{ textDecoration: "none" }}>
                        <div style={{ padding: "10px", border: `1px solid ${C.border2}`, borderRadius: 4, color: C.text2, textAlign: "center", fontSize: 11 }}>Register</div>
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link to="/profile" style={{ textDecoration: "none" }}>
                        <div style={{ padding: "10px", background: C.bg3, border: `1px solid ${C.border}`, borderRadius: 4, color: C.text, textAlign: "center", fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                          <UserCircle size={14} />Profile
                        </div>
                      </Link>
                      <button onClick={handleLogout} style={{ padding: "10px", background: `${C.red}11`, border: `1px solid ${C.red}40`, borderRadius: 4, color: C.red, fontSize: 11, cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                        <LogOut size={14} />Logout
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <style>{`
          @media (min-width: 768px) { .show-mobile { display: none !important; } .hidden-mobile { display: flex !important; } }
          @media (max-width: 767px) { .show-mobile { display: flex !important; } .hidden-mobile { display: none !important; } }
        `}</style>
      </nav>
    </>
  )
}

export default NavBar