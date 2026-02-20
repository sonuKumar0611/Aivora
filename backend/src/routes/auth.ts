import { Router } from 'express';
import * as authController from '../controllers/auth';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/accept-invite', authController.acceptInvite);
router.get('/me', authMiddleware, authController.me);

export default router;
