import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { requireAdmin } from "../middlewares/forumMiddleware.js";
import {
  submitSubForumRequest,
  getSubForumRequests,
  getMySubForumRequests,
  reviewSubForumRequest,
} from "../controllers/subForumRequestController.js";
import {
  getSubForums,
  getSubForumById,
  updateSubForum,
  deleteSubForum,
  joinSubForum,
  leaveSubForum,
  muteSubForum,
  unmuteSubForum,
} from "../controllers/subForumController.js";

const router = express.Router();

// ─── SubForum Requests ────────────────────────────────────────────────────────

// POST /api/forums/:forumId/subforum-requests — any verified user
router.post(
  "/forums/:forumId/subforum-requests",
  protect,
  submitSubForumRequest,
);

// GET /api/subforum-requests/my — current user's own requests
router.get("/subforum-requests/my", protect, getMySubForumRequests);

// GET /api/subforum-requests — admin: all requests (?status=)
router.get("/subforum-requests", protect, requireAdmin, getSubForumRequests);

// PATCH /api/subforum-requests/:id/review — admin: approve or reject
router.patch(
  "/subforum-requests/:id/review",
  protect,
  requireAdmin,
  reviewSubForumRequest,
);

// ─── SubForums ────────────────────────────────────────────────────────────────

// GET /api/forums/:forumId/subforums — public (?search=)
router.get("/forums/:forumId/subforums", getSubForums);

// GET /api/subforums/:id — public
router.get("/subforums/:id", getSubForumById);

// PATCH /api/subforums/:id — admin only
router.patch("/subforums/:id", protect, requireAdmin, updateSubForum);

// DELETE /api/subforums/:id — admin only (soft delete)
router.delete("/subforums/:id", protect, requireAdmin, deleteSubForum);

// ─── SubForum Membership ─────────────────────────────────────────────────────

// POST /api/subforums/:id/join — any verified user
router.post("/subforums/:id/join", protect, joinSubForum);

// POST /api/subforums/:id/leave — any verified user
router.post("/subforums/:id/leave", protect, leaveSubForum);

// POST /api/subforums/:id/mute — any verified user
router.post("/subforums/:id/mute", protect, muteSubForum);

// POST /api/subforums/:id/unmute — any verified user
router.post("/subforums/:id/unmute", protect, unmuteSubForum);

export default router;
