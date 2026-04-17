import Comment from "../models/commentModel.js";
import Thread from "../models/threadModel.js";
import { AppError } from "../utils/appError.js";
import { catchAsync } from "../utils/catchAsync.js";
import { sendResponse } from "../utils/appResponse.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import * as notificationService from '../services/notificationService.js';
// ─────────────────────────────────────────────
// Helper: build nested comment tree from flat list
// ─────────────────────────────────────────────
const buildCommentTree = (comments) => {
    const map = {};
    const roots = [];

    // Index all comments by their string id
    comments.forEach((c) => {
        map[c._id.toString()] = { ...c.toObject(), replies: [] };
    });

    // Attach children to their parent
    comments.forEach((c) => {
        if (c.parentComment) {
            const parentId = c.parentComment.toString();
            if (map[parentId]) {
                map[parentId].replies.push(map[c._id.toString()]);
            }
        } else {
            roots.push(map[c._id.toString()]);
        }
    });

    return roots;
};

// ─────────────────────────────────────────────
// @route   POST /api/threads/:threadId/comments
// @desc    Add a new comment (or reply) to a thread
// @access  Protected
// ─────────────────────────────────────────────
export const createComment = catchAsync(async (req, res, next) => {
    const { threadId } = req.params;
    const { content, parentCommentId } = req.body;

    // 1. Validate content
    if (!content || content.trim() === "") {
        return next(new AppError(400, "Comment content cannot be empty"));
    }

    // 2. Check thread exists
    const thread = await Thread.findById(threadId);
    if (!thread) {
        return next(new AppError(404, "Thread not found"));
    }

    // 3. If replying, check parent comment exists and belongs to this thread
    if (parentCommentId) {
        const parent = await Comment.findById(parentCommentId);
        if (!parent || parent.isDeleted) {
            return next(new AppError(404, "Parent comment not found"));
        }
        if (parent.thread.toString() !== threadId) {
            return next(new AppError(400, "Parent comment does not belong to this thread"));
        }
    }

    // 4. Handle optional attachment upload to Cloudinary
    let attachmentUrl = null;
    let attachmentPublicId = null;

    if (req.file) {
        const uploaded = await uploadToCloudinary(req.file.buffer, "comments");
        attachmentUrl = uploaded.url;
        attachmentPublicId = uploaded.publicId;
    }

    // 5. Create the comment
    const comment = await Comment.create({
        content: content.trim(),
        author: req.user._id,
        thread: threadId,
        parentComment: parentCommentId || null,
        attachments: attachmentUrl,
        attachmentPublicId,
    });

    // 6. Increment commentCount on the thread
    await Thread.findByIdAndUpdate(threadId, { $inc: { commentCount: 1 } });
if (thread.author.toString() !== req.user._id.toString()) {
    await notificationService.notifyThreadOwner({
        threadId: thread._id,
        threadOwnerId: thread.author,
        commenterId: req.user._id,
        commentId: comment._id,
        subForumId: thread.subForum,
        isReply: !!parentCommentId,
    });
}
    // 7. Populate author for response
    await comment.populate("author", "name email role avatar");

    sendResponse(res, 201, "success", "comment", comment, undefined, "Comment created successfully");
});

// ─────────────────────────────────────────────
// @route   GET /api/threads/:threadId/comments
// @desc    Get all comments for a thread (nested tree)
// @access  Protected
// ─────────────────────────────────────────────
export const getCommentsByThread = catchAsync(async (req, res, next) => {
    const { threadId } = req.params;

    // Check thread exists
    const thread = await Thread.findById(threadId);
    if (!thread) {
        return next(new AppError(404, "Thread not found"));
    }

    // Fetch all non-deleted comments for this thread, sorted oldest first
    const comments = await Comment.find({ thread: threadId, isDeleted: false })
        .populate("author", "name email role avatar")
        .sort({ createdAt: 1 });

    // Build nested tree (top-level + replies)
    const commentTree = buildCommentTree(comments);

    sendResponse(res, 200, "success", "comments", commentTree, comments.length);
});

// ─────────────────────────────────────────────
// @route   GET /api/comments/:commentId
// @desc    Get a single comment by ID
// @access  Protected
// ─────────────────────────────────────────────
export const getCommentById = catchAsync(async (req, res, next) => {
    const comment = await Comment.findById(req.params.commentId)
        .populate("author", "name email role avatar")
        .populate("parentComment");

    if (!comment || comment.isDeleted) {
        return next(new AppError(404, "Comment not found"));
    }

    sendResponse(res, 200, "success", "comment", comment);
});

