import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

export const protect = async (req, res, next) => {
    try {
        // Get token from httpOnly cookie
        const token = req.cookies?.accessToken;

        if (!token) {
            return res.status(401).json({
                status: "error",
                message: "Not authorized, no token provided",
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Attach user to request (exclude sensitive fields)
        req.user = await User.findById(decoded.id).select("-googleId");

        if (!req.user) {
            return res.status(401).json({
                status: "error",
                message: "Not authorized, user not found",
            });
        }

        next();
    } catch (error) {
        return res.status(401).json({
            status: "error",
            message: "Not authorized, token invalid",
        });
    }
};
