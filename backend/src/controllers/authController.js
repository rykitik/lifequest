import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const ACCESS_TOKEN_EXPIRES_IN = '15m';
const REFRESH_TOKEN_EXPIRES_IN = '7d';
const REFRESH_COOKIE_NAME = 'refreshToken';
const REFRESH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

const createAccessToken = (userId) =>
  jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
  });

const createRefreshToken = (userId) =>
  jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
  });

const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: REFRESH_COOKIE_MAX_AGE,
  path: '/api/auth',
});

const getClearCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  path: '/api/auth',
});

const formatUser = (user) => ({
  id: user._id.toString(),
  username: user.username,
  email: user.email,
  xp: user.xp,
  level: user.level,
  status: user.status,
});

const sendAuthResponse = async (res, user, statusCode = 200) => {
  const accessToken = createAccessToken(user._id);
  const refreshToken = createRefreshToken(user._id);

  user.refreshToken = refreshToken;
  user.tokenIssuedAt = new Date();
  user.lastActive = new Date();
  await user.save();

  res
    .cookie(REFRESH_COOKIE_NAME, refreshToken, getCookieOptions())
    .status(statusCode)
    .json({
      accessToken,
      user: formatUser(user),
    });
};

export const register = async (req, res) => {
  try {
    const username = req.body.username?.trim();
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email, and password are required' });
    }

    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(409).json({ message: 'User with this email or username already exists' });
    }

    const user = await User.create({
      username,
      email,
      password,
    });

    await sendAuthResponse(res, user, 201);
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const login = async (req, res) => {
  try {
    const identifier = req.body.identifier?.trim() || req.body.email?.trim();
    const password = req.body.password;

    if (!identifier || !password) {
      return res.status(400).json({ message: 'Email or username and password are required' });
    }

    const normalizedIdentifier = identifier.toLowerCase();
    const user = await User.findOne({
      $or: [{ email: normalizedIdentifier }, { username: identifier }],
    }).select('+password +refreshToken');

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ message: 'Account is not active' });
    }

    await sendAuthResponse(res, user);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const me = async (req, res) => {
  res.status(200).json({ user: formatUser(req.user) });
};

export const refresh = async (req, res) => {
  try {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];

    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token is missing' });
    }

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(decoded.userId).select('+refreshToken');

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({ message: 'Refresh token is invalid' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ message: 'Account is not active' });
    }

    await sendAuthResponse(res, user);
  } catch (error) {
    console.error('Refresh error:', error);
    res.status(403).json({ message: 'Refresh token is invalid or expired' });
  }
};

export const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];

    if (refreshToken) {
      const user = await User.findOne({ refreshToken }).select('+refreshToken');

      if (user) {
        user.refreshToken = undefined;
        await user.save();
      }
    }

    res
      .clearCookie(REFRESH_COOKIE_NAME, getClearCookieOptions())
      .status(200)
      .json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
