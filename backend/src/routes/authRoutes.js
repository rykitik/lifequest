// routes/authRoutes.js
import express from 'express';
import {
    register,
    login,
    refresh,
    logout,
    me,
} from '../controllers/authController.js';

import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

// Важно соблюдать порядок
router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', authMiddleware, me);

export default router;
