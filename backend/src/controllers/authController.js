const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

// Регистрация
exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) 
      return res.status(400).json({ message: 'Все поля обязательны' });

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: 'Пользователь с таким email уже существует' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({ username, email, password: hashedPassword });
    await user.save();

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        xp: user.xp,
        level: user.level,
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

// Логин
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) 
      return res.status(400).json({ message: 'Email и пароль обязательны' });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: 'Неверный email или пароль' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: 'Неверный email или пароль' });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        xp: user.xp,
        level: user.level,
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

// Получить текущего пользователя (по токену)
exports.getMe = async (req, res) => {
  try {
    const userId = req.userId; // выставляется в middleware authMiddleware
    const user = await User.findById(userId).select('-password');
    if (!user) return res.status(404).json({ message: 'Пользователь не найден' });

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};
