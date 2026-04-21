import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { requireAdmin } from "../middlewares/forumMiddleware.js";
import {
    getUserProfile,
    updateUserProfile,
    updateUserRole,
} from "../controllers/userController.js";
import { getUserThreads } from "../controllers/threadController.js";

const router = express.Router();

// GET /api/users/:id — public profile
router.get("/:id", getUserProfile);

// PATCH /api/users/:id — edit own profile (auth required)
router.patch("/:id", protect, updateUserProfile);

// GET /api/users/:id/threads — get threads by user ID
router.get("/:id/threads", getUserThreads);

// PATCH /api/users/:id/role — promote/demote role (admin only)
// e.g. { "role": "alumni" } or { "role": "admin" }
router.patch("/:id/role", protect, requireAdmin, updateUserRole);

export default router;

