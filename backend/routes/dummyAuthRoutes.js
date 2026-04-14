// ─────────────────────────────────────────────────────────
// TEMPORARY: Dummy route file for testing getUserThreads
// This simulates what Person A will eventually add to userRoutes.js
// DELETE this file once Person A wires it into their routes.
// ─────────────────────────────────────────────────────────
import express from 'express';
import { getUserThreads } from '../controllers/threadController.js';

const router = express.Router();

// GET /api/dummy/users/:id/threads
router.get('/users/:id/threads', getUserThreads);

export default router;
