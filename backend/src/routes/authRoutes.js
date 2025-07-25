const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const {
  register,
  login,
  refreshToken,
  logout,
} = require("../controllers/authController");

router.post('/register', register);
router.post('/login', login);
router.get('/me', authMiddleware, getMe);
router.get("/refresh", refreshToken);
router.post("/logout", logout);

module.exports = router;