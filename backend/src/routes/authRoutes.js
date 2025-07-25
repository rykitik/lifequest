const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

// Роуты
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/refresh', authController.refresh);
router.get('/logout', authController.logout);
router.get('/me', authMiddleware, authController.getMe);

module.exports = router;
