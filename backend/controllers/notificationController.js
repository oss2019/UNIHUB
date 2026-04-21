import Notification from '../models/notificationModel.js';
import { catchAsync } from '../utils/catchAsync.js';
import { AppError } from '../utils/appError.js';
import { sendResponse } from '../utils/appResponse.js';
import * as notificationService from '../services/notificationService.js';

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/notifications
// Paginated notifications for the logged-in user.
// Query params: ?page=1&limit=20&unreadOnly=true
// ─────────────────────────────────────────────────────────────────────────────
export const getNotifications = catchAsync(async (req, res, next) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
  const unreadOnly = req.query.unreadOnly === 'true';

  const result = await notificationService.getUserNotifications(req.user._id, {
    page,
    limit,
    unreadOnly,
  });

  sendResponse(res, 200, 'success', 'notifications', result.notifications, result.total, undefined);
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/notifications/unread-count
// Count of unread notifications for the logged-in user.
// ─────────────────────────────────────────────────────────────────────────────
export const getUnreadCount = catchAsync(async (req, res, next) => {
  const count = await notificationService.getUnreadCount(req.user._id);

  sendResponse(res, 200, 'success', 'unreadCount', count);
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/notifications/:id/read
// Mark a single notification as read.
// ─────────────────────────────────────────────────────────────────────────────
export const markAsRead = catchAsync(async (req, res, next) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user._id },
    { isRead: true },
    { new: true }
  );

  if (!notification) {
    return next(new AppError(404, 'Notification not found.'));
  }

  sendResponse(res, 200, 'success', 'notification', notification);
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/notifications/read-all
// Mark ALL notifications as read for the logged-in user.
// ─────────────────────────────────────────────────────────────────────────────
export const markAllAsRead = catchAsync(async (req, res, next) => {
  const result = await Notification.updateMany(
    { recipient: req.user._id, isRead: false },
    { isRead: true }
  );

  sendResponse(
    res,
    200,
    'success',
    null,
    null,
    undefined,
    `${result.modifiedCount} notification(s) marked as read.`
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/notifications/:id
// Delete a notification. Users can only delete their own notifications.
// ─────────────────────────────────────────────────────────────────────────────
export const deleteNotification = catchAsync(async (req, res, next) => {
  const notification = await Notification.findOneAndDelete({
    _id: req.params.id,
    recipient: req.user._id,
  });

  if (!notification) {
    return next(new AppError(404, 'Notification not found.'));
  }

  sendResponse(
    res,
    200,
    'success',
    null,
    null,
    undefined,
    'Notification deleted.'
  );
});
