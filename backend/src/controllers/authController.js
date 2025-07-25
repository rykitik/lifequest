

require('dotenv').config();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Генерация access token
const generateAccessToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: '15m' }
  );
};

// Генерация refresh token
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: '7d' }
  );
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Регистрация
exports.register = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Проверка: пользователь уже существует?
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(409).json({ message: 'Пользователь уже существует' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ username, password: hashedPassword });

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Сохраняем refresh токен в БД
    user.refreshToken = refreshToken;
    await user.save();

    // Отправка токенов клиенту
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      sameSite: 'Strict',
      secure: true,
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 дней
    });

    res.status(201).json({ accessToken });
  } catch (err) {
    console.error('Ошибка регистрации:', err);
    res.status(500).json({ message: 'Ошибка сервера при регистрации' });
  }
};

// Логин
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Неверный логин или пароль' });
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save();

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      sameSite: 'Strict',
      secure: true,
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({ accessToken });
  } catch (err) {
    console.error('Ошибка входа:', err);
    res.status(500).json({ message: 'Ошибка сервера при входе' });
  }
};

// Обновление access токена по refresh токену
exports.refresh = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) return res.status(401).json({ message: 'Нет токена' });

    const payload = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(payload.userId);

    if (!user || user.refreshToken !== token) {
      return res.status(403).json({ message: 'Неверный токен' });
    }

    const newAccessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    user.refreshToken = newRefreshToken;
    await user.save();

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      sameSite: 'Strict',
      secure: true,
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({ accessToken: newAccessToken });
  } catch (err) {
    console.error('Ошибка обновления токена:', err);
    res.status(403).json({ message: 'Токен невалиден или истёк' });
  }
};

// Выход
exports.logout = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) return res.sendStatus(204);

    const user = await User.findOne({ refreshToken: token });
    if (user) {
      user.refreshToken = null;
      await user.save();
    }

    res.clearCookie('refreshToken', {
      httpOnly: true,
      sameSite: 'Strict',
      secure: true
    });

    res.sendStatus(204);
  } catch (err) {
    console.error('Ошибка выхода:', err);
    res.status(500).json({ message: 'Ошибка сервера при выходе' });
  }
};
