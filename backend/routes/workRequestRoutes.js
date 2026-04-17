import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import {
  raiseWorkRequest,
  getWorkRequests,
  updateWorkRequest,
  getMyWorkRequests,
} from '../controllers/workRequestController.js';

const router = express.Router();

// All work request routes require authentication
router.use(protect);

// GET /api/work-requests/mine — all work requests raised by logged-in user - as a project owner
router.get('/work-requests/mine', getMyWorkRequests);

// POST /api/subforums/:id/work-requests — raise a work request (owner only, collab forum only)
router.post('/subforums/:id/work-requests', raiseWorkRequest);

// GET /api/subforums/:id/work-requests — list work requests for a project (?status=)
router.get('/subforums/:id/work-requests', getWorkRequests);

// PATCH /api/work-requests/:id — update/close a work request (owner only)
router.patch('/work-requests/:id', updateWorkRequest);

export default router;
