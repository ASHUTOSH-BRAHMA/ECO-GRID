import e from "express";
import 'dotenv/config' ;
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import connectDB from "./DB/db.js";
import bodyParser from "body-parser";
import AuthRouter from "./Routes/AuthRouter.js";
import ListingRouter from "./Routes/ListingRouter.js";
import DashboardRouter from "./Routes/DashboardRouter.js";
import CommunityRouter from "./Routes/CommunityRouter.js";
import TransactionRouter from "./Routes/TransactionRouter.js";

const app = e();
const httpServer = createServer(app);
const allowedOrigins = (process.env.CORS_ORIGINS || process.env.FRONTEND_URL || "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

const corsOrigin = (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
    }
    callback(new Error("Not allowed by CORS"));
};

// Initialize Socket.IO
const io = new Server(httpServer, {
    cors: {
        origin: corsOrigin,
        methods: ["GET", "POST"],
        credentials: true
    }
});

const PORT = process.env.PORT || 8080;
connectDB()

app.use(
    cors({
        origin: corsOrigin,
        credentials: true,
    })
);
app.use(bodyParser.json())

// Make io accessible to routes
app.set('io', io);

app.get('/', (req, res) => res.send('Hello from Node.js Backend!'));
app.use('/api',AuthRouter)
app.use('/api', ListingRouter)
app.use('/api', TransactionRouter)
app.use('/api/dashboard', DashboardRouter);
app.use('/api/community', CommunityRouter);

// Socket.IO Connection Handler
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    // Join room based on user ID
    socket.on('join-user-room', (userId) => {
        socket.join(`user-${userId}`);
        console.log(`User ${userId} joined their room`);
    });
    
    // Join marketplace room for real-time listings
    socket.on('join-marketplace', () => {
        socket.join('marketplace');
        console.log(`Client ${socket.id} joined marketplace room`);
    });
    
    // Handle energy data subscription
    socket.on('subscribe-energy-data', () => {
        socket.join('energy-updates');
        console.log(`Client ${socket.id} subscribed to energy updates`);
    });
    
    // Handle disconnect
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// Export io for use in other files
export { io };

httpServer.listen(PORT, () => {
    console.log(`Server is running on ${PORT}`)
    console.log(`WebSocket server is ready`)
})
