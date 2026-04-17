import SubForum from '../models/subforumModel.js';
import Forum from '../models/forumModel.js';
import User from '../models/userModel.js';
import WorkRequest from '../models/workRequestModel.js';
import { catchAsync } from '../utils/catchAsync.js';
import { AppError } from '../utils/appError.js';
import { sendResponse } from '../utils/appResponse.js';
import * as notificationService from '../services/notificationService.js';

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/subforums/:id/work-requests
// Raise a work request — only the sub-forum OWNER in a COLLAB forum can do this.
//
// Body: { title, description?, targetSubForumIds: [ObjectId], requiredSkills?: [String] }
// ─────────────────────────────────────────────────────────────────────────────
export const raiseWorkRequest = catchAsync(async (req, res, next) => {
  const { title, description, targetSubForumIds, requiredSkills } = req.body;

  if (!title?.trim()) {
    return next(new AppError(400, 'Work request title is required.'));
  }

  if (!Array.isArray(targetSubForumIds) || !targetSubForumIds.length) {
    return next(new AppError(400, 'At least one target sub-forum must be selected.'));
  }

  // 1. Fetch the source sub-forum and its parent forum
  const subForum = await SubForum.findOne({
    _id: req.params.id,
    isActive: true,
  });
  if (!subForum) {
    return next(new AppError(404, 'SubForum not found.'));
  }

  const forum = await Forum.findById(subForum.forum);
  if (!forum) {
    return next(new AppError(404, 'Parent forum not found.'));
  }

  // 2. Must be a collab forum
  if (forum.type !== 'collab') {
    return next(
      new AppError(400, 'Work requests can only be raised in collab forums.')
    );
  }

  // 3. Only the sub-forum owner can raise work requests
  if (
    !subForum.createdBy ||
    subForum.createdBy.toString() !== req.user._id.toString()
  ) {
    return next(
      new AppError(403, 'Only the project owner can raise work requests.')
    );
  }

  // 4. Validate target sub-forums exist and are active
  const targetSubForums = await SubForum.find({
    _id: { $in: targetSubForumIds },
    isActive: true,
  }).lean();

  if (!targetSubForums.length) {
    return next(
      new AppError(400, 'None of the provided target sub-forums are valid.')
    );
  }

  // 5. Create the work request
  const workRequest = await WorkRequest.create({
    raisedBy: req.user._id,
    sourceSubForum: subForum._id,
    targetSubForums: targetSubForums.map((sf) => sf._id),
    title: title.trim(),
    description: description?.trim() || null,
    requiredSkills: requiredSkills || [],
  });

  // 6. Find student members of target sub-forums who haven't muted them
  //    Collab work requests are for current students only, not alumni
  const targetIds = targetSubForums.map((sf) => sf._id);
  const members = await User.find({
    role: 'student',
    joinedSubForums: { $in: targetIds },
    mutedSubForums: { $nin: targetIds },
    _id: { $ne: req.user._id }, // Don't notify the owner themselves
  })
    .select('_id')
    .lean();

  // 7. Create notifications for all targeted members
  await notificationService.notifyWorkOpportunity(workRequest, members);

  return sendResponse(res, 201, 'success', 'workRequest', workRequest);
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/subforums/:id/work-requests
// Get all work requests for a specific project (sub-forum).
// Supports ?status=open|closed filter.
// ─────────────────────────────────────────────────────────────────────────────
export const getWorkRequests = catchAsync(async (req, res, next) => {
  const subForum = await SubForum.findOne({
    _id: req.params.id,
    isActive: true,
  });
  if (!subForum) {
    return next(new AppError(404, 'SubForum not found.'));
  }

  const filter = { sourceSubForum: subForum._id };
  const { status } = req.query;
  if (status && ['open', 'closed'].includes(status)) {
    filter.status = status;
  }

  const workRequests = await WorkRequest.find(filter)
    .populate('raisedBy', 'name email avatar')
    .populate('targetSubForums', 'name')
    .populate('sourceSubForum', 'name')
    .sort({ createdAt: -1 });

  sendResponse(
    res,
    200,
    'success',
    'workRequests',
    workRequests,
    workRequests.length
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/work-requests/:id
// Update a work request (e.g., close it). Only the owner can do this.
// Body: { status?: 'closed', title?, description? }
// ─────────────────────────────────────────────────────────────────────────────
export const updateWorkRequest = catchAsync(async (req, res, next) => {
  const workRequest = await WorkRequest.findById(req.params.id);
  if (!workRequest) {
    return next(new AppError(404, 'Work request not found.'));
  }

  // Only the person who raised it can update it
  if (workRequest.raisedBy.toString() !== req.user._id.toString()) {
    return next(
      new AppError(403, 'Only the work request owner can update it.')
    );
  }

  const { status, title, description } = req.body;

  if (status && ['open', 'closed'].includes(status)) {
    workRequest.status = status;
  }
  if (title?.trim()) workRequest.title = title.trim();
  if (description !== undefined) {
    workRequest.description = description?.trim() || null;
  }

  await workRequest.save();

  sendResponse(res, 200, 'success', 'workRequest', workRequest);
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/work-requests/mine
// Get all work requests raised by the logged-in user.
// ─────────────────────────────────────────────────────────────────────────────
export const getMyWorkRequests = catchAsync(async (req, res, next) => {
  const workRequests = await WorkRequest.find({ raisedBy: req.user._id })
    .populate('sourceSubForum', 'name')
    .populate('targetSubForums', 'name')
    .sort({ createdAt: -1 });

  sendResponse(
    res,
    200,
    'success',
    'workRequests',
    workRequests,
    workRequests.length
  );
});
