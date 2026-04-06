import { Forum } from "../models/forumModel.js";
import { SubForum, SubForumRequest } from "../models/subforumModel.js";
import { catchAsync } from "../../../utils/catchAsync.js";
import { AppError } from "../../../utils/appError.js";
import { cleanTags } from "../utils/tagUtils.js";
import { sendResponse } from "../../../utils/sendResponse.js";

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/forums/:forumId/subforum-requests
// Any verified user can request a sub-forum inside an existing forum.
// ─────────────────────────────────────────────────────────────────────────────
export const submitSubForumRequest = catchAsync(async (req, res, next) => {
  const { forumId } = req.params;
  const { name, description, tags } = req.body;

  if (!name?.trim())
    return next(new AppError(400, "SubForum name is required."));

  // Parent forum must exist and be active
  const forum = await Forum.findOne({ _id: forumId, isActive: true });
  if (!forum) return next(new AppError(404, "Forum not found or inactive."));

  // No existing sub-forum with this name in this forum
  const existingSub = await SubForum.findOne({
    forum: forumId,
    name: { $regex: `^${name.trim()}$`, $options: "i" },
  });
  if (existingSub) {
    return next(
      new AppError(
        409,
        `A sub-forum named "${name.trim()}" already exists in this forum.`,
      ),
    );
  }

  // No duplicate pending request from this user for this name in this forum
  const duplicateRequest = await SubForumRequest.findOne({
    requestedBy: req.user._id,
    forum: forumId,
    name: { $regex: `^${name.trim()}$`, $options: "i" },
    status: "pending",
  });
  if (duplicateRequest) {
    return next(
      new AppError(
        409,
        "You already have a pending request for this sub-forum.",
      ),
    );
  }

  const request = await SubForumRequest.create({
    requestedBy: req.user._id,
    forum: forumId,
    name: name.trim(),
    description: description?.trim() || null,
    tags: cleanTags(tags),
  });

  await request.populate("forum", "name");
  sendResponse(res, 201, "ok", "request", request);
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/subforum-requests  (admin only)
// All sub-forum requests; optional ?status= filter.
// ─────────────────────────────────────────────────────────────────────────────
export const getSubForumRequests = catchAsync(async (req, res, next) => {
  const filter = {};
  const { status } = req.query;
  if (status && ["pending", "approved", "rejected"].includes(status)) {
    filter.status = status;
  }

  const requests = await SubForumRequest.find(filter)
    .populate("requestedBy", "name email role")
    .populate("forum", "name")
    .populate("reviewedBy", "name email")
    .sort({ createdAt: -1 });

  sendResponse(res, 200, "ok", "requests", requests, requests.length);
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/subforum-requests/my  (logged-in user)
// ─────────────────────────────────────────────────────────────────────────────
export const getMySubForumRequests = catchAsync(async (req, res, next) => {
  const requests = await SubForumRequest.find({ requestedBy: req.user._id })
    .populate("forum", "name")
    .populate("reviewedBy", "name")
    .sort({ createdAt: -1 });

  sendResponse(res, 200, "ok", "requests", requests, requests.length);
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/subforum-requests/:id/review  (admin only)
// Approve or reject. On approval the SubForum document is created.
// ─────────────────────────────────────────────────────────────────────────────
export const reviewSubForumRequest = catchAsync(async (req, res, next) => {
  const { status, reviewNote } = req.body;

  if (!["approved", "rejected"].includes(status)) {
    return next(new AppError(400, 'status must be "approved" or "rejected".'));
  }

  const request = await SubForumRequest.findById(req.params.id).populate(
    "forum",
  );
  if (!request) return next(new AppError(404, "SubForum request not found."));

  if (request.status !== "pending") {
    return next(
      new AppError(409, `This request has already been ${request.status}.`),
    );
  }

  // Parent forum must still be active
  if (!request.forum?.isActive) {
    return next(new AppError(409, "The parent forum is no longer active."));
  }

  request.status = status;
  request.reviewedBy = req.user._id;
  request.reviewNote = reviewNote?.trim() || null;

  if (status === "approved") {
    const duplicate = await SubForum.findOne({
      forum: request.forum._id,
      name: { $regex: `^${request.name}$`, $options: "i" },
    });
    if (duplicate) {
      return next(
        new AppError(
          409,
          `A sub-forum named "${request.name}" already exists.`,
        ),
      );
    }

    const subForum = await SubForum.create({
      name: request.name,
      description: request.description,
      forum: request.forum._id,
      tags: request.tags,
      createdBy: req.user._id,
    });

    request.subForumCreated = subForum._id;
    await request.save();

    return sendResponse(res, 200, "ok", "reviewResult", { request, subForum });
  }

  await request.save();
  sendResponse(res, 200, "ok", "request", request);
});
