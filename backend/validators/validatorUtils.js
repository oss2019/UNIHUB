/**
 * @file validatorUtils.js
 * @module validators/validatorUtils
 * @description Shared express-validator building blocks used by the faculty review,
 *              report and team validators. Keeps the three chains consistent with
 *              each other and with the error contract the global handler expects.
 *
 * @requires express-validator
 * @requires utils/appError
 */

import { body, param, validationResult } from 'express-validator';
import mongoose from 'mongoose';
import { AppError } from '../utils/appError.js';

// ─────────────────────────────────────────────────────────────────────────────
// Error Aggregation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Collects all validation errors and passes the FIRST one to the global error
 * handler via AppError. Mirrors the aggregator used by resourceValidator so API
 * responses stay consistent by surfacing one actionable message at a time.
 */
export const collectErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new AppError(400, errors.array()[0].msg));
    }
    next();
};

// ─────────────────────────────────────────────────────────────────────────────
// Route Parameter Validation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build a validation chain asserting that a route param is a valid ObjectId.
 *
 * @param {string} label        - Human-readable entity name for the error message.
 * @param {string} [paramName='id'] - The route parameter to check.
 * @returns {Array} express-validator middleware chain.
 */
export const validateObjectIdParam = (label, paramName = 'id') => [
    param(paramName)
        .custom((value) => mongoose.Types.ObjectId.isValid(value))
        .withMessage(`Invalid ${label} ID format — must be a valid 24-character hex string`),
    collectErrors
];

// ─────────────────────────────────────────────────────────────────────────────
// Text Field Validation
// ─────────────────────────────────────────────────────────────────────────────
//
// `.trim()` coerces whatever it is given into a string BEFORE any later check
// runs, so an `.isString()` placed after it can never fail — a JSON object would
// sail through as the literal text "[object Object]" and be persisted. Every
// text chain below therefore asserts the type FIRST and bails before trimming.

/**
 * Build a validation chain for a REQUIRED text field.
 *
 * @param {string} field     - Body field name.
 * @param {string} label     - Human-readable name for the error messages.
 * @param {number} maxLength - Schema maxlength, mirrored here.
 * @returns {import('express-validator').ValidationChain}
 */
export const requiredString = (field, label, maxLength) =>
    body(field)
        .exists({ values: 'null' }).withMessage(`${label} is required`)
        .bail()
        .isString().withMessage(`${label} must be a string`)
        .bail()
        .trim()                                                          // schema: trim
        .notEmpty().withMessage(`${label} is required`)
        .isLength({ max: maxLength })
        .withMessage(`${label} cannot exceed ${maxLength} characters`);

/**
 * Build a validation chain for an OPTIONAL text field.
 *
 * @param {string}  field                  - Body field name.
 * @param {string}  label                  - Human-readable name for the error messages.
 * @param {number}  maxLength              - Schema maxlength, mirrored here.
 * @param {Object}  [options]
 * @param {boolean} [options.allowEmpty=false] - Permit '' as an explicit "clear this" signal.
 * @returns {import('express-validator').ValidationChain}
 */
export const optionalString = (field, label, maxLength, { allowEmpty = false } = {}) => {
    const chain = body(field)
        .optional()
        .isString().withMessage(`${label} must be a string`)
        .bail()
        .trim();                                                         // schema: trim

    if (!allowEmpty) {
        chain.notEmpty().withMessage(`${label} cannot be empty`);
    }

    return chain
        .isLength({ max: maxLength })
        .withMessage(`${label} cannot exceed ${maxLength} characters`);
};

// ─────────────────────────────────────────────────────────────────────────────
// Image Payload Validation
// ─────────────────────────────────────────────────────────────────────────────

/** Accepts a base64 data URI for an image, e.g. `data:image/png;base64,iVBORw0…` */
const BASE64_IMAGE = /^data:image\/[a-z0-9.+-]+;base64,/i;

/** Accepts a plain remote URL that Cloudinary can fetch and re-host */
const REMOTE_URL = /^https?:\/\/.+/i;

/**
 * Build a validation chain for an OPTIONAL single-image field.
 *
 * The service layer pipes the value through Cloudinary, which understands both a
 * base64 data URI and a remote URL — so both forms are accepted here, and an
 * empty string is allowed as an explicit "no image" signal.
 *
 * @param {string} field - Body field name (e.g. 'photo', 'screenshot').
 * @param {string} label - Human-readable name for the error message.
 * @returns {Array} express-validator middleware chain fragment.
 */
export const validateOptionalImage = (field, label) => [
    body(field)
        .optional()
        .isString().withMessage(`${label} must be a string`)
        .bail()
        .trim()
        .custom((value) => {
            if (value === '') return true; // explicit clear
            return BASE64_IMAGE.test(value) || REMOTE_URL.test(value);
        })
        .withMessage(`${label} must be a base64 image data URI or an http(s) URL`)
];

// ─────────────────────────────────────────────────────────────────────────────
// Partial-Update Guard
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Reject PATCH requests that carry none of the updatable fields, so an empty
 * body fails loudly instead of silently succeeding as a no-op write.
 *
 * @param {string[]} fields - The field names this route is allowed to update.
 * @returns {Function} Express middleware.
 */
export const requireAtLeastOneField = (fields) => (req, res, next) => {
    const supplied = fields.filter((field) => req.body?.[field] !== undefined);

    if (supplied.length === 0) {
        return next(
            new AppError(400, `Provide at least one field to update: ${fields.join(', ')}`)
        );
    }

    next();
};
