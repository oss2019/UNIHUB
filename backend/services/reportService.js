/**
 * @file reportService.js
 * @module services/reportService
 * @description Data-access layer for the Report module.
 *              Encapsulates all Mongoose queries so controllers never touch the ORM directly.
 *              Handles the optional screenshot upload and the admin triage workflow.
 *
 * @requires models/reportModel
 * @requires services/photoService
 */

import { Report, REPORT_STATUSES } from '../models/reportModel.js';
import { resolvePhoto, removePhoto } from './photoService.js';

/** Reporter fields surfaced on every populated report */
const REPORTER_FIELDS = 'name email avatar role';

/** Admin fields surfaced for whoever handled the report */
const HANDLER_FIELDS = 'name avatar role';

// ─────────────────────────────────────────────────────────────────────────────
// READ Operations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch reports with optional filters and pagination.
 *
 * Pagination mirrors `getUserNotifications` in notificationService: 1-based page
 * numbers with a hard ceiling on limit so a single request can never sweep the
 * whole collection.
 *
 * @param {Object} queryObj             - Express req.query object.
 * @param {string} [queryObj.status]     - Filter by triage status.
 * @param {string} [queryObj.category]   - Filter by problem category.
 * @param {string} [queryObj.search]     - Full-text search across title and description.
 * @param {number} [queryObj.page=1]     - 1-based page number.
 * @param {number} [queryObj.limit=20]   - Page size (max 100).
 * @param {string} [scopeToUserId]       - When set, restrict results to this reporter.
 * @returns {Promise<{reports: Array, totalCount: number, hasMore: boolean}>}
 */
export const fetchAllReports = async (queryObj = {}, scopeToUserId = null) => {
    const mongoQuery = {};

    // Non-admins may only ever see their own submissions
    if (scopeToUserId) {
        mongoQuery.reportedBy = scopeToUserId;
    }

    if (queryObj.status) {
        mongoQuery.status = queryObj.status;
    }

    if (queryObj.category) {
        mongoQuery.category = queryObj.category;
    }

    if (queryObj.search) {
        mongoQuery.$text = { $search: queryObj.search };
    }

    const page = Math.max(1, Number(queryObj.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(queryObj.limit) || 20));
    const skip = (page - 1) * limit;

    const [reports, totalCount] = await Promise.all([
        Report.find(mongoQuery)
            .populate({ path: 'reportedBy', select: REPORTER_FIELDS })
            .populate({ path: 'handledBy', select: HANDLER_FIELDS })
            .sort({ createdAt: -1 }) // Newest first
            .skip(skip)
            .limit(limit),
        Report.countDocuments(mongoQuery)
    ]);

    // Same {items, totalCount, hasMore} contract the thread endpoints return
    return { reports, totalCount, hasMore: skip + reports.length < totalCount };
};

/**
 * Fetch a single report by its ObjectId.
 *
 * @param {string} id - Mongoose ObjectId of the target report.
 * @returns {Promise<Object|null>} The report document, or null if not found.
 */
export const fetchReportById = async (id) => {
    return await Report.findById(id)
        .populate({ path: 'reportedBy', select: REPORTER_FIELDS })
        .populate({ path: 'handledBy', select: HANDLER_FIELDS });
};

/**
 * Count reports grouped by status — powers the admin dashboard badges.
 *
 * @returns {Promise<Object>} Map of status → count, with every status present.
 */
export const countReportsByStatus = async () => {
    const rows = await Report.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Seed every status at zero so a badge the aggregation never returned renders
    // as "0" rather than "undefined" — same contract as fetchTeamGroupedByCategory
    const counts = REPORT_STATUSES.reduce((acc, status) => {
        acc[status] = 0;
        return acc;
    }, {});

    return rows.reduce((acc, { _id, count }) => {
        acc[_id] = count;
        return acc;
    }, counts);
};

// ─────────────────────────────────────────────────────────────────────────────
// WRITE Operations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Insert a new report, hosting the optional screenshot on Cloudinary first.
 *
 * @param {Object} reportData - Validated payload (title, description, category, screenshot, reportedBy).
 * @returns {Promise<Object>} The newly created report document.
 */
export const insertReport = async (reportData) => {
    const { screenshot, ...rest } = reportData;

    const created = await Report.create({
        ...rest,
        screenshot: await resolvePhoto(screenshot)
    });

    return await created.populate({ path: 'reportedBy', select: REPORTER_FIELDS });
};

/**
 * Apply an admin triage update to a report.
 *
 * Only the admin-owned fields (status, adminNote) are writable here — the
 * reporter's own content is immutable once filed, so the audit trail the dev
 * team works from cannot be rewritten after the fact.
 *
 * @param {string} id            - Mongoose ObjectId of the target report.
 * @param {Object} updates       - Partial payload; any of status, adminNote.
 * @param {string} handledByUserId - Admin performing the triage.
 * @returns {Promise<Object|null>} The updated document, or null if not found.
 */
export const modifyReportStatus = async (id, updates, handledByUserId) => {
    const payload = {};

    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.adminNote !== undefined) payload.adminNote = updates.adminNote;

    // Record who acted, but only when the report actually leaves the queue
    if (payload.status && payload.status !== 'open') {
        payload.handledBy = handledByUserId;
    }

    return await Report.findByIdAndUpdate(id, payload, {
        new: true,
        runValidators: true
    })
        .populate({ path: 'reportedBy', select: REPORTER_FIELDS })
        .populate({ path: 'handledBy', select: HANDLER_FIELDS });
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE Operations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Permanently remove a report and its hosted screenshot.
 *
 * @param {string} id - Mongoose ObjectId of the target report.
 * @returns {Promise<Object|null>} The deleted document, or null if not found.
 */
export const removeReport = async (id) => {
    const deleted = await Report.findByIdAndDelete(id);

    if (deleted?.screenshot) {
        await removePhoto(deleted.screenshot);
    }

    return deleted;
};
