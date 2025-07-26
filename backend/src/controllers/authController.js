import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';

const generateAccessToken = (userId) => {
  return jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
};

const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
};

export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Проверка на существующего пользователя
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Пользователь уже существует' });
    }

    // Хеширование пароля
    const hashedPassword = await bcrypt.hash(password, 10);

    // Создание нового пользователя
    const user = new User({
      username,
      email,
      password: hashedPassword
    });

    await user.save();

    // Генерация токенов
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Установка refresh токена в куки
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'Strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Отправка access токена
    res.status(201).json({ 
      accessToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Ошибка регистрации:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: 'Неверные данные' });
  }

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'Strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({ 
    accessToken,
    user: {
      id: user._id,
      username: user.username,
      email: user.email
    }
  });
};

export const refresh = (req, res) => {
  const token = req.cookies.refreshToken;

  if (!token) return res.status(401).json({ message: 'Нет токена' });

  jwt.verify(token, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: 'Недействительный refresh' });

    const accessToken = generateAccessToken(decoded.userId);
    res.json({ accessToken });
  });
};

export const logout = (req, res) => {
  res.clearCookie('refreshToken');
  res.status(200).json({ message: 'Выход' });
};