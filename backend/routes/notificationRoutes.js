import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '../controllers/notificationController.js';

const router = express.Router();

// All notification routes require authentication
router.use(protect);

// GET /api/notifications — paginated list (?page=&limit=&unreadOnly=)
router.get('/', getNotifications);

// GET /api/notifications/unread-count
router.get('/unread-count', getUnreadCount);

// PATCH /api/notifications/read-all — mark all as read (must be before /:id)
router.patch('/read-all', markAllAsRead);

// PATCH /api/notifications/:id/read — mark single as read
router.patch('/:id/read', markAsRead);

// DELETE /api/notifications/:id — delete a notification
router.delete('/:id', deleteNotification);

export default router;
