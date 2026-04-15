import mongoose from "mongoose";
import  Forum  from "../models/forumModel.js";
import  SubForum  from "../models/subforumModel.js";
import  User  from "../models/userModel.js";
import { catchAsync } from "../utils/catchAsync.js";
import { AppError } from "../utils/appError.js";
import { cleanTags, escapeRegex } from "../utils/tagUtils.js";
import { sendResponse } from "../utils/appResponse.js";

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/forums/:forumId/subforums  (public)
// All active sub-forums under a forum. Supports ?search= name filter.
// ─────────────────────────────────────────────────────────────────────────────
export const getSubForums = catchAsync(async (req, res, next) => {
  const { forumId } = req.params;
  const { search } = req.query;

  const forum = await Forum.findOne({ _id: forumId, isActive: true });
  if (!forum) return next(new AppError(404, "Forum not found."));

  const filter = { forum: forumId, isActive: true };
  if (search) filter.name = { $regex: search, $options: "i" };

  const subForums = await SubForum.find(filter)
    .populate("createdBy", "name")
    .sort({ createdAt: -1 });

  sendResponse(res, 200, "ok", "subForums", subForums, subForums.length);
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/subforums/:id  (public)
// Single sub-forum detail. Includes thread count from the Thread model
// (owned by another team member — falls back to 0 if not yet registered).
// ─────────────────────────────────────────────────────────────────────────────
export const getSubForumById = catchAsync(async (req, res, next) => {
  const subForum = await SubForum.findOne({
    _id: req.params.id,
    isActive: true,
  })
    .populate("forum", "name description")
    .populate("createdBy", "name");

  if (!subForum) return next(new AppError(404, "SubForum not found."));

  // Thread model is owned by another team member — safe fallback to 0
  let threadCount = 0;
  try {
    const Thread = mongoose.model("Thread");
    threadCount = await Thread.countDocuments({ subForum: subForum._id });
  } catch {
    // Thread model not yet registered — return 0
  }

  sendResponse(res, 200, "ok", "subForum", {
    ...subForum.toObject(),
    threadCount,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/subforums/:id  (admin only)
// Edit name, description, tags, or toggle isActive.
// ─────────────────────────────────────────────────────────────────────────────
export const updateSubForum = catchAsync(async (req, res, next) => {
  const { name, description, tags, isActive } = req.body;

  const subForum = await SubForum.findById(req.params.id);
  if (!subForum) return next(new AppError(404, "SubForum not found."));

  if (name && name.trim() !== subForum.name) {
    const duplicate = await SubForum.findOne({
      forum: subForum.forum,
      name: { $regex: `^${escapeRegex(name.trim())}$`, $options: "i" },
      _id: { $ne: subForum._id },
    });
    if (duplicate) {
      return next(
        new AppError(
          409,
          `A sub-forum named "${name.trim()}" already exists in this forum.`,
        ),
      );
    }
    subForum.name = name.trim();
  }

  if (description !== undefined)
    subForum.description = description?.trim() || null;
  if (isActive !== undefined) subForum.isActive = Boolean(isActive);
  if (Array.isArray(tags)) subForum.tags = cleanTags(tags);

  await subForum.save();
  sendResponse(res, 200, "ok", "subForum", subForum);
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/subforums/:id  (admin only)
// Soft delete.
// ─────────────────────────────────────────────────────────────────────────────
export const deleteSubForum = catchAsync(async (req, res, next) => {
  const subForum = await SubForum.findById(req.params.id);
  if (!subForum) return next(new AppError(404, "SubForum not found."));

  subForum.isActive = false;
  await subForum.save();

  sendResponse(
    res,
    200,
    "ok",
    null,
    null,
    undefined,
    `Sub-forum "${subForum.name}" has been deactivated.`,
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/subforums/:id/join  (any verified user)
// ─────────────────────────────────────────────────────────────────────────────
export const joinSubForum = catchAsync(async (req, res, next) => {
  const subForum = await SubForum.findOne({ _id: req.params.id, isActive: true });
  if (!subForum) return next(new AppError(404, "SubForum not found."));

  const user = req.user;

  // Avoid duplicates
  if (user.joinedSubForums.map(id => id.toString()).includes(subForum._id.toString())) {
    return next(new AppError(409, "You are already a member of this sub-forum."));
  }

  user.joinedSubForums.push(subForum._id);
  await user.save({ validateBeforeSave: false });

  sendResponse(res, 200, "ok", null, null, undefined, "Joined successfully.");
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/subforums/:id/leave  (any verified user)
// ─────────────────────────────────────────────────────────────────────────────
export const leaveSubForum = catchAsync(async (req, res, next) => {
  const subForum = await SubForum.findOne({ _id: req.params.id, isActive: true });
  if (!subForum) return next(new AppError(404, "SubForum not found."));

  await User.findByIdAndUpdate(req.user._id, {
    $pull: { joinedSubForums: subForum._id },
  });

  sendResponse(res, 200, "ok", null, null, undefined, "Left sub-forum.");
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/subforums/:id/mute  (any verified user)
// Mutes a sub-forum — user will NOT receive any notifications from it
// ─────────────────────────────────────────────────────────────────────────────
export const muteSubForum = catchAsync(async (req, res, next) => {
  const subForum = await SubForum.findOne({ _id: req.params.id, isActive: true });
  if (!subForum) return next(new AppError(404, "SubForum not found."));

  await User.findByIdAndUpdate(req.user._id, {
    $addToSet: { mutedSubForums: subForum._id },
  });

  sendResponse(res, 200, "ok", null, null, undefined, "Sub-forum muted.");
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/subforums/:id/unmute  (any verified user)
// ─────────────────────────────────────────────────────────────────────────────
export const unmuteSubForum = catchAsync(async (req, res, next) => {
  const subForum = await SubForum.findOne({ _id: req.params.id, isActive: true });
  if (!subForum) return next(new AppError(404, "SubForum not found."));

  await User.findByIdAndUpdate(req.user._id, {
    $pull: { mutedSubForums: subForum._id },
  });

  sendResponse(res, 200, "ok", null, null, undefined, "Sub-forum unmuted.");
});
