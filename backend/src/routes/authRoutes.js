import express from 'express';
import { login, refresh, logout } from '../controllers/authController.js';

const router = express.Router();

router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.post('/resgister', register)

export default router;