/**
 * @file reportValidator.js
 * @module validators/reportValidator
 * @description Express-validator chains for the Report module.
 *              Enum lists are imported from the model so the validator can never
 *              drift out of sync with the schema it guards.
 *
 * @requires express-validator
 * @requires models/reportModel
 * @requires validators/validatorUtils
 */

import { body, query } from 'express-validator';
import { REPORT_CATEGORIES, REPORT_STATUSES } from '../models/reportModel.js';
import {
    collectErrors,
    validateObjectIdParam,
    validateOptionalImage,
    requireAtLeastOneField,
    requiredString,
    optionalString
} from './validatorUtils.js';

/** Fields an admin is allowed to change while triaging */
const TRIAGE_FIELDS = ['status', 'adminNote'];

// ─────────────────────────────────────────────────────────────────────────────
// Creation Chain — what a regular user submits
// ─────────────────────────────────────────────────────────────────────────────

export const validateReportCreation = [

    // ── Title ────────────────────────────────────────────────────────────────
    requiredString('title', 'Report title', 150),

    // ── Description ──────────────────────────────────────────────────────────
    requiredString('description', 'Report description', 2000),

    // ── Category (strict enum — no trim) ─────────────────────────────────────
    body('category')
        .optional()
        .isIn(REPORT_CATEGORIES)
        .withMessage(`Category must be one of: ${REPORT_CATEGORIES.join(', ')}`),

    // ── Screenshot (optional — base64 or remote URL) ─────────────────────────
    ...validateOptionalImage('screenshot', 'Screenshot'),

    collectErrors
];

// ─────────────────────────────────────────────────────────────────────────────
// Triage Chain — admin-only status / note updates
// ─────────────────────────────────────────────────────────────────────────────

export const validateReportTriage = [

    requireAtLeastOneField(TRIAGE_FIELDS),

    body('status')
        .optional()
        .isIn(REPORT_STATUSES)
        .withMessage(`Status must be one of: ${REPORT_STATUSES.join(', ')}`),

    // Empty string is allowed here — it is how an admin clears a note
    optionalString('adminNote', 'Admin note', 1000, { allowEmpty: true }),

    collectErrors
];

// ─────────────────────────────────────────────────────────────────────────────
// Query Filter Validation — guards both listing endpoints
// ─────────────────────────────────────────────────────────────────────────────
//
// Mirrors validateTeamQuery: an unrecognised filter is a 400 rather than a
// silently empty page, so a typo in the admin board reads as a mistake instead
// of "no reports". No sanitisers here — req.query is read-only under Express 5.

export const validateReportQuery = [
    query('status')
        .optional()
        .isIn(REPORT_STATUSES)
        .withMessage(`Status must be one of: ${REPORT_STATUSES.join(', ')}`),

    query('category')
        .optional()
        .isIn(REPORT_CATEGORIES)
        .withMessage(`Category must be one of: ${REPORT_CATEGORIES.join(', ')}`),

    query('search')
        .optional()
        .isString().withMessage('Search must be a string')
        .bail()
        .isLength({ max: 150 }).withMessage('Search cannot exceed 150 characters'),

    query('page')
        .optional()
        .isInt({ min: 1 }).withMessage('Page must be a positive integer'),

    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),

    collectErrors
];

// ─────────────────────────────────────────────────────────────────────────────
// ID Parameter Validation
// ─────────────────────────────────────────────────────────────────────────────

export const validateReportId = validateObjectIdParam('report');
