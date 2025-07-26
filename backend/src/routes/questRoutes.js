import express from 'express';
const router = express.Router();

// Роуты
// import authController from '../controllers/authController.js'; TODO: неактивный
import authMiddleware from '../middlewares/authMiddleware.js';

router.get('/', authMiddleware, questController.getAllQuests);
router.post('/', authMiddleware, questController.createQuest);
router.patch('/:id/complete', authMiddleware, questController.completeQuest);

export default router;