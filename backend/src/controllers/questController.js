const Quest = require('../models/Quest');
const User = require('../models/User');
const { addXP } = require('../services/levelService');

exports.getQuests = async (req, res) => {
  const quests = await Quest.find({ user: req.userId });
  res.json(quests);
};

exports.createQuest = async (req, res) => {
  const quest = await Quest.create({ ...req.body, user: req.userId });
  res.status(201).json(quest);
};

exports.completeQuest = async (req, res) => {
  const quest = await Quest.findById(req.params.id);
  if (!quest || quest.user.toString() !== req.userId) {
    return res.status(404).json({ error: 'Quest not found' });
  }

  quest.completed = true;
  await quest.save();

  const user = await User.findById(req.userId);
  await addXP(user, quest.xpReward);

  res.json({ message: 'Quest completed', xpGained: quest.xpReward });
};