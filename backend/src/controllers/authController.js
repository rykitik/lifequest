require('dotenv').config();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Генерация access token
const generateAccessToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '15m' });
};

// Генерация refresh token — используем ту же переменную окружения REFRESH_TOKEN_SECRET для консистентности
const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '30d' });
};

exports.generateAccessToken = generateAccessToken;
exports.generateRefreshToken = generateRefreshToken;

// Получить данные текущего пользователя (без пароля)
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Регистрация нового пользователя
exports.register = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Проверка: пользователь уже существует?
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'Пользователь с таким email уже существует' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: hashedPassword });

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Сохраняем refresh токен в БД пользователя
    user.refreshToken = refreshToken;
    await user.save();

    // Отправляем refresh токен в httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      sameSite: 'Strict',
      secure: true, // ставь true если HTTPS, иначе false для локальной разработки
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 дней
    });

    // Отправляем access токен в теле ответа
    res.status(201).json({ accessToken });
  } catch (err) {
    console.error('Ошибка регистрации:', err);
    res.status(500).json({ message: 'Ошибка сервера при регистрации' });
  }
};

// Логин пользователя
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Неверный логин или пароль' });
    }

    // остальной код для генерации токенов
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

    // Проверяем валидность refresh токена
    const payload = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);

    // Ищем пользователя с таким refresh токеном
    const user = await User.findById(payload.id);
    if (!user || user.refreshToken !== token) {
      return res.status(403).json({ message: 'Неверный токен' });
    }

    // Генерируем новые токены
    const newAccessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    user.refreshToken = newRefreshToken;
    await user.save();

    // Отправляем обновленный refresh токен в куках
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      sameSite: 'Strict',
      secure: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.json({ accessToken: newAccessToken });
  } catch (err) {
    console.error('Ошибка обновления токена:', err);
    res.status(403).json({ message: 'Токен невалиден или истёк' });
  }
};

// Выход пользователя (удаляем refresh токен из БД и куки)
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
      secure: true,
    });

    res.sendStatus(204);
  } catch (err) {
    console.error('Ошибка выхода:', err);
    res.status(500).json({ message: 'Ошибка сервера при выходе' });
  }
};
