import React, { useState, useEffect, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import NavBar from "./NavBar";
import { AuthContext } from "../Context/AuthContext";
import { apiUrl } from "../config";
import {
  ThumbsUp, ThumbsDown, MessageSquare, Share2, PenSquare,
  TrendingUp, Clock, Zap, Users, Activity, Leaf, X,
  ChevronDown, ChevronUp, Send, Filter, Search, Bell,
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
  *{box-sizing:border-box}
  ::-webkit-scrollbar{width:4px}
  ::-webkit-scrollbar-track{background:${C.bg}}
  ::-webkit-scrollbar-thumb{background:${C.border2};border-radius:2px}
  textarea,input{outline:none;transition:border-color .2s}
  textarea:focus,input:focus{border-color:${C.green}80!important}
  .post-card:hover{border-color:${C.border2}!important}
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatTs = ts => {
  if (!ts) return "—";
  const d = Math.floor((Date.now() - new Date(ts)) / 86400000);
  const h = Math.floor((Date.now() - new Date(ts)) / 3600000);
  const m = Math.floor((Date.now() - new Date(ts)) / 60000);
  return d > 0 ? `${d}d ago` : h > 0 ? `${h}h ago` : m > 0 ? `${m}m ago` : "just now";
};

const Avatar = ({ name, size = 36 }) => {
  const initials = name ? name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase() : "?";
  const hue = name ? name.charCodeAt(0) * 7 % 360 : 200;
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: `hsl(${hue},40%,20%)`, border: `1px solid hsl(${hue},40%,35%)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: size * 0.38,
      color: `hsl(${hue},80%,70%)`
    }}>{initials}</div>
  );
};

const TopicTag = ({ tag, active, onClick }) => (
  <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={onClick}
    style={{
      padding: "4px 12px", borderRadius: 3, fontSize: 10, fontFamily: "'JetBrains Mono',monospace",
      textTransform: "uppercase", letterSpacing: 1, cursor: "pointer", border: "1px solid",
      background: active ? `${C.green}18` : "transparent",
      borderColor: active ? `${C.green}60` : C.border, color: active ? C.green : C.text3,
      transition: "all .15s"
    }}>
    {tag}
  </motion.button>
);

const Stat = ({ icon: Icon, label, value, color }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
    <div style={{ width: 32, height: 32, borderRadius: 6, background: `${color}15`, border: `1px solid ${color}30`, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Icon size={14} style={{ color }} />
    </div>
    <div>
      <p style={{ fontSize: 9, color: C.text3, textTransform: "uppercase", letterSpacing: 1 }}>{label}</p>
      <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 14, color, lineHeight: 1 }}>{value}</p>
    </div>
  </div>
);

// ─── Comment Form ─────────────────────────────────────────────────────────────
const CommentForm = ({ postId, addComment }) => {
  const [text, setText] = useState("");
  const submit = e => { e.preventDefault(); if (!text.trim()) return; addComment(postId, text); setText(""); };
  return (
    <form onSubmit={submit} style={{ display: "flex", gap: 8, marginTop: 12 }}>
      <input value={text} onChange={e => setText(e.target.value)} placeholder="Reply to this post…"
        style={{ flex: 1, padding: "8px 12px", background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 4, color: C.text, fontSize: 12, fontFamily: "'JetBrains Mono',monospace" }} />
      <motion.button type="submit" disabled={!text.trim()} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
        style={{ padding: "8px 14px", background: text.trim() ? `${C.green}18` : "transparent", border: `1px solid ${text.trim() ? C.green + "60" : C.border}`, borderRadius: 4, color: text.trim() ? C.green : C.text3, cursor: text.trim() ? "pointer" : "not-allowed", display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontFamily: "'JetBrains Mono',monospace" }}>
        <Send size={12} /> Reply
      </motion.button>
    </form>
  );
};

// ─── Post Card ────────────────────────────────────────────────────────────────
const PostCard = ({ post, handleVote, addComment }) => {
  const [expanded, setExpanded] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const score = (post.upvotes || 0) - (post.downvotes || 0);

  return (
    <motion.div className="post-card"
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      style={{ background: C.bg3, border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden", transition: "border-color .2s" }}>

      {/* Score sidebar strip */}
      <div style={{ display: "flex" }}>
        <div style={{ width: 44, background: C.bg2, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", alignItems: "center", padding: "14px 0", gap: 4 }}>
          <motion.button whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }} onClick={() => handleVote(post._id, null, true)}
            style={{ background: "none", border: "none", cursor: "pointer", color: C.text3, padding: 3, display: "flex" }}>
            <ThumbsUp size={14} style={{ color: score > 0 ? C.green : C.text3 }} />
          </motion.button>
          <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 13, color: score > 0 ? C.green : score < 0 ? C.red : C.text3 }}>{score}</span>
          <motion.button whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }} onClick={() => handleVote(post._id, null, false)}
            style={{ background: "none", border: "none", cursor: "pointer", color: C.text3, padding: 3, display: "flex" }}>
            <ThumbsDown size={14} style={{ color: score < 0 ? C.red : C.text3 }} />
          </motion.button>
        </div>

        {/* Main post body */}
        <div style={{ flex: 1, minWidth: 0, padding: "14px 16px" }}>
          {/* Author row */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <Avatar name={post.authorName} size={30} />
            <div>
              <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 12, color: C.text }}>{post.authorName || "Community Member"}</span>
              <span style={{ fontSize: 10, color: C.text3, marginLeft: 8, fontFamily: "'JetBrains Mono',monospace" }}>· {formatTs(post.timestamp)}</span>
            </div>
          </div>

          {/* Title */}
          <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 8, lineHeight: 1.3 }}>{post.title}</h2>

          {/* Content preview */}
          <p style={{ fontSize: 13, color: C.text2, lineHeight: 1.7, fontFamily: "'JetBrains Mono',monospace" }}>
            {expanded ? post.content : post.content?.substring(0, 220) + (post.content?.length > 220 ? "…" : "")}
          </p>
          {post.content?.length > 220 && (
            <button onClick={() => setExpanded(!expanded)}
              style={{ marginTop: 6, fontSize: 10, color: C.blue, background: "none", border: "none", cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", display: "flex", alignItems: "center", gap: 4 }}>
              {expanded ? <><ChevronUp size={11} /> Show less</> : <><ChevronDown size={11} /> Read more</>}
            </button>
          )}

          {/* Action bar */}
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 14, paddingTop: 10, borderTop: `1px solid ${C.border}` }}>
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              onClick={() => setShowComments(!showComments)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 4, background: showComments ? `${C.blue}15` : "transparent", border: `1px solid ${showComments ? C.blue + "40" : "transparent"}`, color: showComments ? C.blue : C.text2, fontSize: 11, fontFamily: "'JetBrains Mono',monospace", cursor: "pointer" }}>
              <MessageSquare size={13} /> {post.comments?.length || 0} comments
            </motion.button>

            <motion.button whileHover={{ scale: 1.04 }} onClick={() => { navigator.clipboard?.writeText(window.location.href) }}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 4, background: "transparent", border: "1px solid transparent", color: C.text3, fontSize: 11, fontFamily: "'JetBrains Mono',monospace", cursor: "pointer" }}>
              <Share2 size={13} /> Share
            </motion.button>
          </div>

          {/* Comments section */}
          <AnimatePresence>
            {showComments && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                style={{ overflow: "hidden", marginTop: 12 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {post.comments?.map(c => (
                    <div key={c._id} style={{ display: "flex", gap: 10, padding: "10px 12px", background: C.bg2, borderRadius: 6, border: `1px solid ${C.border}` }}>
                      <Avatar name={c.authorName} size={24} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                          <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 11, color: C.text }}>{c.authorName || "Member"}</span>
                          <span style={{ fontSize: 9, color: C.text3, fontFamily: "'JetBrains Mono',monospace" }}>{formatTs(c.timestamp)}</span>
                        </div>
                        <p style={{ fontSize: 12, color: C.text2, lineHeight: 1.5, fontFamily: "'JetBrains Mono',monospace" }}>{c.content}</p>
                        <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
                          <button onClick={() => handleVote(post._id, c._id, true)}
                            style={{ background: "none", border: "none", cursor: "pointer", color: C.text3, display: "flex", alignItems: "center", gap: 4, fontSize: 10 }}>
                            <ThumbsUp size={10} /> {c.upvotes || 0}
                          </button>
                          <button onClick={() => handleVote(post._id, c._id, false)}
                            style={{ background: "none", border: "none", cursor: "pointer", color: C.text3, display: "flex", alignItems: "center", gap: 4, fontSize: 10 }}>
                            <ThumbsDown size={10} /> {c.downvotes || 0}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <CommentForm postId={post._id} addComment={addComment} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const Blog = () => {
  const [posts, setPosts] = useState([]);
  const [sortBy, setSortBy] = useState("newest");
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [composing, setComposing] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [search, setSearch] = useState("");
  const [stats, setStats] = useState({ totalMembers: 0, onlineNow: 0, energySaved: "0 kg", postsToday: 0 });
  const { user } = useContext(AuthContext);

  const currentUser = { name: user?.user?.name || "Guest User" };
  const topics = ["Solar", "Wind", "Battery Storage", "P2P Trading", "AI Optimization", "Microgrids", "Policy", "Blockchain"];

  const headers = () => {
    const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
    return { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  };

  useEffect(() => {
    fetch(apiUrl(`/community/posts?sort=${sortBy}`)).then(r => r.ok && r.json()).then(d => d && setPosts(d)).catch(() => {});
  }, [sortBy]);

  useEffect(() => {
    const load = () => fetch(apiUrl("/community/stats")).then(r => r.ok && r.json()).then(d => d?.success && setStats(d.stats)).catch(() => {});
    load();
    const iv = setInterval(load, 30000);
    return () => clearInterval(iv);
  }, []);

  const submitPost = async e => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;
    try {
      const r = await fetch(apiUrl("/community/posts"), { method: "POST", headers: headers(), body: JSON.stringify({ title: newTitle, content: newContent, authorName: currentUser.name }) });
      if (r.ok) { const p = await r.json(); setPosts(prev => [p, ...prev]); setNewTitle(""); setNewContent(""); setComposing(false); }
    } catch {}
  };

  const addComment = async (postId, text) => {
    try {
      const r = await fetch(apiUrl(`/community/posts/${postId}/comments`), { method: "POST", headers: headers(), body: JSON.stringify({ content: text, authorName: currentUser.name }) });
      if (r.ok) { const up = await r.json(); setPosts(prev => prev.map(p => p._id === postId ? up : p)); }
    } catch {}
  };

  const handleVote = async (postId, commentId, isUpvote) => {
    const url = commentId ? apiUrl(`/community/posts/${postId}/comments/${commentId}/vote`) : apiUrl(`/community/posts/${postId}/vote`);
    try {
      const r = await fetch(url, { method: "PUT", headers: headers(), body: JSON.stringify({ isUpvote }) });
      if (r.ok) { const up = await r.json(); setPosts(prev => prev.map(p => p._id === postId ? up : p)); }
    } catch {}
  };

  const filtered = posts.filter(p =>
    (!selectedTopic || p.title?.toLowerCase().includes(selectedTopic.toLowerCase()) || p.content?.toLowerCase().includes(selectedTopic.toLowerCase())) &&
    (!search || p.title?.toLowerCase().includes(search.toLowerCase()) || p.content?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <>
      <style>{css}</style>
      <NavBar />
      <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'JetBrains Mono',monospace", paddingTop: 52 }}>

        {/* Scan line */}
        <div style={{ position: "fixed", left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${C.green}25, transparent)`, animation: "scanLine 8s linear infinite", zIndex: 1, pointerEvents: "none" }} />

        {/* ── Hero banner ── */}
        <div style={{ background: C.bg2, borderBottom: `1px solid ${C.border}`, padding: "40px 24px 32px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 600, height: 200, background: `radial-gradient(ellipse, ${C.green}08 0%, transparent 70%)`, pointerEvents: "none" }} />
          <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <div style={{ width: 24, height: 1, background: C.green }} />
              <span style={{ fontSize: 10, color: C.green, textTransform: "uppercase", letterSpacing: 2 }}>EcoGrid Network</span>
              <div style={{ width: 24, height: 1, background: C.green }} />
            </div>
            <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "clamp(2rem,5vw,3rem)", color: C.text, marginBottom: 10, lineHeight: 1.1 }}>
              Community Forum
            </h1>
            <p style={{ fontSize: 13, color: C.text2, marginBottom: 28, maxWidth: 520, lineHeight: 1.6 }}>
              Connect with energy producers, consumers, and grid operators. Share insights, ask questions, and shape the future of decentralised energy.
            </p>

            {/* Live stats bar */}
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
              <Stat icon={Users} label="Members" value={stats.totalMembers.toLocaleString()} color={C.blue} />
              <Stat icon={Activity} label="Online Now" value={stats.onlineNow} color={C.green} />
              <Stat icon={Leaf} label="CO₂ Saved" value={stats.energySaved} color={C.green} />
              <Stat icon={PenSquare} label="Posts Today" value={stats.postsToday} color={C.purple} />
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "20px 16px", display: "grid", gridTemplateColumns: "220px 1fr 240px", gap: 16, alignItems: "start" }}>

          {/* ── Left sidebar ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12, position: "sticky", top: 98 }}>
            {/* Sort */}
            <div style={{ background: C.bg3, border: `1px solid ${C.border}`, borderRadius: 8, padding: 14 }}>
              <p style={{ fontSize: 9, color: C.text3, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Sort by</p>
              {[{ id: "newest", icon: Clock, label: "Newest" }, { id: "popular", icon: TrendingUp, label: "Popular" }, { id: "oldest", icon: Zap, label: "Oldest" }].map(({ id, icon: Icon, label }) => (
                <motion.button key={id} whileHover={{ x: 3 }} onClick={() => setSortBy(id)}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 4, background: sortBy === id ? `${C.green}15` : "transparent", border: `1px solid ${sortBy === id ? C.green + "40" : "transparent"}`, color: sortBy === id ? C.green : C.text2, fontSize: 11, fontFamily: "'JetBrains Mono',monospace", cursor: "pointer", marginBottom: 4 }}>
                  <Icon size={12} /> {label}
                </motion.button>
              ))}
            </div>

            {/* Topics */}
            <div style={{ background: C.bg3, border: `1px solid ${C.border}`, borderRadius: 8, padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <p style={{ fontSize: 9, color: C.text3, textTransform: "uppercase", letterSpacing: 1 }}>Topics</p>
                {selectedTopic && <button onClick={() => setSelectedTopic(null)} style={{ fontSize: 9, color: C.red, background: "none", border: "none", cursor: "pointer" }}>Clear</button>}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {topics.map(t => (
                  <motion.button key={t} whileHover={{ x: 3 }} onClick={() => setSelectedTopic(selectedTopic === t ? null : t)}
                    style={{ width: "100%", textAlign: "left", padding: "6px 10px", borderRadius: 4, background: selectedTopic === t ? `${C.blue}15` : "transparent", border: `1px solid ${selectedTopic === t ? C.blue + "40" : "transparent"}`, color: selectedTopic === t ? C.blue : C.text2, fontSize: 11, fontFamily: "'JetBrains Mono',monospace", cursor: "pointer" }}>
                    #{t}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Changelog */}
            <div style={{ background: C.bg3, border: `1px solid ${C.border}`, borderRadius: 8, padding: 14 }}>
              <p style={{ fontSize: 9, color: C.text3, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Latest Updates</p>
              {[
                { title: "AI Engine v2", desc: "+15% forecast accuracy", color: C.green, date: "2d" },
                { title: "P2P Trading", desc: "Lower fees, faster settlement", color: C.blue, date: "1w" },
                { title: "Mobile v2.1", desc: "Real-time monitoring", color: C.purple, date: "2w" },
              ].map(({ title, desc, color, date }) => (
                <div key={title} style={{ borderLeft: `2px solid ${color}`, paddingLeft: 10, marginBottom: 12 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: C.text, fontFamily: "'Syne',sans-serif" }}>{title}</p>
                  <p style={{ fontSize: 10, color: C.text2, marginTop: 2 }}>{desc}</p>
                  <p style={{ fontSize: 9, color: C.text3, marginTop: 2 }}>{date} ago</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Feed ── */}
          <div>
            {/* Search + New Post bar */}
            <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
              <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, background: C.bg3, border: `1px solid ${C.border}`, borderRadius: 6, padding: "8px 12px" }}>
                <Search size={14} style={{ color: C.text3, flexShrink: 0 }} />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search posts…"
                  style={{ flex: 1, background: "none", border: "none", color: C.text, fontSize: 12, fontFamily: "'JetBrains Mono',monospace" }} />
              </div>
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={() => setComposing(!composing)}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 6, background: composing ? `${C.red}18` : `${C.green}18`, border: `1px solid ${composing ? C.red + "50" : C.green + "50"}`, color: composing ? C.red : C.green, fontSize: 12, fontFamily: "'JetBrains Mono',monospace", cursor: "pointer", whiteSpace: "nowrap" }}>
                {composing ? <><X size={13} /> Cancel</> : <><PenSquare size={13} /> New Post</>}
              </motion.button>
            </div>

            {/* Compose panel */}
            <AnimatePresence>
              {composing && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                  style={{ background: C.bg3, border: `1px solid ${C.green}40`, borderRadius: 8, padding: 16, marginBottom: 16, overflow: "hidden" }}>
                  <form onSubmit={submitPost}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                      <Avatar name={currentUser.name} size={32} />
                      <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 12, color: C.text }}>{currentUser.name}</span>
                    </div>
                    <input value={newTitle} onChange={e => setNewTitle(e.target.value)} required placeholder="Post title…"
                      style={{ width: "100%", padding: "10px 14px", background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 6, color: C.text, fontSize: 14, fontFamily: "'Syne',sans-serif", fontWeight: 600, marginBottom: 10 }} />
                    <textarea value={newContent} onChange={e => setNewContent(e.target.value)} required placeholder="Share your thoughts, questions, or insights…" rows={4}
                      style={{ width: "100%", padding: "10px 14px", background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 6, color: C.text, fontSize: 13, fontFamily: "'JetBrains Mono',monospace", resize: "vertical", marginBottom: 10 }} />
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                      <motion.button type="submit" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                        style={{ padding: "9px 20px", background: `${C.green}18`, border: `1px solid ${C.green}50`, borderRadius: 6, color: C.green, fontSize: 12, fontFamily: "'JetBrains Mono',monospace", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                        <Send size={12} /> Publish
                      </motion.button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Filter indicator */}
            {(selectedTopic || search) && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, fontSize: 11, color: C.text2 }}>
                <Filter size={12} /> Showing {filtered.length} result{filtered.length !== 1 ? "s" : ""}
                {selectedTopic && <span style={{ color: C.blue, fontWeight: 600 }}>for #{selectedTopic}</span>}
                {search && <span style={{ color: C.blue, fontWeight: 600 }}>matching "{search}"</span>}
              </div>
            )}

            {/* Posts */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {filtered.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 20px", background: C.bg3, border: `1px solid ${C.border}`, borderRadius: 8 }}>
                  <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 18, color: C.text, marginBottom: 8 }}>No posts found</p>
                  <p style={{ fontSize: 12, color: C.text2 }}>{selectedTopic || search ? "Try a different filter or search term." : "Be the first to start a conversation!"}</p>
                </div>
              ) : filtered.map((post, i) => (
                <PostCard key={post._id} post={post} handleVote={handleVote} addComment={addComment} />
              ))}
            </div>
          </div>

          {/* ── Right sidebar ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12, position: "sticky", top: 98 }}>

            {/* Success stories */}
            <div style={{ background: C.bg3, border: `1px solid ${C.border}`, borderRadius: 8, padding: 14 }}>
              <p style={{ fontSize: 9, color: C.text3, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>🏆 Success Stories</p>
              {[
                { name: "Riverdale Community", stat: "85% energy independence in 6 months" },
                { name: "GreenTech Industries", stat: "$125K annual savings" },
                { name: "Mountain View School", stat: "Students powering the campus" },
              ].map(({ name, stat }) => (
                <div key={name} style={{ padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
                  <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 12, color: C.text, marginBottom: 4 }}>{name}</p>
                  <p style={{ fontSize: 10, color: C.text2 }}>{stat}</p>
                </div>
              ))}
              <motion.button whileHover={{ x: 3 }} whileTap={{ scale: 0.97 }}
                onClick={() => { const s = encodeURIComponent("My EcoGrid Story"); window.location.href = `mailto:support@ecogrid.io?subject=${s}`; }}
                style={{ marginTop: 10, width: "100%", padding: "7px", background: "transparent", border: `1px solid ${C.border2}`, borderRadius: 4, color: C.text2, fontSize: 10, fontFamily: "'JetBrains Mono',monospace", cursor: "pointer" }}>
                Submit Your Story →
              </motion.button>
            </div>

            {/* Newsletter */}
            <div style={{ background: C.bg3, border: `1px solid ${C.border}`, borderRadius: 8, padding: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <Bell size={13} style={{ color: C.green }} />
                <p style={{ fontSize: 11, fontFamily: "'Syne',sans-serif", fontWeight: 700, color: C.text }}>Weekly Digest</p>
              </div>
              <p style={{ fontSize: 10, color: C.text2, marginBottom: 12, lineHeight: 1.5 }}>Get the top community posts and grid updates every Monday.</p>
              <form onSubmit={e => { e.preventDefault(); e.target.reset(); }}>
                <input type="email" name="email" required placeholder="your@email.com"
                  style={{ width: "100%", padding: "8px 12px", background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 4, color: C.text, fontSize: 11, fontFamily: "'JetBrains Mono',monospace", marginBottom: 8 }} />
                <motion.button type="submit" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  style={{ width: "100%", padding: "8px", background: `${C.green}15`, border: `1px solid ${C.green}40`, borderRadius: 4, color: C.green, fontSize: 10, fontFamily: "'JetBrains Mono',monospace", cursor: "pointer", textTransform: "uppercase", letterSpacing: 1 }}>
                  Subscribe
                </motion.button>
              </form>
            </div>

            {/* Community guidelines */}
            <div style={{ background: C.bg3, border: `1px solid ${C.border}`, borderRadius: 8, padding: 14 }}>
              <p style={{ fontSize: 9, color: C.text3, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Community Rules</p>
              {["Be respectful and constructive", "Share real-world data & experiments", "No spam or promotional content", "Tag topics accurately"].map((r, i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, fontSize: 10, color: C.text2 }}>
                  <span style={{ color: C.green, fontFamily: "'Syne',sans-serif", fontWeight: 700 }}>{i + 1}.</span> {r}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ borderTop: `1px solid ${C.border}`, padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 10, color: C.text3 }}>
          <span style={{ color: C.text2 }}>EcoGrid Community Forum</span>
          <span>© {new Date().getFullYear()} EcoGrid. All rights reserved.</span>
        </div>
      </div>
    </>
  );
};

export default Blog;
