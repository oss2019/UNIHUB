/**
 * @file facultyReviewValidator.js
 * @module validators/facultyReviewValidator
 * @description Express-validator chains for the Faculty Review module.
 *              Runs BEFORE the controller so only clean, well-formed data reaches
 *              the database layer.
 *
 * Sanitisation rules are aligned 1-to-1 with the Mongoose schema constraints:
 *   - Fields with `trim: true` in the schema  →  `.trim()` applied here.
 *   - Photo accepts a base64 data URI or a remote URL (Cloudinary handles both).
 *
 * @requires express-validator
 * @requires validators/validatorUtils
 */

import {
    collectErrors,
    validateObjectIdParam,
    validateOptionalImage,
    requireAtLeastOneField,
    requiredString,
    optionalString
} from './validatorUtils.js';

/** Fields an admin is allowed to change on an existing review */
const UPDATABLE_FIELDS = ['facultyName', 'review', 'photo'];

// ─────────────────────────────────────────────────────────────────────────────
// Creation Chain
// ─────────────────────────────────────────────────────────────────────────────

export const validateFacultyReviewCreation = [

    // ── Faculty Name ─────────────────────────────────────────────────────────
    requiredString('facultyName', 'Faculty name', 120),

    // ── Review Body ──────────────────────────────────────────────────────────
    requiredString('review', 'Review', 5000),

    // ── Photo (optional — base64 or remote URL) ──────────────────────────────
    ...validateOptionalImage('photo', 'Photo'),

    collectErrors
];

// ─────────────────────────────────────────────────────────────────────────────
// Update Chain — every field optional, but the body may not be empty
// ─────────────────────────────────────────────────────────────────────────────

export const validateFacultyReviewUpdate = [

    requireAtLeastOneField(UPDATABLE_FIELDS),

    optionalString('facultyName', 'Faculty name', 120),

    optionalString('review', 'Review', 5000),

    ...validateOptionalImage('photo', 'Photo'),

    collectErrors
];

// ─────────────────────────────────────────────────────────────────────────────
// ID Parameter Validation
// ─────────────────────────────────────────────────────────────────────────────

export const validateFacultyReviewId = validateObjectIdParam('faculty review');
