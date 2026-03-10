import BlogPost from '../Models/BlogPost.js';
import Users from '../Models/Users.js';

// Get community statistics
export const getCommunityStats = async (req, res) => {
    try {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        // Real member count from Users collection
        const totalMembers = await Users.countDocuments();
        
        // Get posts created today
        const postsToday = await BlogPost.countDocuments({
            timestamp: { $gte: today }
        });
        
        // Get total comments & votes across all posts
        const allPosts = await BlogPost.find({}, { comments: 1, upvotes: 1, downvotes: 1, energyKwh: 1 });
        const totalComments = allPosts.reduce((sum, post) => sum + (post.comments?.length || 0), 0);

        // Estimate energy saved: 0.62 kg CO₂ per kWh of community-tracked renewable energy
        const energySaved = Math.round(
            allPosts.reduce((sum, post) => sum + (Number(post.energyKwh) || 0), 0) * 0.62
        );
        
        // Simulate online users (5-15% of totalMembers, min 1)
        const onlineNow = Math.max(1, Math.floor(totalMembers * (0.05 + Math.random() * 0.10)));
        
        res.status(200).json({
            success: true,
            stats: {
                totalMembers,
                onlineNow,
                energySaved: `${energySaved} kg`,
                postsToday,
            }
        });
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch community stats", error: err.message });
    }
};

export const getPosts = async (req, res) => {
    try {
        const { sort } = req.query; // e.g. "newest", "oldest", "popular"
        let sortOption = { timestamp: -1 }; // newest default
        
        if (sort === 'oldest') {
            sortOption = { timestamp: 1 };
        } else if (sort === 'popular') {
            // Can't directly sort by a computed difference natively easily without aggregation,
            // but we'll fetch and sort in memory for this demo or sort by upvotes
            sortOption = { upvotes: -1 }; 
        }

        let posts = await BlogPost.find().sort(sortOption);
        
        // If popular, custom sort
        if (sort === 'popular') {
            posts = posts.sort((a, b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes));
        }

        res.status(200).json(posts);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch posts", error: err.message });
    }
};

export const createPost = async (req, res) => {
    try {
        const { title, content, authorName, authorAvatar } = req.body;
        const newPost = new BlogPost({
            title,
            content,
            authorName: authorName || "Guest User",
            authorAvatar: authorAvatar || "👤"
        });
        const savedPost = await newPost.save();
        res.status(201).json(savedPost);
    } catch (err) {
        res.status(500).json({ message: "Failed to create post", error: err.message });
    }
};

export const votePost = async (req, res) => {
    try {
        const { id } = req.params;
        const { isUpvote } = req.body; // boolean
        
        const update = isUpvote ? { $inc: { upvotes: 1 } } : { $inc: { downvotes: 1 } };
        const updatedPost = await BlogPost.findByIdAndUpdate(id, update, { new: true });
        
        if (!updatedPost) return res.status(404).json({ message: "Post not found" });
        
        res.status(200).json(updatedPost);
    } catch (err) {
        res.status(500).json({ message: "Failed to vote", error: err.message });
    }
};

export const addComment = async (req, res) => {
    try {
        const { id } = req.params;
        const { content, authorName, authorAvatar } = req.body;
        
        const post = await BlogPost.findById(id);
        if (!post) return res.status(404).json({ message: "Post not found" });
        
        const newComment = {
            content,
            authorName: authorName || "Guest User",
            authorAvatar: authorAvatar || "👤"
        };
        
        post.comments.push(newComment);
        await post.save();
        
        res.status(201).json(post);
    } catch (err) {
        res.status(500).json({ message: "Failed to add comment", error: err.message });
    }
};

export const voteComment = async (req, res) => {
    try {
        const { id, commentId } = req.params;
        const { isUpvote } = req.body; // boolean
        
        const post = await BlogPost.findById(id);
        if (!post) return res.status(404).json({ message: "Post not found" });
        
        const comment = post.comments.id(commentId);
        if (!comment) return res.status(404).json({ message: "Comment not found" });
        
        if (isUpvote) {
            comment.upvotes += 1;
        } else {
            comment.downvotes += 1;
        }
        
        await post.save();
        res.status(200).json(post);
    } catch (err) {
        res.status(500).json({ message: "Failed to vote on comment", error: err.message });
    }
};
