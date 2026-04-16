import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
    getUserProfile,
    updateUserProfile,
} from "../controllers/userController.js";
import { getUserThreads } from "../controllers/threadController.js";

const router = express.Router();

// GET /api/users/:id — public profile
router.get("/:id", getUserProfile);

// PATCH /api/users/:id — edit own profile (auth required)
router.patch("/:id", protect, updateUserProfile);

// GET /api/users/:id/threads — get threads by user ID
router.get("/:id/threads", getUserThreads);

export default router;
