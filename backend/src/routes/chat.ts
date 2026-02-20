import { Router } from 'express';
import * as chatController from '../controllers/chat';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth';

const router = Router();

// Optional auth: dashboard sends token, widget does not
router.post('/:botId', optionalAuthMiddleware, chatController.chat);

// Protected: dashboard list and get conversation
router.get('/:botId/conversations', authMiddleware, chatController.listConversations);
router.get('/:botId/conversations/:conversationId', authMiddleware, chatController.getConversation);

export default router;
