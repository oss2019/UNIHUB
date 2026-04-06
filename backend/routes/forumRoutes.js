import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { requireAdmin } from "../middlewares/forumMiddleware.js";
import {
  submitForumRequest,
  getForumRequests,
  getMyForumRequests,
  reviewForumRequest,
} from "../controllers/forumRequestController.js";
import {
  getAllForums,
  getForumById,
  updateForum,
  deleteForum,
} from "../controllers/forumController.js";

const router = express.Router();

// ─── Forum Requests ───────────────────────────────────────────────────────────

// POST /api/forum-requests — any verified user
router.post("/forum-requests", protect, submitForumRequest);

// GET /api/forum-requests/my — current user's own requests
router.get("/forum-requests/my", protect, getMyForumRequests);

// GET /api/forum-requests — admin: all requests (?status=pending|approved|rejected)
router.get("/forum-requests", protect, requireAdmin, getForumRequests);

// PATCH /api/forum-requests/:id/review — admin: approve or reject
router.patch(
  "/forum-requests/:id/review",
  protect,
  requireAdmin,
  reviewForumRequest,
);

// ─── Forums ───────────────────────────────────────────────────────────────────

// GET /api/forums — public
router.get("/forums", getAllForums);

// GET /api/forums/:id — public
router.get("/forums/:id", getForumById);

// PATCH /api/forums/:id — admin only
router.patch("/forums/:id", protect, requireAdmin, updateForum);

// DELETE /api/forums/:id — admin only (soft delete)
router.delete("/forums/:id", protect, requireAdmin, deleteForum);

export default router;
