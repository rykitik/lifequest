import express from 'express';
import { getAllQuests, createQuest, completeQuest } from '../controllers/questController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
const router = express.Router();

// Роуты

router.get('/', authMiddleware, getAllQuests);
router.post('/', authMiddleware, createQuest);
router.patch('/:id/complete', authMiddleware, completeQuest);

export default router;