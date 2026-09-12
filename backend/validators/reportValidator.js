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

import { body } from 'express-validator';
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
// ID Parameter Validation
// ─────────────────────────────────────────────────────────────────────────────

export const validateReportId = validateObjectIdParam('report');
