import express from 'express';
import { AuthController } from '../controllers/authController.js';
import { isAuthenticated } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/logout', isAuthenticated, AuthController.logout);

router.post('/password/forgot', AuthController.forgotPassword);
router.post('/password/reset/:token', AuthController.resetPassword);

// Get current user info (for authentication check)
router.get('/me', isAuthenticated, AuthController.getMe);

export default router;
