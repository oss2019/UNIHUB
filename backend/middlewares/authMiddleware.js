import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import { AppError } from "../utils/appError.js";
import { catchAsync } from "../utils/catchAsync.js";

export const protect = catchAsync(async (req, res, next) => {
    // Get token from httpOnly cookie
    const token = req.cookies?.accessToken;

    if (!token) {
        return next(new AppError(401, "Not authorized, no token provided"));
    }

    // Verify token
    const decoded = await Promise.resolve().then(() =>
        jwt.verify(token, process.env.JWT_SECRET)
    );

    // Attach user to request (exclude sensitive fields)
    req.user = await User.findById(decoded.id).select("-googleId");

    if (!req.user) {
        return next(new AppError(401, "Not authorized, user not found"));
    }

    return next();
});
