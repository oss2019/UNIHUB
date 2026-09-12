/**
 * @file teamController.js
 * @module controllers/teamController
 * @description HTTP controller for the Team module — the dev team, the academic
 *              council that commissioned the portal, and the council currently in office.
 *
 *              Reads are public so the Team page needs no session; every write is
 *              admin-only, enforced by `requireAdmin` at the route level.
 *
 * @requires services/teamService
 * @requires utils/catchAsync
 * @requires utils/appError
 * @requires utils/appResponse
 */

import * as teamService from '../services/teamService.js';
import { catchAsync } from '../utils/catchAsync.js';
import { AppError } from '../utils/appError.js';
import { sendResponse } from '../utils/appResponse.js';

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC Endpoints
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @function getAllTeamMembers
 * @description Retrieve team members, optionally filtered by category or graduation
 *              year. Pass `?grouped=true` to receive the whole team pre-bucketed by
 *              category — one request renders the entire Team page.
 * @route GET /api/team
 */
export const getAllTeamMembers = catchAsync(async (req, res, next) => {
    // Grouped mode returns an object keyed by category, not a flat array
    if (req.query.grouped === 'true') {
        const grouped = await teamService.fetchTeamGroupedByCategory();

        return sendResponse(res, 200, 'success', 'team', grouped);
    }

    const members = await teamService.fetchAllTeamMembers(req.query);

    return sendResponse(res, 200, 'success', 'teamMembers', members, members.length);
});

/**
 * @function getTeamMember
 * @description Retrieve a single team member by ID. Public — no auth required.
 * @route GET /api/team/:id
 */
export const getTeamMember = catchAsync(async (req, res, next) => {
    const member = await teamService.fetchTeamMemberById(req.params.id);

    if (!member) {
        return next(new AppError(404, 'No team member found with that ID'));
    }

    return sendResponse(res, 200, 'success', 'teamMember', member);
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN-ONLY Endpoints
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @function createTeamMember
 * @description Add a member to one of the three team categories. The `addedBy`
 *              field is auto-set from the authenticated admin's ID.
 * @route POST /api/team
 */
export const createTeamMember = catchAsync(async (req, res, next) => {
    const { name, photo, graduationYear, category } = req.body;

    const newMember = await teamService.insertTeamMember({
        name,
        photo,
        graduationYear,
        category,
        addedBy: req.user._id
    });

    return sendResponse(res, 201, 'success', 'teamMember', newMember);
});

/**
 * @function updateTeamMember
 * @description Edit an existing team member — including moving them between
 *              categories. Only the fields present in the request body are changed;
 *              supplying `photo` replaces the hosted image and destroys the old asset.
 * @route PATCH /api/team/:id
 */
export const updateTeamMember = catchAsync(async (req, res, next) => {
    const { name, photo, graduationYear, category } = req.body;

    // Whitelist: never let a client overwrite addedBy or the timestamps
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (photo !== undefined) updates.photo = photo;
    if (graduationYear !== undefined) updates.graduationYear = graduationYear;
    if (category !== undefined) updates.category = category;

    const updated = await teamService.modifyTeamMember(req.params.id, updates);

    if (!updated) {
        return next(new AppError(404, 'No team member found with that ID'));
    }

    return sendResponse(res, 200, 'success', 'teamMember', updated);
});

/**
 * @function deleteTeamMember
 * @description Permanently remove a team member and their hosted photo.
 * @route DELETE /api/team/:id
 */
export const deleteTeamMember = catchAsync(async (req, res, next) => {
    const deleted = await teamService.removeTeamMember(req.params.id);

    if (!deleted) {
        return next(new AppError(404, 'No team member found with that ID'));
    }

    return sendResponse(res, 204, 'success', null, null);
});
