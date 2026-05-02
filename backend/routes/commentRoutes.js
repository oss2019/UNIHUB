import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { uploadCommentAttachment } from "../middlewares/uploadMiddleware.js";
import {
    createComment,
    getCommentsByThread,
    getCommentById,
    updateComment,
    deleteComment,
    removeAttachment,
    reportComment,
} from "../controllers/commentController.js";

const router = express.Router();


// Routes nested under threads
// Base: /api/threads/:threadId/comments


// GET  /api/threads/:threadId/comments       → get all comments (nested tree)
// POST /api/threads/:threadId/comments       → create a comment (or reply)
router
    .route("/threads/:threadId/comments")
    .get(protect, getCommentsByThread)
    .post(protect, uploadCommentAttachment, createComment);

//
// Routes for individual comments
// Base: /api/comments/:commentId
// 

// GET    /api/comments/:commentId            → get single comment
// PUT    /api/comments/:commentId            → edit comment (author only)
// DELETE /api/comments/:commentId            → soft delete (author or admin)
router
    .route("/:commentId")
    .get(protect, getCommentById)
    .put(protect, uploadCommentAttachment, updateComment)
    .delete(protect, deleteComment);

// DELETE /api/comments/:commentId/attachment → remove attachment only
router.delete("/:commentId/attachment", protect, removeAttachment);

// POST   /api/comments/:commentId/report     → report a comment
router.post("/:commentId/report", protect, reportComment);

export default router;