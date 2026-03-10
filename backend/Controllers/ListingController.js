import EnergyListing from "../Models/EnergyListing.js";
import Users from "../Models/Users.js";

// Get all listings with optional filtering
export const getListings = async (req, res) => {
    try {
        const { category, search } = req.query;
        
        // Build filter object
        const filter = {};
        
        if (category && category !== "All") {
            filter.category = category;
        }
        
        if (search) {
            filter.title = { $regex: search, $options: 'i' };
        }
        
        const listings = await EnergyListing.find(filter)
            .populate('producer', 'name')
            .sort({ createdAt: -1 });
            
        res.status(200).json({
            success: true,
            listings
        });
    } catch (error) {
        console.error("Error fetching listings:", error);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Get user's listings
export const getUserListings = async (req, res) => {
    try {
        const userId = req.user._id;
        
        const listings = await EnergyListing.find({ producer: userId })
            .sort({ createdAt: -1 });
            
        res.status(200).json({
            success: true,
            listings
        });
    } catch (error) {
        console.error("Error fetching user listings:", error);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Create new listing
export const createListing = async (req, res) => {
    try {
        const { title, location, capacity, price, category, icon } = req.body;
        const userId = req.user._id;
        
        // Create new listing
        const newListing = new EnergyListing({
            title,
            location,
            capacity,
            price: Number(price),
            category,
            icon: icon || "☀️",
            producer: userId
        });
        
        await newListing.save();
        
        // Populate producer info before sending response
        const populatedListing = await EnergyListing.findById(newListing._id)
            .populate('producer', 'name');
        
        // Emit socket event for real-time updates
        const io = req.app.get('io');
        if (io) {
            io.to('marketplace').emit('listing-created', populatedListing);
        }
            
        res.status(201).json({
            success: true,
            message: "Listing created successfully",
            listing: populatedListing
        });
    } catch (error) {
        console.error("Error creating listing:", error);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Update listing
export const updateListing = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, location, capacity, price, category, icon } = req.body;
        const userId = req.user._id;
        
        // Find listing and check ownership
        const listing = await EnergyListing.findById(id);
        
        if (!listing) {
            return res.status(404).json({
                success: false,
                message: "Listing not found"
            });
        }
        
        // Check if user owns this listing
        if (listing.producer.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to update this listing"
            });
        }
        
        // Update listing
        listing.title = title;
        listing.location = location;
        listing.capacity = capacity;
        listing.price = Number(price);
        listing.category = category;
        listing.icon = icon || listing.icon;
        
        await listing.save();
        
        // Populate and emit socket event
        const populatedListing = await EnergyListing.findById(listing._id)
            .populate('producer', 'name');
        
        const io = req.app.get('io');
        if (io) {
            io.to('marketplace').emit('listing-updated', populatedListing);
        }
        
        res.status(200).json({
            success: true,
            message: "Listing updated successfully",
            listing: populatedListing
        });
    } catch (error) {
        console.error("Error updating listing:", error);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Delete listing
export const deleteListing = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;
        
        // Find listing and check ownership
        const listing = await EnergyListing.findById(id);
        
        if (!listing) {
            return res.status(404).json({
                success: false,
                message: "Listing not found"
            });
        }
        
        // Check if user owns this listing
        if (listing.producer.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to delete this listing"
            });
        }
        
        await EnergyListing.findByIdAndDelete(id);
        
        // Emit socket event for real-time updates
        const io = req.app.get('io');
        if (io) {
            io.to('marketplace').emit('listing-deleted', { id });
        }
        
        res.status(200).json({
            success: true,
            message: "Listing deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting listing:", error);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Prosumer analytics: aggregates stats for the current user's listings
export const getProsumerAnalytics = async (req, res) => {
    try {
        const userId = req.user._id;

        const listings = await EnergyListing.find({ producer: userId });

        const totalListings = listings.length;
        const totalValueETK = listings.reduce((sum, l) => sum + (l.price || 0), 0);
        
        // Category breakdown
        const categoryBreakdown = {};
        listings.forEach(l => {
            categoryBreakdown[l.category] = (categoryBreakdown[l.category] || 0) + 1;
        });

        // Available vs limited vs sold out
        const statusBreakdown = { available: 0, limited: 0, sold_out: 0 };
        listings.forEach(l => {
            statusBreakdown[l.availability] = (statusBreakdown[l.availability] || 0) + 1;
        });

        // Most recently listed
        const latestListing = listings.sort((a, b) => b.createdAt - a.createdAt)[0];

        // Sales stats from sold transactions
        const Transaction = (await import('../Models/Transaction.js')).default;
        const soldTxs = await Transaction.find({ userId, type: 'sold', status: 'completed' });
        const totalETKEarned = soldTxs.reduce((sum, t) => sum + (t.amount || 0), 0);
        const totalKwhSold = soldTxs.reduce((sum, t) => sum + (t.energyKwh || 0), 0);
        const totalSales = soldTxs.length;

        res.status(200).json({
            success: true,
            analytics: {
                totalListings,
                totalValueETK,
                categoryBreakdown,
                statusBreakdown,
                latestListingDate: latestListing?.createdAt || null,
                totalETKEarned,
                totalKwhSold,
                totalSales
            }
        });
    } catch (error) {
        console.error("Error fetching prosumer analytics:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};