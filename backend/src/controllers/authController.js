import jwt from 'jsonwebtoken';
import User from '../models/User.js';
// import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

const generateAccessToken = (userId) => {
  return jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
};

const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
};

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;

export const me = async (req, res) => {
  try {
    // Получаем токен из заголовка Authorization
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Токен не предоставлен' });
    }

    // Верифицируем токен
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(403).json({ message: 'Недействительный токен' });
      }

      // Находим пользователя по ID из токена
      const user = await User.findById(decoded.userId).select('-password');
      
      if (!user) {
        return res.status(404).json({ message: 'Пользователь не найден' });
      }

      // Возвращаем данные пользователя
      res.json({
        id: user._id,
        username: user.username,
        email: user.email,
        // Добавьте другие необходимые поля
      });
    });
  } catch (error) {
    console.error('Ошибка в /auth/me:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Проверка на существующего пользователя
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Пользователь уже существует' });
    }

    // Создание нового пользователя
    const user = new User({
      username,
      email,
      password
    });

    await user.save();

    // Генерация токенов
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Установка refresh токена в куки
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
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

  // Проверка наличия секретных ключей
  if (!ACCESS_TOKEN_SECRET || !REFRESH_TOKEN_SECRET) {
    console.error('JWT секреты не настроены!');
    return res.status(500).json({ message: 'Ошибка сервера' });
  }

  // 1. Валидация входных данных
  if (!email || !password) {
    return res.status(400).json({ message: 'Email и пароль обязательны.' });
  }

  try {
    // 2. Поиск пользователя с паролем и refresh токеном
    const user = await User.findOne({ email }).select('+password +refreshToken');
    if (!user) return res.status(401).json({ message: 'Неверный email или пароль.' });

    // 3. Проверка пароля
    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Неверный email или пароль.' });

    // 4. Генерация access и refresh токенов
    const accessToken = jwt.sign(
      { userId: user._id },
      ACCESS_TOKEN_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user._id },
      REFRESH_TOKEN_SECRET,
      { expiresIn: '7d' }
    );

    // 5. Сохраняем refresh токен в базу
    user.refreshToken = refreshToken;
    user.tokenIssuedAt = Date.now();
    await user.save();

    // 6. Отправляем access-токен клиенту и httpOnly куку с refresh токеном
    res
      .cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 дней
      })
      .status(200)
      .json({
        accessToken,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          xp: user.xp,
          level: user.level,
          progress: user.progress,
          createdAt: user.createdAt
        }
      });

  } catch (err) {
    console.error('Ошибка при логине:', err);
    res.status(500).json({ message: 'Ошибка сервера при попытке входа.' });
  }
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