const express = require('express');
const router = express.Router();
const { getQuests, createQuest, completeQuest } = require('../controllers/questController');
const auth = require('../middlewares/authMiddleware');

router.get('/', auth, getQuests);
router.post('/', auth, createQuest);
router.patch('/:id/complete', auth, completeQuest);

module.exports = router;