// ─────────────────────────────────────────────
// @route   PUT /api/comments/:commentId
// @desc    Edit a comment (only by the author)
// @access  Protected
// ─────────────────────────────────────────────
export const updateComment = catchAsync(async (req, res, next) => {
    const { content } = req.body;
    const { commentId } = req.params;

    if (!content || content.trim() === "") {
        return next(new AppError(400, "Comment content cannot be empty"));
    }

    const comment = await Comment.findById(commentId);

    if (!comment || comment.isDeleted) {
        return next(new AppError(404, "Comment not found"));
    }

    // Only the author can edit
    if (comment.author.toString() !== req.user._id.toString()) {
        return next(new AppError(403, "You are not authorized to edit this comment"));
    }

    // Handle attachment update: if new file uploaded, delete old one
    let attachmentUrl = comment.attachments;
    let attachmentPublicId = comment.attachmentPublicId;

    if (req.file) {
        // Delete old attachment from Cloudinary if exists
        if (attachmentPublicId) {
            await deleteFromCloudinary(attachmentPublicId);
        }
        const uploaded = await uploadToCloudinary(req.file.buffer, "comments");
        attachmentUrl = uploaded.url;
        attachmentPublicId = uploaded.publicId;
    }

    comment.content = content.trim();
    comment.attachments = attachmentUrl;
    comment.attachmentPublicId = attachmentPublicId;
    await comment.save();

    await comment.populate("author", "name email role avatar");

    sendResponse(res, 200, "success", "comment", comment, undefined, "Comment updated successfully");
});

// ─────────────────────────────────────────────
// @route   DELETE /api/comments/:commentId
// @desc    Soft delete a comment (author or admin)
// @access  Protected
// ─────────────────────────────────────────────
export const deleteComment = catchAsync(async (req, res, next) => {
    const { commentId } = req.params;

    const comment = await Comment.findById(commentId);

    if (!comment || comment.isDeleted) {
        return next(new AppError(404, "Comment not found"));
    }

    // Only author or admin can delete
    const isAuthor = comment.author.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isAuthor && !isAdmin) {
        return next(new AppError(403, "You are not authorized to delete this comment"));
    }

    // Soft delete: keep the doc but mark as deleted & wipe content
    comment.isDeleted = true;
    comment.content = "[This comment has been deleted]";

    // Delete attachment from Cloudinary if it exists
    if (comment.attachmentPublicId) {
        await deleteFromCloudinary(comment.attachmentPublicId);
        comment.attachments = null;
        comment.attachmentPublicId = null;
    }

    await comment.save();

    // Decrement commentCount on thread
    await Thread.findByIdAndUpdate(comment.thread, { $inc: { commentCount: -1 } });

    sendResponse(res, 200, "success", null, null, undefined, "Comment deleted successfully");
});

// ─────────────────────────────────────────────
// @route   DELETE /api/comments/:commentId/attachment
// @desc    Remove just the attachment from a comment
// @access  Protected (author only)
// ─────────────────────────────────────────────
export const removeAttachment = catchAsync(async (req, res, next) => {
    const { commentId } = req.params;

    const comment = await Comment.findById(commentId);

    if (!comment || comment.isDeleted) {
        return next(new AppError(404, "Comment not found"));
    }

    if (comment.author.toString() !== req.user._id.toString()) {
        return next(new AppError(403, "You are not authorized to modify this comment"));
    }

    if (!comment.attachments) {
        return next(new AppError(400, "This comment has no attachment to remove"));
    }

    await deleteFromCloudinary(comment.attachmentPublicId);

    comment.attachments = null;
    comment.attachmentPublicId = null;
    await comment.save();

    sendResponse(res, 200, "success", null, null, undefined, "Attachment removed successfully");
});

// ─────────────────────────────────────────────
// @route   POST /api/comments/:commentId/report
// @desc    Report a comment
// @access  Protected
// ─────────────────────────────────────────────
export const reportComment = catchAsync(async (req, res, next) => {
    const { commentId } = req.params;

    const comment = await Comment.findById(commentId);

    if (!comment || comment.isDeleted) {
        return next(new AppError(404, "Comment not found"));
    }

    // Prevent self-reporting
    if (comment.author.toString() === req.user._id.toString()) {
        return next(new AppError(400, "You cannot report your own comment"));
    }

    await Comment.findByIdAndUpdate(commentId, { $inc: { reportCount: 1 } });

    sendResponse(res, 200, "success", null, null, undefined, "Comment reported successfully");
});