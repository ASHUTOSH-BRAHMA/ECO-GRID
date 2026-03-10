import express from "express";
import { 
    getListings, 
    getUserListings, 
    createListing, 
    updateListing, 
    deleteListing,
    getProsumerAnalytics
} from "../Controllers/ListingController.js";
import { authval } from "../Middlewares/Auth.js";

const router = express.Router();

// Public routes
router.get('/listings', getListings);

// Protected routes
router.get('/user/listings', authval, getUserListings);
router.get('/user/listings/analytics', authval, getProsumerAnalytics);
router.post('/listings', authval, createListing);
router.put('/listings/:id', authval, updateListing);
router.delete('/listings/:id', authval, deleteListing);

export default router; 