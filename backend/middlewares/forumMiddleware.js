// middlewares/forumMiddleware.js
//
// These guards are drop-in companions that sit on top of the existing
// `protect` middleware already used in the UNIHUB codebase.
//
// Usage in a route:
//   import { protect }         from '../../middlewares/authMiddleware.js';
//   import { requireAdmin,
//            requireVerified }  from './middlewares/forumMiddleware.js';
//
//   router.post('/forum-requests', protect, requireVerified, submitForumRequest);
//
// ─────────────────────────────────────────────────────────────────────────────

import { AppError } from "../utils/appError.js";

// Must be used AFTER protect.
// Blocks any role that is not 'admin'.
export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return next(new AppError(403, "Admin access required."));
  }
  next();
};
