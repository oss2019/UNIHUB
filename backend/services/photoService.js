/**
 * @file photoService.js
 * @module services/photoService
 * @description Thin helper around the existing Cloudinary attachment pipeline for
 *              entities that carry exactly ONE image (faculty photo, team member
 *              photo, report screenshot) rather than an array of attachments.
 *
 *              Reuses `uploadBase64Attachments` so single-image entities behave
 *              identically to thread attachments: base64 payloads and external
 *              URLs are captured into our own Cloudinary account, while URLs we
 *              already host pass straight through untouched.
 *
 * @requires services/cloudinaryService
 */

import { uploadBase64Attachments, deleteAttachedAssets } from './cloudinaryService.js';

// ─────────────────────────────────────────────────────────────────────────────
// INSPECTION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Did the caller actually supply an image, as opposed to asking for the field to
 * be cleared? Lets callers tell "upload produced nothing because it failed" apart
 * from "upload produced nothing because there was nothing to upload".
 *
 * @param {*} photo - Raw photo value from the request body.
 * @returns {boolean} True when a non-empty image payload was supplied.
 */
export const isMeaningfulPhoto = (photo) =>
    typeof photo === 'string' && photo.trim() !== '';

// ─────────────────────────────────────────────────────────────────────────────
// UPLOAD
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Normalise a single incoming photo value into a hosted URL.
 *
 * Accepts a `data:image/...;base64,...` string, an external `http(s)` URL, or a
 * URL already on our Cloudinary. Returns an empty string when nothing usable was
 * supplied, so callers can assign the result straight onto a schema field whose
 * default is `''`.
 *
 * If Cloudinary is unreachable or misconfigured, `uploadBase64Attachments`
 * swallows the error and yields nothing — in that case we fall back to storing
 * the original value when it is already a usable http(s) URL, rather than
 * silently dropping the admin's input.
 *
 * @param {string} [photo] - Raw photo value from the request body.
 * @returns {Promise<string>} Hosted image URL, or '' when none could be resolved.
 */
export const resolvePhoto = async (photo) => {
    if (!photo || typeof photo !== 'string') return '';

    const trimmed = photo.trim();
    if (!trimmed) return '';

    const [secureUrl] = await uploadBase64Attachments([trimmed]);

    if (secureUrl) return secureUrl;

    // Cloudinary failed — keep an already-valid remote URL instead of losing it
    return /^https?:\/\//i.test(trimmed) ? trimmed : '';
};

// ─────────────────────────────────────────────────────────────────────────────
// CLEANUP
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Remove a single previously-hosted photo from Cloudinary.
 *
 * Only assets on our own Cloudinary account are destroyed; anything else is
 * ignored. Non-blocking by design — a cleanup failure must never prevent the
 * parent document from being deleted or updated.
 *
 * @param {string} [photoUrl] - The stored photo URL to remove.
 * @returns {Promise<void>}
 */
export const removePhoto = async (photoUrl) => {
    if (!photoUrl || !photoUrl.includes('res.cloudinary.com')) return;

    await deleteAttachedAssets([photoUrl]);
};
