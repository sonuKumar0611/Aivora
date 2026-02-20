import { Router } from 'express';
import * as botsController from '../controllers/bots';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/', botsController.listBots);
router.post('/', botsController.createBot);
router.get('/:id', botsController.getBot);
router.put('/:id', botsController.updateBot);
router.delete('/:id', botsController.deleteBot);

export default router;
