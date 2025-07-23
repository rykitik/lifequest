const router = require('express').Router();
const auth = require('../middlewares/authMiddleware');
const Quest = require('../models/Quest');

// GET /api/quests
router.get('/', auth, async (req, res) => {
  const quests = await Quest.find({ user: req.user._id });
  res.json(quests);
});

// POST /api/quests
router.post('/', auth, async (req, res) => {
  const quest = await Quest.create({ ...req.body, user: req.user._id });
  res.json(quest);
});

// PATCH /api/quests/:id/complete
router.patch('/:id/complete', auth, async (req, res) => {
  const quest = await Quest.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { completed: true },
    { new: true }
  );
  if (!quest) return res.status(404).json({ error: 'Quest not found' });
  res.json(quest);
});

module.exports = router;
