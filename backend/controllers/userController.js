import User from "../models/userModel.js";
import { AppError } from "../utils/appError.js";
import { sendResponse } from "../utils/appResponse.js";
import { catchAsync } from "../utils/catchAsync.js";

// GET /api/users/:id — public profile
export const getUserProfile = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.params.id).select(
        "-googleId -__v"
    );

    if (!user) {
        return next(new AppError(404, "User not found"));
    }

    return sendResponse(res, 200, "success", "user", user);
});

// PATCH /api/users/:id — edit own profile (auth required)
export const updateUserProfile = catchAsync(async (req, res, next) => {
    // Only allow users to edit their own profile
    if (req.user._id.toString() !== req.params.id) {
        return next(new AppError(403, "You can only update your own profile"));
    }

    // Fields that users are allowed to update
    const allowedFields = [
        "name",
        "avatar",
        "graduationYear",
        "branch",
        "company",
        "designation",
        "bio",
        "linkedin",
        "github",
    ];

    const updates = {};
    for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
            updates[field] = req.body[field];
        }
    }

    const user = await User.findByIdAndUpdate(
        req.params.id,
        { $set: updates },
        { new: true, runValidators: true }
    ).select("-googleId -__v");

    if (!user) {
        return next(new AppError(404, "User not found"));
    }

    return sendResponse(res, 200, "success", "user", user);
});
