import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Middleware для аутентификации и авторизации пользователей
 */
const authMiddleware = async (req, res, next) => {
  // 1. Проверка наличия и формата заголовка Authorization
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      code: 'MISSING_TOKEN',
      message: 'Требуется авторизация: токен не предоставлен'
    });
  }

  // 2. Проверка формата Bearer токена
  const [bearer, token] = authHeader.split(' ');
  if (bearer !== 'Bearer' || !token) {
    return res.status(401).json({
      success: false,
      code: 'INVALID_AUTH_FORMAT',
      message: 'Неверный формат авторизации. Используйте: Bearer <token>'
    });
  }

  try {
    // 3. Верификация токена
      if (!token || token === 'null' || token === 'undefined') {
        return res.status(401).json({
          success: false,
          code: 'INVALID_TOKEN',
          message: 'Токен не предоставлен'
        });
      }

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, {
      ignoreExpiration: false // Явно отключаем игнорирование истечения срока
    });

    // 4. Поиск пользователя в базе данных
    const user = await User.findById(decoded.userId)
      .select('-password -refreshToken -__v -createdAt -updatedAt');

    if (!user) {
      return res.status(404).json({
        success: false,
        code: 'USER_NOT_FOUND',
        message: 'Пользователь не найден'
      });
    }

    // 5. Проверка отозванных токенов (если реализована система отзыва)
    if (user.tokenIssuedAt && decoded.iat < Math.floor(user.tokenIssuedAt.getTime() / 1000)) {
      return res.status(401).json({
        success: false,
        code: 'TOKEN_REVOKED',
        message: 'Токен был отозван'
      });
    }

    // 6. Проверка активного статуса пользователя
    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        code: 'ACCOUNT_INACTIVE',
        message: 'Учетная запись неактивна'
      });
    }

    // 7. Добавляем пользователя в объект запроса
    req.user = {
      id: user._id,
      email: user.email,
      username: user.username,
      // Другие необходимые поля role: user.role,
    };

    // 8. Передаем управление следующему middleware/контроллеру
    next();

  } catch (err) {
    // Детальная обработка ошибок верификации токена
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        code: 'TOKEN_EXPIRED',
        message: 'Токен истёк',
        expiredAt: err.expiredAt
      });
    }
    
    console.error('[AUTH] Ошибка верификации:', err);
    return res.status(401).json({
      success: false,
      code: 'AUTH_FAILED',
      message: 'Ошибка аутентификации'
    });

    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        code: 'INVALID_TOKEN',
        message: 'Недействительный токен'
      });
    }

    // Логирование непредвиденных ошибок
    console.error('[AuthMiddleware] Unexpected error:', err);
    
    return res.status(500).json({
      success: false,
      code: 'SERVER_ERROR',
      message: 'Внутренняя ошибка сервера'
    });
  }
};

/**
 * Middleware для проверки ролей (дополнительно)
 */
// export const roleMiddleware = (requiredRoles) => {
//   return (req, res, next) => {
//     if (!requiredRoles.includes(req.user.role)) {
//       return res.status(403).json({
//         success: false,
//         code: 'FORBIDDEN',
//         message: 'Недостаточно прав'
//       });
//     }
//     next();
//   };
// };

export default authMiddleware;