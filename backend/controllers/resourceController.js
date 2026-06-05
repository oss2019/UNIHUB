/**
 * @file resourceController.js
 * @module controllers/resourceController
 * @description HTTP controller for the Academic Resources module.
 *              Handles incoming Express requests and delegates data operations
 *              to the resourceService layer. All responses use the standardised
 *              `sendResponse` utility for consistent JSON output.
 *
 * @requires services/resourceService
 * @requires utils/catchAsync
 * @requires utils/appError
 * @requires utils/appResponse
 */

import * as resourceService from '../services/resourceService.js';
import { catchAsync } from '../utils/catchAsync.js';
import { AppError } from '../utils/appError.js';
import { sendResponse } from '../utils/appResponse.js';

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC Endpoints
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @function getAllResources
 * @description Retrieve all academic resources with optional query-string filters
 *              (category, semester, search). Public — no authentication required.
 * @route GET /api/resources
 */
export const getAllResources = catchAsync(async (req, res, next) => {
    const resources = await resourceService.fetchAllResources(req.query);

    return sendResponse(res, 200, 'success', 'resources', resources, resources.length);
});

/**
 * @function incrementDownload
 * @description Atomically increment the download counter for a specific resource.
 *              Intended to be fired by the frontend when a user clicks "Download".
 *              Public — no authentication required.
 * @route POST /api/resources/:id/download
 */
export const incrementDownload = catchAsync(async (req, res, next) => {
    const resource = await resourceService.addDownloadCount(req.params.id);

    if (!resource) {
        return next(new AppError(404, 'No resource found with that ID'));
    }

    return sendResponse(res, 200, 'success', 'downloadsCount', resource.downloadsCount);
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN-ONLY Endpoints
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @function createResource
 * @description Create a new academic resource. Restricted to users with the 'admin' role.
 *              The `uploadedBy` field is auto-set from the authenticated user's ID.
 * @route POST /api/resources
 */
export const createResource = catchAsync(async (req, res, next) => {
    // Role-gate: only administrators may upload resources
    if (req.user.role !== 'admin') {
        return next(new AppError(403, 'You do not have permission to perform this action'));
    }

    const newResource = await resourceService.insertResource({
        ...req.body,
        uploadedBy: req.user._id
    });

    return sendResponse(res, 201, 'success', 'resource', newResource);
});

/**
 * @function deleteResource
 * @description Permanently remove an academic resource by its ID.
 *              Restricted to users with the 'admin' role.
 * @route DELETE /api/resources/:id
 */
export const deleteResource = catchAsync(async (req, res, next) => {
    // Role-gate: only administrators may delete resources
    if (req.user.role !== 'admin') {
        return next(new AppError(403, 'You do not have permission to perform this action'));
    }

    const resource = await resourceService.removeResource(req.params.id);

    if (!resource) {
        return next(new AppError(404, 'No resource found with that ID'));
    }

    return sendResponse(res, 204, 'success', null, null);
});
