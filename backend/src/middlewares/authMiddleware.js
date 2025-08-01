import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Токен не предоставлен' });
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    // Временное решение - пока не проверяем статус
    // if (user.status !== 'active') {
    //   return res.status(403).json({ message: 'Учетная запись неактивна' });
    // }

    req.user = {
      id: user._id,
      email: user.email,
      username: user.username
    };

    next();
  } catch (err) {
    console.error('Ошибка аутентификации:', err);
    res.status(401).json({ message: 'Недействительный токен' });
  }
};

export default authMiddleware;