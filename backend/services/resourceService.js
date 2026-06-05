/**
 * @file resourceService.js
 * @module services/resourceService
 * @description Data-access layer for the Resource module.
 *              Encapsulates all Mongoose queries so controllers never touch the ORM directly.
 *              Every exported function returns a Promise resolved with plain Mongoose documents.
 *
 * @requires models/resourceModel
 */

import { Resource } from '../models/resourceModel.js';

// ─────────────────────────────────────────────────────────────────────────────
// READ Operations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch all resources, optionally filtered by category, semester, or search term.
 *
 * @param {Object}  queryObj          - Express req.query object.
 * @param {string}  [queryObj.category] - Filter by resource category enum.
 * @param {number}  [queryObj.semester] - Filter by target semester (1–8).
 * @param {string}  [queryObj.search]   - Full-text search term matched against the text index.
 * @returns {Promise<Array>} Array of resource documents with populated uploader info.
 */
export const fetchAllResources = async (queryObj) => {
    const mongoQuery = {};

    // Apply optional filters only when the client provides them
    if (queryObj.category) {
        mongoQuery.category = queryObj.category;
    }

    if (queryObj.semester) {
        mongoQuery.semester = Number(queryObj.semester);
    }

    if (queryObj.search) {
        mongoQuery.$text = { $search: queryObj.search };
    }

    // Populate uploader details for the resource card avatar
    const query = Resource.find(mongoQuery)
        .populate({
            path: 'uploadedBy',
            select: 'name avatar role'
        })
        .sort({ createdAt: -1 }); // Newest first

    return await query;
};

// ─────────────────────────────────────────────────────────────────────────────
// WRITE Operations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Insert a new resource document into the database.
 *
 * @param {Object} resourceData - Validated resource payload (title, url, semester, etc.).
 * @returns {Promise<Object>} The newly created resource document.
 */
export const insertResource = async (resourceData) => {
    return await Resource.create(resourceData);
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE Operations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Permanently remove a resource document by its ObjectId.
 *
 * @param {string} id - Mongoose ObjectId of the target resource.
 * @returns {Promise<Object|null>} The deleted document, or null if not found.
 */
export const removeResource = async (id) => {
    return await Resource.findByIdAndDelete(id);
};

// ─────────────────────────────────────────────────────────────────────────────
// METRIC Operations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Atomically increment the download counter for a given resource.
 * Uses MongoDB's `$inc` operator to guarantee thread-safe increments
 * even under concurrent request load.
 *
 * @param {string} id - Mongoose ObjectId of the target resource.
 * @returns {Promise<Object|null>} The updated document with the new downloadsCount, or null.
 */
export const addDownloadCount = async (id) => {
    return await Resource.findByIdAndUpdate(
        id,
        { $inc: { downloadsCount: 1 } },
        { new: true, runValidators: false }
    );
};
