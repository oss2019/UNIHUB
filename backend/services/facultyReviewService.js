/**
 * @file facultyReviewService.js
 * @module services/facultyReviewService
 * @description Data-access layer for the Faculty Review module.
 *              Encapsulates all Mongoose queries so controllers never touch the ORM directly.
 *              Also owns photo lifecycle: incoming photos are pushed to Cloudinary on write,
 *              and superseded/removed photos are cleaned up afterwards.
 *
 * @requires models/facultyReviewModel
 * @requires services/photoService
 */

import { FacultyReview } from '../models/facultyReviewModel.js';
import { resolvePhoto, removePhoto, isMeaningfulPhoto } from './photoService.js';

/** Uploader fields surfaced on every populated review */
const POSTED_BY_FIELDS = 'name avatar role';

// ─────────────────────────────────────────────────────────────────────────────
// READ Operations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch all faculty reviews, optionally filtered by faculty name or search term.
 *
 * @param {Object} queryObj              - Express req.query object.
 * @param {string} [queryObj.facultyName] - Case-insensitive exact-ish name filter.
 * @param {string} [queryObj.search]      - Full-text search across name and review body.
 * @returns {Promise<Array>} Array of review documents with populated author info.
 */
export const fetchAllFacultyReviews = async (queryObj = {}) => {
    const mongoQuery = {};

    // Apply optional filters only when the client provides them
    if (queryObj.facultyName) {
        mongoQuery.facultyName = new RegExp(escapeRegex(queryObj.facultyName), 'i');
    }

    if (queryObj.search) {
        mongoQuery.$text = { $search: queryObj.search };
    }

    return await FacultyReview.find(mongoQuery)
        .populate({ path: 'postedBy', select: POSTED_BY_FIELDS })
        .sort({ createdAt: -1 }); // Newest first
};

/**
 * Fetch a single faculty review by its ObjectId.
 *
 * @param {string} id - Mongoose ObjectId of the target review.
 * @returns {Promise<Object|null>} The review document, or null if not found.
 */
export const fetchFacultyReviewById = async (id) => {
    return await FacultyReview.findById(id).populate({
        path: 'postedBy',
        select: POSTED_BY_FIELDS
    });
};

// ─────────────────────────────────────────────────────────────────────────────
// WRITE Operations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Insert a new faculty review, hosting the supplied photo on Cloudinary first.
 *
 * @param {Object} reviewData          - Validated payload (facultyName, review, photo, postedBy).
 * @returns {Promise<Object>} The newly created review document.
 */
export const insertFacultyReview = async (reviewData) => {
    const { photo, ...rest } = reviewData;

    const created = await FacultyReview.create({
        ...rest,
        photo: await resolvePhoto(photo)
    });

    // Populate on the way out so a created review matches the shape of a fetched one
    return await created.populate({ path: 'postedBy', select: POSTED_BY_FIELDS });
};

/**
 * Update an existing faculty review.
 *
 * When a new photo is supplied it is hosted first and the previous Cloudinary
 * asset is destroyed afterwards, so replacing a photo never orphans a file.
 * Fields absent from `updates` are left untouched.
 *
 * @param {string} id      - Mongoose ObjectId of the target review.
 * @param {Object} updates - Partial payload; any of facultyName, review, photo.
 * @returns {Promise<Object|null>} The updated document, or null if not found.
 */
export const modifyFacultyReview = async (id, updates) => {
    const existing = await FacultyReview.findById(id);
    if (!existing) return null;

    const { photo, ...rest } = updates;
    const payload = { ...rest };

    // Only touch the photo when the caller actually sent one
    let isPhotoBeingReplaced = photo !== undefined;
    if (isPhotoBeingReplaced) {
        const resolved = await resolvePhoto(photo);

        // An empty result for a non-empty input means the upload failed. Writing
        // it would blank the field AND destroy the photo already on record, so
        // leave the existing photo alone instead of losing it to a transient error.
        if (!resolved && isMeaningfulPhoto(photo)) {
            isPhotoBeingReplaced = false;
        } else {
            payload.photo = resolved;
        }
    }

    const updated = await FacultyReview.findByIdAndUpdate(id, payload, {
        new: true,
        runValidators: true
    }).populate({ path: 'postedBy', select: POSTED_BY_FIELDS });

    // Deleted by another request between the read and the write
    if (!updated) {
        if (isPhotoBeingReplaced) await removePhoto(payload.photo);
        return null;
    }

    // Clean up the superseded asset only once the write has succeeded
    if (isPhotoBeingReplaced && existing.photo && existing.photo !== updated.photo) {
        await removePhoto(existing.photo);
    }

    return updated;
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE Operations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Permanently remove a faculty review and its hosted photo.
 *
 * @param {string} id - Mongoose ObjectId of the target review.
 * @returns {Promise<Object|null>} The deleted document, or null if not found.
 */
export const removeFacultyReview = async (id) => {
    const deleted = await FacultyReview.findByIdAndDelete(id);

    if (deleted?.photo) {
        await removePhoto(deleted.photo);
    }

    return deleted;
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Neutralise regex metacharacters so user input cannot alter the match pattern */
function escapeRegex(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
