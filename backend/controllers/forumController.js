import  Forum from "../models/forumModel.js";
import  SubForum  from "../models/subforumModel.js";
import { catchAsync } from "../utils/catchAsync.js";
import { AppError } from "../utils/appError.js";
import { sendResponse } from "../utils/appResponse.js";
import { escapeRegex } from "../utils/tagUtils.js";

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/forums  (public)
// All active forums with a live sub-forum count attached to each.
// ─────────────────────────────────────────────────────────────────────────────
export const getAllForums = catchAsync(async (req, res, next) => {
  const forums = await Forum.find({ isActive: true })
    .populate("createdBy", "name")
    .sort({ createdAt: -1 });

  //Attach live sub-forum count without an extra aggregation pipeline
  const data = await Promise.all(
    forums.map(async (f) => {
      const subForumCount = await SubForum.countDocuments({
        forum: f._id,
        isActive: true,
      });
      return { ...f.toObject(), subForumCount };
    }),
  );
  //const data = forums;

  sendResponse(res, 200, "ok", "forums", data, data.length);
});
// export const getAllForums = (req, res) => {
//   res.status(200).json({
//     message: "WORKING ",
//   });
// };
// ─────────────────────────────────────────────────────────────────────────────
// GET /api/forums/:id  (public)
// Single forum with all its active sub-forums.
// ─────────────────────────────────────────────────────────────────────────────
export const getForumById = catchAsync(async (req, res, next) => {
  const forum = await Forum.findOne({
    _id: req.params.id,
    isActive: true,
  }).populate("createdBy", "name");

  if (!forum) return next(new AppError(404, "Forum not found."));

  const subForums = await SubForum.find({ forum: forum._id, isActive: true })
    .populate("createdBy", "name")
    .sort({ createdAt: -1 });

  sendResponse(res, 200, "ok", "forumDetails", { forum, subForums });
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/forums/:id  (admin only)
// Update forum name, description, or toggle isActive.
// ─────────────────────────────────────────────────────────────────────────────
export const updateForum = catchAsync(async (req, res, next) => {
  const { name, description, isActive, type } = req.body;

  // Forum.type is immutable after creation — changing it would break
  // the semantics of all sub-forums, threads, and work requests inside.
  if (type !== undefined) {
    return next(new AppError(400, "Forum type cannot be changed after creation."));
  }

  const forum = await Forum.findById(req.params.id);
  if (!forum) return next(new AppError(404, "Forum not found."));

  if (name && name.trim() !== forum.name) {
    const duplicate = await Forum.findOne({
      name: { $regex: `^${escapeRegex(name.trim())}$`, $options: "i" },
      _id: { $ne: forum._id },
    });
    if (duplicate)
      return next(
        new AppError(409, `A forum named "${name.trim()}" already exists.`),
      );
    forum.name = name.trim();
  }

  if (description !== undefined)
    forum.description = description?.trim() || null;
  if (isActive !== undefined) forum.isActive = Boolean(isActive);

  await forum.save();
  sendResponse(res, 200, "ok", "forum", forum);
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/forums/:id  (admin only)
// Soft delete — sets isActive: false. Sub-forums and threads are preserved.
// ─────────────────────────────────────────────────────────────────────────────
export const deleteForum = catchAsync(async (req, res, next) => {
  const forum = await Forum.findById(req.params.id);
  if (!forum) return next(new AppError(404, "Forum not found."));

  forum.isActive = false;
  await forum.save();

  sendResponse(
    res,
    200,
    "ok",
    null,
    null,
    undefined,
    `Forum "${forum.name}" has been deactivated.`,
  );
});