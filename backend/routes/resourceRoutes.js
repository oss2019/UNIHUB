/**
 * @file resourceRoutes.js
 * @module routes/resourceRoutes
 * @description Express router for the Academic Resources module.
 *              Defines the public and protected endpoints and wires them
 *              to their respective controller handlers and validation middleware.
 *
 * Route map:
 *   GET    /api/resources              → Public  — list/filter resources
 *   POST   /api/resources/:id/download → Public  — increment download counter
 *   POST   /api/resources              → Admin   — create a new resource
 *   DELETE /api/resources/:id          → Admin   — remove a resource
 *
 * @requires express
 * @requires middlewares/authMiddleware
 * @requires controllers/resourceController
 * @requires validators/resourceValidator
 */

import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import {
    getAllResources,
    createResource,
    deleteResource,
    incrementDownload
} from '../controllers/resourceController.js';
import { validateResourceCreation, validateResourceId } from '../validators/resourceValidator.js';

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// Public Routes (no authentication required)
// ─────────────────────────────────────────────────────────────────────────────

/** GET /api/resources — Retrieve all resources with optional filters */
router.get('/', getAllResources);

/** POST /api/resources/:id/download — Increment the download counter */
router.post('/:id/download', validateResourceId, incrementDownload);

// ─────────────────────────────────────────────────────────────────────────────
// Protected Routes (authentication required — role check inside controller)
// ─────────────────────────────────────────────────────────────────────────────

router.use(protect);

/** POST /api/resources — Admin-only: upload a new academic resource */
router.post('/', validateResourceCreation, createResource);

/** DELETE /api/resources/:id — Admin-only: permanently remove a resource */
router.delete('/:id', validateResourceId, deleteResource);

export default router;
