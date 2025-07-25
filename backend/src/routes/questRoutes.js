const express = require('express');
const router = express.Router();
const questController = require('../controllers/questController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/', authMiddleware, questController.getAllQuests);
router.post('/', authMiddleware, questController.createQuest);
router.patch('/:id/complete', authMiddleware, questController.completeQuest);

module.exports = router;
