/**
 * @file teamValidator.js
 * @module validators/teamValidator
 * @description Express-validator chains for the Team module.
 *              The category enum and graduation-year bounds are imported from the
 *              model so the validator can never drift out of sync with the schema.
 *
 * @requires express-validator
 * @requires models/teamMemberModel
 * @requires validators/validatorUtils
 */

import { body, query } from 'express-validator';
import {
    TEAM_CATEGORIES,
    MIN_GRADUATION_YEAR,
    maxGraduationYear
} from '../models/teamMemberModel.js';
import {
    collectErrors,
    validateObjectIdParam,
    validateOptionalImage,
    requireAtLeastOneField,
    requiredString,
    optionalString
} from './validatorUtils.js';

/** Fields an admin is allowed to change on an existing member */
const UPDATABLE_FIELDS = ['name', 'photo', 'graduationYear', 'category'];

/** Shared bounds message so create and update read identically */
const yearRangeMessage = () =>
    `Graduation year must be between ${MIN_GRADUATION_YEAR} and ${maxGraduationYear()}`;

// ─────────────────────────────────────────────────────────────────────────────
// Creation Chain
// ─────────────────────────────────────────────────────────────────────────────

export const validateTeamMemberCreation = [

    // ── Name ─────────────────────────────────────────────────────────────────
    requiredString('name', 'Team member name', 120),

    // ── Graduation Year ──────────────────────────────────────────────────────
    body('graduationYear')
        .notEmpty().withMessage('Graduation year is required')
        .bail()
        .isInt({ min: MIN_GRADUATION_YEAR, max: maxGraduationYear() })
        .withMessage(yearRangeMessage)
        .toInt(),

    // ── Category (strict enum — no trim) ─────────────────────────────────────
    body('category')
        .notEmpty().withMessage('Team category is required')
        .bail()
        .isIn(TEAM_CATEGORIES)
        .withMessage(`Category must be one of: ${TEAM_CATEGORIES.join(', ')}`),

    // ── Photo (optional — base64 or remote URL) ──────────────────────────────
    ...validateOptionalImage('photo', 'Photo'),

    collectErrors
];

// ─────────────────────────────────────────────────────────────────────────────
// Update Chain — every field optional, but the body may not be empty
// ─────────────────────────────────────────────────────────────────────────────

export const validateTeamMemberUpdate = [

    requireAtLeastOneField(UPDATABLE_FIELDS),

    optionalString('name', 'Name', 120),

    body('graduationYear')
        .optional()
        .isInt({ min: MIN_GRADUATION_YEAR, max: maxGraduationYear() })
        .withMessage(yearRangeMessage)
        .toInt(),

    body('category')
        .optional()
        .isIn(TEAM_CATEGORIES)
        .withMessage(`Category must be one of: ${TEAM_CATEGORIES.join(', ')}`),

    ...validateOptionalImage('photo', 'Photo'),

    collectErrors
];

// ─────────────────────────────────────────────────────────────────────────────
// Query Filter Validation — guards the public listing endpoint
// ─────────────────────────────────────────────────────────────────────────────

export const validateTeamQuery = [
    query('category')
        .optional()
        .isIn(TEAM_CATEGORIES)
        .withMessage(`Category must be one of: ${TEAM_CATEGORIES.join(', ')}`),

    query('graduationYear')
        .optional()
        .isInt({ min: MIN_GRADUATION_YEAR, max: maxGraduationYear() })
        .withMessage(yearRangeMessage),

    collectErrors
];

// ─────────────────────────────────────────────────────────────────────────────
// ID Parameter Validation
// ─────────────────────────────────────────────────────────────────────────────

export const validateTeamMemberId = validateObjectIdParam('team member');
