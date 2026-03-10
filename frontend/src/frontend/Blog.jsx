import React, { useState, useEffect, useContext } from "react";
import { motion } from "framer-motion";
import NavBar from "./NavBar";
import { AuthContext } from "../Context/AuthContext";

const Blog = () => {
    const [posts, setPosts] = useState([]);
    const [newPostContent, setNewPostContent] = useState("");
    const [newPostTitle, setNewPostTitle] = useState("");
    const { user } = useContext(AuthContext);
    const [sortBy, setSortBy] = useState("newest");
    const [isComposingPost, setIsComposingPost] = useState(false);
    const [selectedTopic, setSelectedTopic] = useState(null);
    const [communityStats, setCommunityStats] = useState({
        totalMembers: 0,
        onlineNow: 0,
        energySaved: '0 kg',
        postsToday: 0
    });

    const topics = ["Solar", "Wind", "Battery Storage", "P2P Trading", "AI Optimization", "Microgrids", "Policy", "Installation", "Cost Savings", "Blockchain"];

    // Derive current user from AuthContext — fall back to Guest if not logged in
    const currentUser = {
        name: user?.user?.name || "Guest User",
        avatar: user?.user?.name ? user.user.name.charAt(0).toUpperCase() : "👤"
    };

    const getAuthHeaders = () => {
        const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        return token ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } : { 'Content-Type': 'application/json' };
    };

    // Fetch posts from backend
    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const response = await fetch(`http://localhost:8080/api/community/posts?sort=${sortBy}`);
                if (response.ok) {
                    const data = await response.json();
                    setPosts(data);
                }
            } catch (error) {
                console.error("Error fetching posts:", error);
            }
        };
        fetchPosts();
    }, [sortBy]);

    // Fetch community stats
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await fetch('http://localhost:8080/api/community/stats');
                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        setCommunityStats(data.stats);
                    }
                }
            } catch (error) {
                console.error("Error fetching community stats:", error);
            }
        };
        fetchStats();
        // Refresh stats every 30 seconds
        const interval = setInterval(fetchStats, 30000);
        return () => clearInterval(interval);
    }, []);

    // Handle post creation
    const handlePostSubmit = async (e) => {
        e.preventDefault();
        if (!newPostTitle.trim() || !newPostContent.trim()) return;

        try {
            const response = await fetch('http://localhost:8080/api/community/posts', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    title: newPostTitle,
                    content: newPostContent,
                    authorName: currentUser.name,
                    authorAvatar: currentUser.avatar
                })
            });

            if (response.ok) {
                const newPost = await response.json();
                setPosts([newPost, ...posts]);
                setNewPostTitle("");
                setNewPostContent("");
                setIsComposingPost(false);
            }
        } catch (error) {
            console.error("Error creating post:", error);
        }
    };

    // Add comment to a post
    const addComment = async (postId, commentContent) => {
        if (!commentContent.trim()) return;

        try {
            const response = await fetch(`http://localhost:8080/api/community/posts/${postId}/comments`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    content: commentContent,
                    authorName: currentUser.name,
                    authorAvatar: currentUser.avatar
                })
            });

            if (response.ok) {
                const updatedPost = await response.json();
                setPosts(posts.map(post => post._id === postId ? updatedPost : post));
            }
        } catch (error) {
            console.error("Error adding comment:", error);
        }
    };

    // Handle voting
    const handleVote = async (postId, commentId, isUpvote) => {
        try {
            let url = `http://localhost:8080/api/community/posts/${postId}/vote`;
            if (commentId) {
                url = `http://localhost:8080/api/community/posts/${postId}/comments/${commentId}/vote`;
            }

            const response = await fetch(url, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ isUpvote })
            });

            if (response.ok) {
                const updatedPost = await response.json();
                setPosts(posts.map(post => post._id === postId ? updatedPost : post));
            }
        } catch (error) {
            console.error("Error voting:", error);
        }
    };

    // Filter posts by selected topic and sort
    const filteredPosts = selectedTopic
        ? posts.filter(post => post.title?.toLowerCase().includes(selectedTopic.toLowerCase()) || post.content?.toLowerCase().includes(selectedTopic.toLowerCase()))
        : posts;

    const formatTimestamp = (timestampString) => {
        if (!timestampString) return 'Unknown';
        const timestamp = new Date(timestampString);
        const now = new Date();
        const diffMs = now - timestamp;
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHour = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHour / 24);

        if (diffDay > 0) {
            return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
        } else if (diffHour > 0) {
            return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
        } else if (diffMin > 0) {
            return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
        } else {
            return 'Just now';
        }
    };

    return (
        <div className="min-h-screen bg-[#060810] text-[#e8eaf6] overflow-hidden relative mt-16 font-['JetBrains_Mono']">
            <NavBar />

            {/* Floating Energy Particles Animation - Enhanced from homepage */}
            {[...Array(12)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute text-2xl opacity-20 hover:opacity-100 transition-opacity"
                    style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        zIndex: 1
                    }}
                    initial={{ opacity: 0, y: -50 }}
                    animate={{
                        opacity: [0, 0.3, 0.3, 0],
                        y: ["0vh", "25vh", "50vh", "100vh"],
                        x: i % 3 === 0 ? [0, 50, 0, -50] : i % 3 === 1 ? [0, -30, 30, 0] : [0, 20, -20, 40],
                        rotate: i % 2 === 0 ? 360 : -360
                    }}
                    transition={{
                        duration: 8 + i % 5 * 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                        times: [0, 0.2, 0.8, 1]
                    }}
                >
                    {i % 5 === 0 ? "⚡" : i % 5 === 1 ? "🔋" : i % 5 === 2 ? "💡" : i % 5 === 3 ? "🌞" : "🌿"}
                </motion.div>
            ))}

            {/* Community Header */}
            <motion.header
                className="bg-[#0c0f1a] py-12 text-center border-b border-[#1e2440] relative z-10"
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1 }}
            >
                <div className="absolute inset-0 bg-gradient-to-b from-[#00e5a0]/5 to-transparent pointer-events-none" />
                <motion.h1
                    className="text-4xl md:text-5xl font-bold text-[#e8eaf6] font-['Syne']"
                    animate={{
                        scale: [1, 1.01, 1],
                    }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                    EcoGrid Community
                </motion.h1>
                <motion.p
                    className="mt-4 text-[#00e5a0] font-mono tracking-widest uppercase text-xs md:text-sm max-w-2xl mx-auto"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 1 }}
                >
                    Share your sustainable energy journey with others
                </motion.p>
            </motion.header>

            {/* Main Content */}
            <div className="container mx-auto px-4 py-8 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Sidebar - Left */}
                    <div className="lg:col-span-1">
                        <motion.div
                            className="bg-[#0c0f1a] rounded-xl border border-[#1e2440] shadow-sm p-6 mb-6"
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            <h2 className="text-sm font-bold text-[#e8eaf6] mb-4 uppercase tracking-wider font-['Syne']">Community Stats</h2>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center p-3 bg-[#111525] border border-[#1e2440] rounded-lg">
                                    <span className="text-[#8892b0] font-mono text-[10px] uppercase tracking-wider flex items-center">
                                        <span className="mr-2 text-sm text-[#00e5a0]">👥</span> Members
                                    </span>
                                    <span className="font-bold text-[#e8eaf6] font-mono">{communityStats.totalMembers.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-[#111525] border border-[#1e2440] rounded-lg">
                                    <span className="text-[#8892b0] font-mono text-[10px] uppercase tracking-wider flex items-center">
                                        <span className="mr-2 text-sm text-[#00e5a0]">🟢</span> Online Now
                                    </span>
                                    <span className="font-bold text-[#00e5a0] font-mono">{communityStats.onlineNow}</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-[#111525] border border-[#1e2440] rounded-lg">
                                    <span className="text-[#8892b0] font-mono text-[10px] uppercase tracking-wider flex items-center">
                                        <span className="mr-2 text-sm text-[#ffd166]">⚡</span> Energy Saved
                                    </span>
                                    <span className="font-bold text-[#ffd166] font-mono">{communityStats.energySaved}</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-[#111525] border border-[#1e2440] rounded-lg">
                                    <span className="text-[#8892b0] font-mono text-[10px] uppercase tracking-wider flex items-center">
                                        <span className="mr-2 text-sm text-[#4d9fff]">📝</span> Posts Today
                                    </span>
                                    <span className="font-bold text-[#4d9fff] font-mono">{communityStats.postsToday}</span>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            className="bg-[#0c0f1a] rounded-xl border border-[#1e2440] shadow-sm p-6"
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                        >
                            <h2 className="text-sm font-bold text-[#e8eaf6] mb-4 uppercase tracking-wider font-['Syne']">Community Topics</h2>
                            <div className="flex flex-wrap gap-2">
                                {topics.map((tag, i) => (
                                    <motion.span
                                        key={i}
                                        onClick={() => setSelectedTopic(selectedTopic === tag ? null : tag)}
                                        className={`px-3 py-1.5 border rounded-lg text-xs font-mono uppercase tracking-wider cursor-pointer transition-colors ${
                                            selectedTopic === tag
                                                ? "bg-[#00e5a0]/10 text-[#00e5a0] border-[#00e5a0]/50 shadow-[0_0_10px_rgba(0,229,160,0.1)]"
                                                : "bg-[#111525] text-[#8892b0] border-[#1e2440] hover:border-[#00e5a0]/30 hover:text-[#00e5a0]"
                                        }`}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        {tag}
                                    </motion.span>
                                ))}
                            </div>
                            {selectedTopic && (
                                <div className="mt-4 p-3 bg-[#111525] border border-[#1e2440] rounded-lg flex items-center justify-between">
                                    <span className="text-[10px] text-[#8892b0] font-mono uppercase tracking-wider">
                                        Filtering: <strong className="text-[#00e5a0]">{selectedTopic}</strong>
                                    </span>
                                    <button
                                        onClick={() => setSelectedTopic(null)}
                                        className="text-[10px] text-[#ff6b6b] hover:text-[#ff4f4f] font-mono uppercase tracking-wider transition-colors hover:underline"
                                    >
                                        Clear
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </div>

                    {/* Main Content - Middle */}
                    <div className="lg:col-span-2">
                        {/* Create Post Section */}
                        <motion.div
                            className="bg-[#0c0f1a] rounded-xl border border-[#1e2440] shadow-sm mb-6 overflow-hidden"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            {!isComposingPost ? (
                                <div
                                    className="p-4 flex items-center space-x-3 cursor-pointer hover:bg-[#111525] transition-colors"
                                    onClick={() => setIsComposingPost(true)}
                                >
                                    <div className="text-2xl">{currentUser.avatar}</div>
                                    <div className="flex-1 bg-[#111525] border border-[#1e2440] rounded-lg py-3 px-4 text-[#8892b0] font-mono text-sm transition-colors hover:border-[#00e5a0]/30 transition-all">
                                        Share your EcoGrid experience...
                                    </div>
                                </div>
                            ) : (
                                <motion.form
                                    className="p-4"
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    transition={{ duration: 0.3 }}
                                    onSubmit={handlePostSubmit}
                                >
                                    <div className="mb-4">
                                        <input
                                            type="text"
                                            placeholder="Title"
                                            className="w-full p-3 bg-[#111525] text-[#e8eaf6] border border-[#1e2440] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00e5a0] focus:border-transparent font-['Syne'] text-lg placeholder-[#8892b0]"
                                            value={newPostTitle}
                                            onChange={(e) => setNewPostTitle(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <textarea
                                        className="w-full p-3 bg-[#111525] text-[#e8eaf6] border border-[#1e2440] rounded-lg min-h-[120px] focus:outline-none focus:ring-2 focus:ring-[#00e5a0] focus:border-transparent font-mono text-sm placeholder-[#8892b0]"
                                        placeholder="Share your experience with the community..."
                                        value={newPostContent}
                                        onChange={(e) => setNewPostContent(e.target.value)}
                                        required
                                    ></textarea>
                                    <div className="flex justify-end space-x-3 mt-4">
                                        <motion.button
                                            type="button"
                                            className="px-4 py-2 text-[#8892b0] hover:text-[#e8eaf6] hover:bg-[#111525] rounded-lg font-mono text-[10px] uppercase tracking-wider font-bold transition-colors"
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => setIsComposingPost(false)}
                                        >
                                            Cancel
                                        </motion.button>
                                        <motion.button
                                            type="submit"
                                            className="px-6 py-2 bg-[#00e5a0]/10 text-[#00e5a0] border border-[#00e5a0]/50 rounded-lg hover:bg-[#00e5a0]/20 font-mono text-[10px] uppercase tracking-wider font-bold shadow-[0_0_10px_rgba(0,229,160,0.1)] transition-colors"
                                            whileHover={{ scale: 1.02, boxShadow: "0px 0px 15px rgba(0,229,160,0.2)" }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            Post
                                        </motion.button>
                                    </div>
                                </motion.form>
                            )}
                        </motion.div>

                        {/* Sort Controls */}
                        <motion.div
                            className="bg-[#0c0f1a] rounded-xl border border-[#1e2440] shadow-sm p-4 mb-6 flex items-center justify-between"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                        >
                            <div className="text-[#8892b0] font-mono text-[10px] uppercase tracking-wider font-bold flex items-center">
                                <span className="mr-2">⇅</span> Sort By:
                            </div>
                            <div className="flex space-x-2">
                                {[
                                    { id: "newest", label: "Newest" },
                                    { id: "popular", label: "Popular" },
                                    { id: "oldest", label: "Oldest" }
                                ].map((option) => (
                                    <motion.button
                                        key={option.id}
                                        className={`px-3 py-1.5 border rounded-lg text-xs font-mono uppercase tracking-wider transition-colors ${
                                            sortBy === option.id
                                                ? "bg-[#00e5a0]/10 text-[#00e5a0] border-[#00e5a0]/50 shadow-[0_0_10px_rgba(0,229,160,0.1)]"
                                                : "bg-[#111525] text-[#8892b0] border-[#1e2440] hover:border-[#00e5a0]/30 hover:text-[#00e5a0]"
                                            }`}
                                        onClick={() => setSortBy(option.id)}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        {option.label}
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>

                        {/* Posts List */}
                        {filteredPosts.length === 0 ? (
                            <div className="text-center py-16 bg-[#0c0f1a] rounded-xl border border-[#1e2440] shadow-sm">
                                <div className="text-4xl mb-4 opacity-50">🔍</div>
                                <h3 className="text-lg font-bold text-[#e8eaf6] font-['Syne']">No posts found</h3>
                                <p className="text-[#8892b0] font-mono text-sm mt-2">
                                    {selectedTopic 
                                        ? `No posts match the topic "${selectedTopic}"` 
                                        : "Be the first to start a conversation!"}
                                </p>
                                {selectedTopic && (
                                    <button
                                        onClick={() => setSelectedTopic(null)}
                                        className="mt-6 px-6 py-2 bg-[#111525] text-[#00e5a0] border border-[#1e2440] hover:border-[#00e5a0]/50 rounded-lg font-mono text-xs uppercase tracking-wider transition-colors"
                                    >
                                        Clear filter
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {filteredPosts.map((post, index) => (
                                <motion.div
                                    key={post._id}
                                    className="bg-[#0c0f1a] rounded-xl border border-[#1e2440] shadow-sm overflow-hidden transition-all hover:border-[#00e5a0]/30"
                                    initial={{ opacity: 0, y: 50 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                >
                                    {/* Post Header */}
                                    <div className="bg-[#111525] p-4 border-b border-[#1e2440]">
                                        <div className="flex items-center space-x-3">
                                            <div className="text-2xl bg-[#0c0f1a] border border-[#1e2440] p-2 rounded-full h-12 w-12 flex items-center justify-center shadow-inner">{post.authorAvatar || "👤"}</div>
                                            <div>
                                                <div className="font-bold text-[#e8eaf6] font-['Syne'] text-sm">{post.authorName || "Guest User"}</div>
                                                <div className="text-[#8892b0] font-mono text-[10px] uppercase tracking-wider mt-1">{formatTimestamp(post.timestamp)}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Post Content */}
                                    <div className="p-6">
                                        <h2 className="text-xl font-bold mb-3 text-[#e8eaf6] font-['Syne']">{post.title}</h2>
                                        <p className="text-[#8892b0] font-mono text-sm leading-relaxed whitespace-pre-line">{post.content}</p>
                                    </div>

                                    {/* Post Actions */}
                                    <div className="px-6 py-3 bg-[#111525] border-t border-[#1e2440] flex items-center space-x-6">
                                        <div className="flex items-center space-x-2">
                                            <motion.button
                                                className="text-[#8892b0] hover:text-[#00e5a0] transition-colors"
                                                onClick={() => handleVote(post._id, null, true)}
                                                whileHover={{ scale: 1.2 }}
                                                whileTap={{ scale: 0.9 }}
                                            >
                                                <span className="text-lg">👍</span>
                                            </motion.button>
                                            <span className="text-[#e8eaf6] font-mono text-sm font-bold">{post.upvotes}</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <motion.button
                                                className="text-[#8892b0] hover:text-[#ff4f4f] transition-colors"
                                                onClick={() => handleVote(post._id, null, false)}
                                                whileHover={{ scale: 1.2 }}
                                                whileTap={{ scale: 0.9 }}
                                            >
                                                <span className="text-lg">👎</span>
                                            </motion.button>
                                            <span className="text-[#e8eaf6] font-mono text-sm font-bold">{post.downvotes}</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <span className="text-[#8892b0] text-lg">💬</span>
                                            <span className="text-[#e8eaf6] font-mono text-sm font-bold">{post.comments ? post.comments.length : 0}</span>
                                        </div>
                                        <motion.button
                                            className="text-[#8892b0] hover:text-[#4d9fff] ml-auto text-xs font-mono uppercase tracking-wider font-bold transition-colors flex items-center"
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => {
                                                if (navigator.share) {
                                                    navigator.share({
                                                        title: post.title,
                                                        text: post.content.substring(0, 100) + '...',
                                                        url: window.location.href
                                                    });
                                                } else {
                                                    navigator.clipboard.writeText(window.location.href);
                                                    alert('Link copied to clipboard!');
                                                }
                                            }}
                                        >
                                            <span className="mr-1 text-lg">🔗</span> Share
                                        </motion.button>
                                    </div>

                                    {/* Comments */}
                                    {post.comments && post.comments.length > 0 && (
                                        <div className="border-t border-[#1e2440] bg-[#0c0f1a]">
                                            <div className="p-4 space-y-3">
                                                {post.comments.map((comment) => (
                                                    <motion.div
                                                        key={comment._id}
                                                        className="bg-[#111525] p-4 rounded-xl border border-[#1e2440]"
                                                        initial={{ opacity: 0, x: -20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ duration: 0.5 }}
                                                    >
                                                        <div className="flex items-center space-x-2 mb-2">
                                                            <div className="text-lg">{comment.authorAvatar || "👤"}</div>
                                                            <div className="font-bold text-[#e8eaf6] font-['Syne'] text-xs">{comment.authorName || "Guest User"}</div>
                                                            <div className="text-xs text-[#8892b0] font-mono uppercase tracking-wider pl-2 border-l border-[#1e2440]">{formatTimestamp(comment.timestamp)}</div>
                                                        </div>
                                                        <p className="text-[#8892b0] font-mono text-xs leading-relaxed ml-7">{comment.content}</p>
                                                        <div className="mt-3 flex items-center space-x-4 ml-7">
                                                            <div className="flex items-center space-x-1">
                                                                <motion.button
                                                                    className="text-xs text-[#8892b0] hover:text-[#00e5a0] transition-colors"
                                                                    onClick={() => handleVote(post._id, comment._id, true)}
                                                                    whileHover={{ scale: 1.2 }}
                                                                    whileTap={{ scale: 0.9 }}
                                                                >
                                                                    👍
                                                                </motion.button>
                                                                <span className="text-xs text-[#e8eaf6] font-mono font-bold">{comment.upvotes}</span>
                                                            </div>
                                                            <div className="flex items-center space-x-1">
                                                                <motion.button
                                                                    className="text-xs text-[#8892b0] hover:text-[#ff4f4f] transition-colors"
                                                                    onClick={() => handleVote(post._id, comment._id, false)}
                                                                    whileHover={{ scale: 1.2 }}
                                                                    whileTap={{ scale: 0.9 }}
                                                                >
                                                                    👎
                                                                </motion.button>
                                                                <span className="text-xs text-[#e8eaf6] font-mono font-bold">{comment.downvotes}</span>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Add Comment */}
                                    <div className="p-4 border-t border-[#1e2440] bg-[#111525]">
                                        <CommentForm postId={post._id} addComment={addComment} />
                                    </div>
                                </motion.div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Sidebar - Right */}
                    <div className="lg:col-span-1">
                        <motion.div
                            className="bg-[#0c0f1a] rounded-xl border border-[#1e2440] shadow-sm p-6 mb-6"
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            <h2 className="text-sm font-bold text-[#e8eaf6] mb-4 uppercase tracking-wider font-['Syne']">Latest Updates</h2>
                            <div className="space-y-4">
                                <div className="border-l-2 border-[#00e5a0] pl-3">
                                    <h3 className="text-[#e8eaf6] font-mono text-xs uppercase tracking-wider font-bold">New AI Forecasting Engine</h3>
                                    <p className="text-[#8892b0] font-mono text-[10px] mt-1">Enhanced prediction accuracy by 15% with new weather data integration.</p>
                                    <p className="text-[#4d9fff] font-mono text-[8px] uppercase tracking-wider mt-2 block">2 days ago</p>
                                </div>
                                <div className="border-l-2 border-[#4d9fff] pl-3">
                                    <h3 className="text-[#e8eaf6] font-mono text-xs uppercase tracking-wider font-bold">P2P Trading Update</h3>
                                    <p className="text-[#8892b0] font-mono text-[10px] mt-1">Lower transaction fees and faster settlement times now live.</p>
                                    <p className="text-[#4d9fff] font-mono text-[8px] uppercase tracking-wider mt-2 block">1 week ago</p>
                                </div>
                                <div className="border-l-2 border-[#a78bfa] pl-3">
                                    <h3 className="text-[#e8eaf6] font-mono text-xs uppercase tracking-wider font-bold">Mobile App v2.1 Released</h3>
                                    <p className="text-[#8892b0] font-mono text-[10px] mt-1">Now with real-time energy production monitoring dashboard.</p>
                                    <p className="text-[#4d9fff] font-mono text-[8px] uppercase tracking-wider mt-2 block">2 weeks ago</p>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            className="bg-[#0c0f1a] rounded-xl border border-[#1e2440] shadow-sm p-6 mb-6"
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                        >
                            <h2 className="text-sm font-bold text-[#e8eaf6] mb-4 uppercase tracking-wider font-['Syne']">Success Stories</h2>
                            <div className="space-y-4">
                                <div className="flex items-start space-x-3 bg-[#111525] p-3 rounded-lg border border-[#1e2440]">
                                    <div className="text-xl mt-1">🏆</div>
                                    <div>
                                        <h3 className="text-[#e8eaf6] font-mono text-xs font-bold uppercase tracking-wider">Riverdale Community</h3>
                                        <p className="text-[#8892b0] font-mono text-[10px] mt-1">85% energy independence achieved in just 6 months</p>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-3 bg-[#111525] p-3 rounded-lg border border-[#1e2440]">
                                    <div className="text-xl mt-1">🏆</div>
                                    <div>
                                        <h3 className="text-[#e8eaf6] font-mono text-xs font-bold uppercase tracking-wider">GreenTech Industries</h3>
                                        <p className="text-[#8892b0] font-mono text-[10px] mt-1">$125,000 annual savings after full EcoGrid implementation</p>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-3 bg-[#111525] p-3 rounded-lg border border-[#1e2440]">
                                    <div className="text-xl mt-1">🏆</div>
                                    <div>
                                        <h3 className="text-[#e8eaf6] font-mono text-xs font-bold uppercase tracking-wider">Mountain View School</h3>
                                        <p className="text-[#8892b0] font-mono text-[10px] mt-1">Educational integration helped students learn about renewable energy</p>
                                    </div>
                                </div>
                            </div>
                            <motion.button
                                className="w-full mt-4 py-3 bg-[#111525] text-[#00e5a0] rounded-lg border border-[#1e2440] font-mono text-xs uppercase tracking-wider font-bold hover:border-[#00e5a0]/50 transition-colors shadow-sm"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => {
                                    const subject = encodeURIComponent('My EcoGrid Success Story');
                                    const body = encodeURIComponent('Hi EcoGrid Team,\n\nI would like to share my success story with the community.\n\n[Please describe your experience with EcoGrid]\n\nBest regards,\n' + currentUser.name);
                                    window.location.href = `mailto:support@ecogrid.com?subject=${subject}&body=${body}`;
                                }}
                            >
                                Submit Your Story
                            </motion.button>
                        </motion.div>

                        <motion.div
                            className="bg-[#0c0f1a] border border-[#1e2440] rounded-xl shadow-sm p-6"
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6, delay: 0.4 }}
                        >
                            <h2 className="text-sm font-bold text-[#e8eaf6] mb-3 font-['Syne'] uppercase tracking-wider">Join Our Newsletter</h2>
                            <p className="text-[#8892b0] font-mono text-[10px] mb-4">Get the latest updates on sustainable energy innovations and EcoGrid community news.</p>
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                const email = e.target.email.value;
                                if (email) {
                                    alert(`Thank you for subscribing! We'll send updates to ${email}`);
                                    e.target.reset();
                                }
                            }}>
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="Your email address"
                                    className="w-full p-3 bg-[#111525] text-[#e8eaf6] placeholder-[#8892b0] rounded-lg border border-[#1e2440] focus:outline-none focus:ring-2 focus:ring-[#00e5a0] mb-3 font-mono text-xs"
                                    required
                                />
                                <motion.button
                                    type="submit"
                                    className="w-full py-3 bg-[#00e5a0]/10 text-[#00e5a0] border border-[#00e5a0]/50 rounded-lg font-mono text-xs uppercase tracking-wider font-bold hover:bg-[#00e5a0]/20 transition-colors shadow-sm"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    Subscribe
                                </motion.button>
                            </form>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <motion.footer
                className="bg-[#0c0f1a] text-[#8892b0] py-8 text-center mt-16 shadow-lg border-t border-[#1e2440] relative z-10"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 1 }}
            >
                <p className="text-xs font-mono tracking-wider uppercase">&copy; 2025 EcoGrid Community. All Rights Reserved.</p>
                <div className="mt-6 flex justify-center space-x-6">
                    {["📱", "👥", "📸", "💼"].map((icon, index) => (
                        <motion.a
                            key={index}
                            href="#"
                            className="text-[#8892b0] hover:text-[#00e5a0] transition duration-300 opacity-70 hover:opacity-100"
                            whileHover={{ scale: 1.2, rotate: 10 }}
                        >
                            <span className="text-2xl grayscale hover:grayscale-0">{icon}</span>
                        </motion.a>
                    ))}
                </div>
            </motion.footer>
        </div>
    );
};

// Comment Form Component
const CommentForm = ({ postId, addComment }) => {
    const [comment, setComment] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!comment.trim()) return;

        addComment(postId, comment);
        setComment("");
    };

    return (
        <form onSubmit={handleSubmit} className="flex">
            <input
                type="text"
                placeholder="Add a comment..."
                className="flex-1 bg-[#0c0f1a] border border-[#1e2440] border-r-0 rounded-l-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-[#00e5a0] text-[#e8eaf6] font-mono text-xs placeholder-[#8892b0]"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
            />
            <motion.button
                type="submit"
                className="bg-[#00e5a0]/10 text-[#00e5a0] border border-[#00e5a0]/50 py-3 px-6 rounded-r-lg hover:bg-[#00e5a0]/20 focus:outline-none focus:ring-2 focus:ring-[#00e5a0] font-mono text-xs uppercase tracking-wider font-bold transition-colors shadow-sm"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={!comment.trim()}
            >
                Post
            </motion.button>
        </form>
    );
};

export default Blog;