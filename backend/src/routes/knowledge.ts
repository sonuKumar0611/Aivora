import { Router } from 'express';
import * as knowledgeController from '../controllers/knowledge';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.post('/upload', knowledgeController.uploadMiddleware, knowledgeController.uploadKnowledge);
router.get('/:botId', knowledgeController.listKnowledge);
router.delete('/:botId/source/:sourceId', knowledgeController.deleteKnowledgeSource);

export default router;
