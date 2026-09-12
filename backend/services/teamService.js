/**
 * @file teamService.js
 * @module services/teamService
 * @description Data-access layer for the Team module.
 *              Encapsulates all Mongoose queries so controllers never touch the ORM directly.
 *              Owns the photo lifecycle for team member portraits.
 *
 * @requires models/teamMemberModel
 * @requires services/photoService
 */

import { TeamMember, TEAM_CATEGORIES } from '../models/teamMemberModel.js';
import { resolvePhoto, removePhoto, isMeaningfulPhoto } from './photoService.js';

/** Admin fields surfaced on every populated member */
const ADDED_BY_FIELDS = 'name avatar role';

/** Team page ordering: newest graduates first, then alphabetical */
const TEAM_SORT = { graduationYear: -1, name: 1 };

// ─────────────────────────────────────────────────────────────────────────────
// READ Operations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch team members, optionally narrowed to a single category.
 *
 * @param {Object} queryObj             - Express req.query object.
 * @param {string} [queryObj.category]   - One of TEAM_CATEGORIES.
 * @param {number} [queryObj.graduationYear] - Exact graduation-year filter.
 * @returns {Promise<Array>} Array of team member documents.
 */
export const fetchAllTeamMembers = async (queryObj = {}) => {
    const mongoQuery = {};

    if (queryObj.category) {
        mongoQuery.category = queryObj.category;
    }

    if (queryObj.graduationYear) {
        mongoQuery.graduationYear = Number(queryObj.graduationYear);
    }

    return await TeamMember.find(mongoQuery)
        .populate({ path: 'addedBy', select: ADDED_BY_FIELDS })
        .sort(TEAM_SORT);
};

/**
 * Fetch every team member already bucketed by category.
 *
 * Saves the Team page three round-trips: one call returns an object keyed by
 * category, with every known category present even when it holds no members yet.
 *
 * @returns {Promise<Object>} Map of category → array of member documents.
 */
export const fetchTeamGroupedByCategory = async () => {
    const members = await TeamMember.find({})
        .populate({ path: 'addedBy', select: ADDED_BY_FIELDS })
        .sort(TEAM_SORT);

    // Seed every category so the frontend can rely on the shape unconditionally
    const grouped = TEAM_CATEGORIES.reduce((acc, category) => {
        acc[category] = [];
        return acc;
    }, {});

    for (const member of members) {
        grouped[member.category].push(member);
    }

    return grouped;
};

/**
 * Fetch a single team member by ObjectId.
 *
 * @param {string} id - Mongoose ObjectId of the target member.
 * @returns {Promise<Object|null>} The member document, or null if not found.
 */
export const fetchTeamMemberById = async (id) => {
    return await TeamMember.findById(id).populate({
        path: 'addedBy',
        select: ADDED_BY_FIELDS
    });
};

// ─────────────────────────────────────────────────────────────────────────────
// WRITE Operations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Insert a new team member, hosting the supplied photo on Cloudinary first.
 *
 * @param {Object} memberData - Validated payload (name, graduationYear, category, photo, addedBy).
 * @returns {Promise<Object>} The newly created member document.
 */
export const insertTeamMember = async (memberData) => {
    const { photo, ...rest } = memberData;

    return await TeamMember.create({
        ...rest,
        photo: await resolvePhoto(photo)
    });
};

/**
 * Update an existing team member.
 *
 * When a new photo is supplied it is hosted first and the previous Cloudinary
 * asset is destroyed afterwards, so replacing a portrait never orphans a file.
 * Fields absent from `updates` are left untouched.
 *
 * @param {string} id      - Mongoose ObjectId of the target member.
 * @param {Object} updates - Partial payload; any of name, graduationYear, category, photo.
 * @returns {Promise<Object|null>} The updated document, or null if not found.
 */
export const modifyTeamMember = async (id, updates) => {
    const existing = await TeamMember.findById(id);
    if (!existing) return null;

    const { photo, ...rest } = updates;
    const payload = { ...rest };

    // Only touch the photo when the caller actually sent one
    let isPhotoBeingReplaced = photo !== undefined;
    if (isPhotoBeingReplaced) {
        const resolved = await resolvePhoto(photo);

        // An empty result for a non-empty input means the upload failed. Writing
        // it would blank the field AND destroy the portrait already on record, so
        // leave the existing photo alone instead of losing it to a transient error.
        if (!resolved && isMeaningfulPhoto(photo)) {
            isPhotoBeingReplaced = false;
        } else {
            payload.photo = resolved;
        }
    }

    const updated = await TeamMember.findByIdAndUpdate(id, payload, {
        new: true,
        runValidators: true
    }).populate({ path: 'addedBy', select: ADDED_BY_FIELDS });

    // Deleted by another request between the read and the write
    if (!updated) {
        if (isPhotoBeingReplaced) await removePhoto(payload.photo);
        return null;
    }

    // Clean up the superseded asset only once the write has succeeded
    if (isPhotoBeingReplaced && existing.photo && existing.photo !== updated.photo) {
        await removePhoto(existing.photo);
    }

    return updated;
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE Operations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Permanently remove a team member and their hosted photo.
 *
 * @param {string} id - Mongoose ObjectId of the target member.
 * @returns {Promise<Object|null>} The deleted document, or null if not found.
 */
export const removeTeamMember = async (id) => {
    const deleted = await TeamMember.findByIdAndDelete(id);

    if (deleted?.photo) {
        await removePhoto(deleted.photo);
    }

    return deleted;
};
