import Quest from '../models/Quest.js';

export const getAllQuests = async (req, res) => {
  try {
    const quests = await Quest.find({ userId: req.userId });
    res.json(quests);
  } catch (err) {
    console.error('Ошибка при загрузке квестов:', err);
    res.status(500).json({ message: 'Ошибка загрузки квестов' });
  }
};

export const createQuest = async (req, res) => {
  try {
    const quest = new Quest({ ...req.body, userId: req.userId });
    await quest.save();
    res.status(201).json(quest);
  } catch (err) {
    console.error('Ошибка при создании квеста:', err);
    res.status(500).json({ message: 'Ошибка создания квеста' });
  }
};

export const completeQuest = async (req, res) => {
  try {
    const quest = await Quest.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { completed: true },
      { new: true }
    );
    if (!quest) return res.status(404).json({ message: 'Квест не найден' });
    res.json(quest);
  } catch (err) {
    console.error('Ошибка при завершении квеста:', err);
    res.status(500).json({ message: 'Ошибка завершения квеста' });
  }
};