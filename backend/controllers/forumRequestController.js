import Forum,{ ForumRequest } from "../models/forumModel.js";
import { catchAsync } from "../utils/catchAsync.js";
import { AppError } from "../utils/appError.js";
import { sendResponse } from "../utils/appResponse.js";
import { escapeRegex } from "../utils/tagUtils.js";

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/forum-requests
// Any verified (college email) user can submit a request to create a forum.
// ─────────────────────────────────────────────────────────────────────────────
export const submitForumRequest = catchAsync(async (req, res, next) => {
  const { name, description, type } = req.body;

  if (!name?.trim()) return next(new AppError(400, "Forum name is required."));

  // Reject if a forum with this name already exists
  const existingForum = await Forum.findOne({
    name: { $regex: `^${escapeRegex(name.trim())}$`, $options: "i" },
  });
  if (existingForum) {
    return next(
      new AppError(409, `A forum named "${name.trim()}" already exists.`),
    );
  }

  // Reject if this user already has a pending request with the same name
  const duplicateRequest = await ForumRequest.findOne({
    requestedBy: req.user._id,
    name: { $regex: `^${escapeRegex(name.trim())}$`, $options: "i" },
    status: "pending",
  });
  if (duplicateRequest) {
    return next(
      new AppError(
        409,
        "You already have a pending request for a forum with this name.",
      ),
    );
  }

  const request = await ForumRequest.create({
    requestedBy: req.user._id,
    name: name.trim(),
    description: description?.trim() || null,
    type: type || 'normal',
  });

  sendResponse(res, 201, "ok", "request", request);
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/forum-requests  (admin only)
// Returns all requests; optional ?status=pending|approved|rejected filter.
// ─────────────────────────────────────────────────────────────────────────────
export const getForumRequests = catchAsync(async (req, res, next) => {
  const filter = {};
  const { status } = req.query;
  if (status && ["pending", "approved", "rejected"].includes(status)) {
    filter.status = status;
  }

  const requests = await ForumRequest.find(filter)
    .populate("requestedBy", "name email role")
    .populate("reviewedBy", "name email")
    .sort({ createdAt: -1 });

  sendResponse(res, 200, "ok", "requests", requests, requests.length);
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/forum-requests/my  (logged-in user)
// Returns only the current user's own forum requests.
// ─────────────────────────────────────────────────────────────────────────────
export const getMyForumRequests = catchAsync(async (req, res, next) => {
  const requests = await ForumRequest.find({ requestedBy: req.user._id })
    .populate("reviewedBy", "name")
    .sort({ createdAt: -1 });

  sendResponse(res, 200, "ok", "requests", requests, requests.length);
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/forum-requests/:id/review  (admin only)
// Approve or reject a pending forum request.
// On approval the Forum document is automatically created.
// ─────────────────────────────────────────────────────────────────────────────
export const reviewForumRequest = catchAsync(async (req, res, next) => {
  const { status, reviewNote } = req.body;

  if (!["approved", "rejected"].includes(status)) {
    return next(new AppError(400, 'status must be "approved" or "rejected".'));
  }

  const request = await ForumRequest.findById(req.params.id);
  if (!request) return next(new AppError(404, "Forum request not found."));

  if (request.status !== "pending") {
    return next(
      new AppError(409, `This request has already been ${request.status}.`),
    );
  }

  request.status = status;
  request.reviewedBy = req.user._id;
  request.reviewNote = reviewNote?.trim() || null;

  if (status === "approved") {
    // Guard against a race condition where two admins act at the same time
    const duplicate = await Forum.findOne({
      name: { $regex: `^${escapeRegex(request.name)}$`, $options: "i" },
    });
    if (duplicate) {
      return next(
        new AppError(409, `A forum named "${request.name}" already exists.`),
      );
    }

    const forum = await Forum.create({
      name: request.name,
      description: request.description,
      createdBy: request.requestedBy,
      type: request.type,
    });

    request.forumCreated = forum._id;
    await request.save();

    return sendResponse(res, 200, "ok", "reviewResult", { request, forum });
  }

  await request.save();
  sendResponse(res, 200, "ok", "request", request);
});
