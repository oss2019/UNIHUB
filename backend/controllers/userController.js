const User = require("../models/userModel");

// GET /api/users/:id — public profile
const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select(
            "-googleId -__v"
        );

        if (!user) {
            return res
                .status(404)
                .json({ status: "error", message: "User not found" });
        }

        res.json({ status: "ok", user });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
};

// PATCH /api/users/:id — edit own profile (auth required)
const updateUserProfile = async (req, res) => {
    try {
        // Only allow users to edit their own profile
        if (req.user._id.toString() !== req.params.id) {
            return res.status(403).json({
                status: "error",
                message: "You can only update your own profile",
            });
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
            return res
                .status(404)
                .json({ status: "error", message: "User not found" });
        }

        res.json({ status: "ok", user });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
};

module.exports = { getUserProfile, updateUserProfile };
