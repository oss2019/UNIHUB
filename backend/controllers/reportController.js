/**
 * @file reportController.js
 * @module controllers/reportController
 * @description HTTP controller for the Report module — problems users hit inside
 *              the application, filed for admins to triage and forward to the dev team.
 *
 *              Visibility rules:
 *                - Any authenticated user may file a report and list their own.
 *                - Admins may list every report, triage it, and delete it.
 *              Admin gating is enforced by `requireAdmin` at the route level.
 *
 * @requires services/reportService
 * @requires utils/catchAsync
 * @requires utils/appError
 * @requires utils/appResponse
 */

import * as reportService from '../services/reportService.js';
import { catchAsync } from '../utils/catchAsync.js';
import { AppError } from '../utils/appError.js';
import { sendResponse } from '../utils/appResponse.js';
import { isAdmin } from '../utils/isAdmin.js';

// ─────────────────────────────────────────────────────────────────────────────
// AUTHENTICATED USER Endpoints
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @function createReport
 * @description File a new problem report. The `reportedBy` field is auto-set from
 *              the authenticated user; `status`, `adminNote` and `handledBy` are
 *              deliberately NOT accepted here so a reporter cannot pre-triage.
 * @route POST /api/reports
 */
export const createReport = catchAsync(async (req, res, next) => {
    const { title, description, category, screenshot } = req.body;

    const newReport = await reportService.insertReport({
        title,
        description,
        category,
        screenshot,
        reportedBy: req.user._id
    });

    return sendResponse(res, 201, 'success', 'report', newReport);
});

/**
 * @function getMyReports
 * @description List the reports filed by the authenticated user, newest first.
 * @route GET /api/reports/my
 */
export const getMyReports = catchAsync(async (req, res, next) => {
    const { reports, total, page, limit } = await reportService.fetchAllReports(
        req.query,
        req.user._id
    );

    return sendResponse(res, 200, 'success', 'reports', { reports, total, page, limit }, reports.length);
});

/**
 * @function getReport
 * @description Retrieve a single report. Admins may read any report; everyone
 *              else may only read one they filed themselves.
 * @route GET /api/reports/:id
 */
export const getReport = catchAsync(async (req, res, next) => {
    const report = await reportService.fetchReportById(req.params.id);

    if (!report) {
        return next(new AppError(404, 'No report found with that ID'));
    }

    const isOwner = report.reportedBy?._id?.toString() === req.user._id.toString();

    if (!isOwner && !isAdmin(req.user)) {
        return next(new AppError(403, 'You do not have permission to view this report'));
    }

    return sendResponse(res, 200, 'success', 'report', report);
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN-ONLY Endpoints
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @function getAllReports
 * @description List every report for the admin triage board, with optional
 *              status / category / search filters and pagination.
 * @route GET /api/reports
 */
export const getAllReports = catchAsync(async (req, res, next) => {
    const { reports, total, page, limit } = await reportService.fetchAllReports(req.query);

    return sendResponse(res, 200, 'success', 'reports', { reports, total, page, limit }, reports.length);
});

/**
 * @function getReportStats
 * @description Return report counts grouped by status, for admin dashboard badges.
 * @route GET /api/reports/stats
 */
export const getReportStats = catchAsync(async (req, res, next) => {
    const stats = await reportService.countReportsByStatus();

    return sendResponse(res, 200, 'success', 'stats', stats);
});

/**
 * @function triageReport
 * @description Move a report through the triage workflow and/or attach an admin
 *              note (e.g. "forwarded to dev team"). The reporter's own content is
 *              immutable, so the record the dev team works from stays trustworthy.
 * @route PATCH /api/reports/:id
 */
export const triageReport = catchAsync(async (req, res, next) => {
    const { status, adminNote } = req.body;

    const updated = await reportService.modifyReportStatus(
        req.params.id,
        { status, adminNote },
        req.user._id
    );

    if (!updated) {
        return next(new AppError(404, 'No report found with that ID'));
    }

    return sendResponse(res, 200, 'success', 'report', updated);
});

/**
 * @function deleteReport
 * @description Permanently remove a report and its hosted screenshot.
 * @route DELETE /api/reports/:id
 */
export const deleteReport = catchAsync(async (req, res, next) => {
    const deleted = await reportService.removeReport(req.params.id);

    if (!deleted) {
        return next(new AppError(404, 'No report found with that ID'));
    }

    return sendResponse(res, 204, 'success', null, null);
});
