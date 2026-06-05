/**
 * @file resourceValidator.js
 * @module validators/resourceValidator
 * @description Express-validator middleware chain for sanitising and validating
 *              incoming resource creation payloads. Runs BEFORE the controller
 *              so that only clean, well-formed data reaches the database layer.
 *
 * Sanitisation rules are aligned 1-to-1 with the Mongoose schema constraints:
 *   - Fields with `trim: true`    in the schema  →  `.trim()` applied here.
 *   - Fields with `uppercase: true`               →  `.toUpperCase()` applied here.
 *   - Fields with `lowercase: true` (tags array)  →  `.customSanitizer()` applied here.
 *   - Enum fields (category, fileType)            →  NO trim/case mutation (exact match required).
 *
 * @requires express-validator
 * @requires utils/appError
 */

import { body, param, validationResult } from 'express-validator';
import mongoose from 'mongoose';
import { AppError } from '../utils/appError.js';

// ─────────────────────────────────────────────────────────────────────────────
// Validation + Sanitisation Chain
// ─────────────────────────────────────────────────────────────────────────────

export const validateResourceCreation = [

    // ── Title ────────────────────────────────────────────────────────────────
    body('title')
        .trim()                                                              // schema: trim
        .notEmpty().withMessage('Resource title is required')
        .isString().withMessage('Title must be a string')
        .isLength({ max: 100 }).withMessage('Title cannot exceed 100 characters'),

    // ── Description (optional) ───────────────────────────────────────────────
    body('description')
        .optional()
        .default('No description provided.')
        .trim()                                                              // schema: trim
        .isString()
        .isLength({ max: 250 }).withMessage('Description cannot exceed 250 characters'),

    // ── Category (strict enum — no trim) ─────────────────────────────────────
    body('category')
        .notEmpty().withMessage('Category is required')
        .isIn(['course-material', 'lab-manual', 'project', 'placement', 'other'])
        .withMessage('Invalid category'),

    // ── Tags (optional array — sanitised to trimmed lowercase) ───────────────
    body('tags')
        .optional()
        .isArray().withMessage('Tags must be an array of strings')
        .customSanitizer(tags => tags.map(tag => String(tag).trim().toLowerCase())),

    // ── URL ──────────────────────────────────────────────────────────────────
    body('url')
        .trim()                                                              // schema: trim
        .notEmpty().withMessage('Resource URL is required')
        .isURL({ require_protocol: true }).withMessage('Must be a valid URL with http or https protocol'),

    // ── Course Code (auto-uppercased) ────────────────────────────────────────
    body('courseCode')
        .trim()                                                              // schema: trim
        .notEmpty().withMessage('Course code is required')
        .toUpperCase(),                                                      // schema: uppercase

    // ── Course Name ──────────────────────────────────────────────────────────
    body('courseName')
        .trim()                                                              // schema: trim
        .notEmpty().withMessage('Course name is required'),

    // ── Semester (integer range 1–8) ─────────────────────────────────────────
    body('semester')
        .notEmpty().withMessage('Semester is required')
        .isInt({ min: 1, max: 8 }).withMessage('Semester must be between 1 and 8'),

    // ── File Type (strict enum — no trim) ────────────────────────────────────
    body('fileType')
        .notEmpty().withMessage('File type is required')
        .isIn(['PDF', 'ZIP', 'Link', 'GitHub', 'Drive']).withMessage('Invalid file type'),

    // ── File Size (optional display string) ──────────────────────────────────
    body('fileSize')
        .optional()
        .default('Web Link')
        .trim()                                                              // schema: trim
        .isString(),

    // ── Final Error Aggregator ───────────────────────────────────────────────
    /**
     * Collects all validation errors and passes the FIRST one to the global
     * error handler via AppError. This keeps API responses consistent by
     * surfacing one actionable message at a time.
     */
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return next(new AppError(400, errors.array()[0].msg));
        }
        next();
    }
];

// ─────────────────────────────────────────────────────────────────────────────
// ID Parameter Validation
// ─────────────────────────────────────────────────────────────────────────────

export const validateResourceId = [
    param('id')
        .custom((value) => mongoose.Types.ObjectId.isValid(value))
        .withMessage('Invalid resource ID format — must be a valid 24-character hex string'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return next(new AppError(400, errors.array()[0].msg));
        }
        next();
    }
];
