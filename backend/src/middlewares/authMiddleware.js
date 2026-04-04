import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const authMiddleware = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization;

    if (!authorization?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Access token is missing' });
    }

    const token = authorization.split(' ')[1];
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ message: 'Account is not active' });
    }

    req.user = user;
    req.userId = user._id.toString();

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ message: 'Access token is invalid or expired' });
  }
};

export default authMiddleware;
