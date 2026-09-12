/**
 * @file teamRoutes.js
 * @module routes/teamRoutes
 * @description Express router for the Team module.
 *              Defines the public and admin-only endpoints and wires them to their
 *              respective controller handlers and validation middleware.
 *
 * Route map:
 *   GET    /api/team      → Public — list members (?category=, ?grouped=true)
 *   GET    /api/team/:id  → Public — read a single member
 *   POST   /api/team      → Admin  — add a member
 *   PATCH  /api/team/:id  → Admin  — edit a member (including changing category)
 *   DELETE /api/team/:id  → Admin  — remove a member
 *
 * @requires express
 * @requires middlewares/authMiddleware
 * @requires middlewares/forumMiddleware
 * @requires controllers/teamController
 * @requires validators/teamValidator
 */

import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import { requireAdmin } from '../middlewares/forumMiddleware.js';
import {
    getAllTeamMembers,
    getTeamMember,
    createTeamMember,
    updateTeamMember,
    deleteTeamMember
} from '../controllers/teamController.js';
import {
    validateTeamMemberCreation,
    validateTeamMemberUpdate,
    validateTeamMemberId,
    validateTeamQuery
} from '../validators/teamValidator.js';

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// Public Routes (no authentication required)
// ─────────────────────────────────────────────────────────────────────────────

/** GET /api/team — Retrieve team members, flat or grouped by category */
router.get('/', validateTeamQuery, getAllTeamMembers);

/** GET /api/team/:id — Retrieve a single team member */
router.get('/:id', validateTeamMemberId, getTeamMember);

// ─────────────────────────────────────────────────────────────────────────────
// Admin Routes (authenticated + admin role required)
// ─────────────────────────────────────────────────────────────────────────────

router.use(protect, requireAdmin);

/** POST /api/team — Add a new team member */
router.post('/', validateTeamMemberCreation, createTeamMember);

/** PATCH /api/team/:id — Edit an existing team member */
router.patch('/:id', validateTeamMemberId, validateTeamMemberUpdate, updateTeamMember);

/** DELETE /api/team/:id — Permanently remove a team member */
router.delete('/:id', validateTeamMemberId, deleteTeamMember);

export default router;
