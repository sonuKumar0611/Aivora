import { Router } from 'express';
import * as analyticsController from '../controllers/analytics';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);
router.get('/:botId', analyticsController.getAnalytics);

export default router;
