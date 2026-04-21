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

// PATCH /api/users/:id/role — promote/demote a user's role (admin only)
export const updateUserRole = catchAsync(async (req, res, next) => {
    const { role } = req.body;
    const VALID_ROLES = ["student", "alumni", "admin"];

    if (!role || !VALID_ROLES.includes(role)) {
        return next(
            new AppError(400, `Invalid role. Must be one of: ${VALID_ROLES.join(", ")}`)
        );
    }

    // Prevent an admin from accidentally demoting themselves
    if (req.user._id.toString() === req.params.id && role !== "admin") {
        return next(new AppError(403, "You cannot change your own admin role."));
    }

    const user = await User.findByIdAndUpdate(
        req.params.id,
        { $set: { role } },
        { new: true, runValidators: true }
    ).select("-googleId -__v");

    if (!user) {
        return next(new AppError(404, "User not found"));
    }

    console.log(`[Auth] Role updated: ${user.email} → ${role} by admin ${req.user.email}`);
    return sendResponse(res, 200, "success", "user", user);
});
