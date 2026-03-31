const express = require("express");
const { protect } = require("../middlewares/authMiddleware");
const {
    getUserProfile,
    updateUserProfile,
} = require("../controllers/userController");

const router = express.Router();

// GET /api/users/:id — public profile
router.get("/:id", getUserProfile);

// PATCH /api/users/:id — edit own profile (auth required)
router.patch("/:id", protect, updateUserProfile);

module.exports = router;
