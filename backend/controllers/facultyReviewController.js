/**
 * @file facultyReviewController.js
 * @module controllers/facultyReviewController
 * @description HTTP controller for the Faculty Review module.
 *              Handles incoming Express requests and delegates data operations
 *              to the facultyReviewService layer. All responses use the standardised
 *              `sendResponse` utility for consistent JSON output.
 *
 *              Admin gating is enforced by the `requireAdmin` middleware at the
 *              route level, matching forumRoutes / subForumRoutes.
 *
 * @requires services/facultyReviewService
 * @requires utils/catchAsync
 * @requires utils/appError
 * @requires utils/appResponse
 */

import * as facultyReviewService from '../services/facultyReviewService.js';
import { catchAsync } from '../utils/catchAsync.js';
import { AppError } from '../utils/appError.js';
import { sendResponse } from '../utils/appResponse.js';

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC Endpoints
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @function getAllFacultyReviews
 * @description Retrieve all faculty reviews with optional query-string filters
 *              (facultyName, search). Public — no authentication required.
 * @route GET /api/faculty-reviews
 */
export const getAllFacultyReviews = catchAsync(async (req, res, next) => {
    const reviews = await facultyReviewService.fetchAllFacultyReviews(req.query);

    return sendResponse(res, 200, 'success', 'facultyReviews', reviews, reviews.length);
});

/**
 * @function getFacultyReview
 * @description Retrieve a single faculty review by ID. Public — no auth required.
 * @route GET /api/faculty-reviews/:id
 */
export const getFacultyReview = catchAsync(async (req, res, next) => {
    const review = await facultyReviewService.fetchFacultyReviewById(req.params.id);

    if (!review) {
        return next(new AppError(404, 'No faculty review found with that ID'));
    }

    return sendResponse(res, 200, 'success', 'facultyReview', review);
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN-ONLY Endpoints
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @function createFacultyReview
 * @description Publish a new faculty review. The `postedBy` field is auto-set from
 *              the authenticated admin's ID; any client-supplied value is ignored.
 * @route POST /api/faculty-reviews
 */
export const createFacultyReview = catchAsync(async (req, res, next) => {
    const { facultyName, review, photo } = req.body;

    const newReview = await facultyReviewService.insertFacultyReview({
        facultyName,
        review,
        photo,
        postedBy: req.user._id
    });

    return sendResponse(res, 201, 'success', 'facultyReview', newReview);
});

/**
 * @function updateFacultyReview
 * @description Edit an existing faculty review. Only the fields present in the
 *              request body are changed; supplying `photo` replaces the hosted
 *              image and destroys the previous Cloudinary asset.
 * @route PATCH /api/faculty-reviews/:id
 */
export const updateFacultyReview = catchAsync(async (req, res, next) => {
    const { facultyName, review, photo } = req.body;

    // Whitelist: never let a client overwrite postedBy or the timestamps
    const updates = {};
    if (facultyName !== undefined) updates.facultyName = facultyName;
    if (review !== undefined) updates.review = review;
    if (photo !== undefined) updates.photo = photo;

    const updated = await facultyReviewService.modifyFacultyReview(req.params.id, updates);

    if (!updated) {
        return next(new AppError(404, 'No faculty review found with that ID'));
    }

    return sendResponse(res, 200, 'success', 'facultyReview', updated);
});

/**
 * @function deleteFacultyReview
 * @description Permanently remove a faculty review and its hosted photo.
 * @route DELETE /api/faculty-reviews/:id
 */
export const deleteFacultyReview = catchAsync(async (req, res, next) => {
    const deleted = await facultyReviewService.removeFacultyReview(req.params.id);

    if (!deleted) {
        return next(new AppError(404, 'No faculty review found with that ID'));
    }

    return sendResponse(res, 204, 'success', null, null);
});
