/**
 * @file reportRoutes.js
 * @module routes/reportRoutes
 * @description Express router for the Report module — problems users hit inside the
 *              application, filed for admins to triage and forward to the dev team.
 *
 * Route map (every route requires authentication):
 *   POST   /api/reports        → User  — file a new report
 *   GET    /api/reports/my     → User  — list your own reports
 *   GET    /api/reports/stats  → Admin — counts grouped by status
 *   GET    /api/reports        → Admin — triage board, filterable + paginated
 *   GET    /api/reports/:id    → Owner or Admin — read a single report
 *   PATCH  /api/reports/:id    → Admin — update status / attach an admin note
 *   DELETE /api/reports/:id    → Admin — permanently remove a report
 *
 * @requires express
 * @requires middlewares/authMiddleware
 * @requires middlewares/forumMiddleware
 * @requires controllers/reportController
 * @requires validators/reportValidator
 */

import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import { requireAdmin } from '../middlewares/forumMiddleware.js';
import {
    createReport,
    getMyReports,
    getReport,
    getAllReports,
    getReportStats,
    triageReport,
    deleteReport
} from '../controllers/reportController.js';
import {
    validateReportCreation,
    validateReportTriage,
    validateReportId
} from '../validators/reportValidator.js';

const router = express.Router();

// Reporting a problem requires knowing who is reporting it — no public routes here
router.use(protect);

// ─────────────────────────────────────────────────────────────────────────────
// Authenticated User Routes
// ─────────────────────────────────────────────────────────────────────────────

/** POST /api/reports — File a new problem report */
router.post('/', validateReportCreation, createReport);

/**
 * GET /api/reports/my — List your own reports.
 * Declared before '/:id' so the literal path is not swallowed by the param route.
 */
router.get('/my', getMyReports);

// ─────────────────────────────────────────────────────────────────────────────
// Admin Routes
// ─────────────────────────────────────────────────────────────────────────────

/** GET /api/reports/stats — Report counts grouped by status (declared before '/:id') */
router.get('/stats', requireAdmin, getReportStats);

/** GET /api/reports — Full triage board with filters and pagination */
router.get('/', requireAdmin, getAllReports);

/** PATCH /api/reports/:id — Move a report through triage / attach an admin note */
router.patch('/:id', requireAdmin, validateReportId, validateReportTriage, triageReport);

/** DELETE /api/reports/:id — Permanently remove a report */
router.delete('/:id', requireAdmin, validateReportId, deleteReport);

// ─────────────────────────────────────────────────────────────────────────────
// Mixed-Access Route — ownership checked inside the controller
// ─────────────────────────────────────────────────────────────────────────────

/** GET /api/reports/:id — Readable by the reporter who filed it, or any admin */
router.get('/:id', validateReportId, getReport);

export default router;
