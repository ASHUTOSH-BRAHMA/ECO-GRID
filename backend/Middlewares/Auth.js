import jwt from "jsonwebtoken";

export const authval = (req, res, next) => {
    const authHeader = req.headers["authorization"];

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(403).json({ message: "Please login first" });
    }

    try {
        const token = authHeader.split(" ")[1]; // ✅ Extract the actual token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // ✅ Attach user data to request
        next();
    } catch (error) {
        return res.status(401).json({ message: "Session expired, please login again" });
    }
};
