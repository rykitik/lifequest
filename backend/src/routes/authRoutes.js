import express from 'express';
import { login, refresh, register, logout } from '../controllers/authController.js';

const router = express.Router();

router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.post('/register', register)

export default router;