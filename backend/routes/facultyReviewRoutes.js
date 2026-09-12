/**
 * @file facultyReviewRoutes.js
 * @module routes/facultyReviewRoutes
 * @description Express router for the Faculty Review module.
 *              Defines the public and admin-only endpoints and wires them to their
 *              respective controller handlers and validation middleware.
 *
 * Route map:
 *   GET    /api/faculty-reviews      → Public — list/filter reviews
 *   GET    /api/faculty-reviews/:id  → Public — read a single review
 *   POST   /api/faculty-reviews      → Admin  — publish a new review
 *   PATCH  /api/faculty-reviews/:id  → Admin  — edit an existing review
 *   DELETE /api/faculty-reviews/:id  → Admin  — remove a review
 *
 * @requires express
 * @requires middlewares/authMiddleware
 * @requires middlewares/forumMiddleware
 * @requires controllers/facultyReviewController
 * @requires validators/facultyReviewValidator
 */

import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import { requireAdmin } from '../middlewares/forumMiddleware.js';
import {
    getAllFacultyReviews,
    getFacultyReview,
    createFacultyReview,
    updateFacultyReview,
    deleteFacultyReview
} from '../controllers/facultyReviewController.js';
import {
    validateFacultyReviewCreation,
    validateFacultyReviewUpdate,
    validateFacultyReviewId
} from '../validators/facultyReviewValidator.js';

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// Public Routes (no authentication required)
// ─────────────────────────────────────────────────────────────────────────────

/** GET /api/faculty-reviews — Retrieve all reviews, optionally filtered */
router.get('/', getAllFacultyReviews);

/** GET /api/faculty-reviews/:id — Retrieve a single review */
router.get('/:id', validateFacultyReviewId, getFacultyReview);

// ─────────────────────────────────────────────────────────────────────────────
// Admin Routes (authenticated + admin role required)
// ─────────────────────────────────────────────────────────────────────────────

router.use(protect, requireAdmin);

/** POST /api/faculty-reviews — Publish a new faculty review */
router.post('/', validateFacultyReviewCreation, createFacultyReview);

/** PATCH /api/faculty-reviews/:id — Edit an existing faculty review */
router.patch('/:id', validateFacultyReviewId, validateFacultyReviewUpdate, updateFacultyReview);

/** DELETE /api/faculty-reviews/:id — Permanently remove a faculty review */
router.delete('/:id', validateFacultyReviewId, deleteFacultyReview);

export default router;
