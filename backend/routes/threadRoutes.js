import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import { 
    createThread, 
    getSubForumThreads, 
    getForumThreads, 
    getThread, 
    updateThread, 
    deleteThread,
    searchThreads
} from '../controllers/threadController.js';
import { validateThreadCreation, validateThreadParamId } from '../validators/threadValidator.js';

const router = express.Router();

// GET /api/threads/search
router.get('/search', searchThreads);

// POST /api/threads
router.post('/', protect, validateThreadCreation, createThread);

// GET /api/threads/subforums/:id
router.get('/subforums/:id', validateThreadParamId, getSubForumThreads);

// GET /api/threads/forums/:id
router.get('/forums/:id', validateThreadParamId, getForumThreads);

// GET /api/threads/:id
router.get('/:id', validateThreadParamId, getThread);

// PATCH /api/threads/:id
router.patch('/:id', protect, validateThreadParamId, updateThread);

// DELETE /api/threads/:id
router.delete('/:id', protect, validateThreadParamId, deleteThread);

export default router;
