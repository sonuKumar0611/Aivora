import { Router } from 'express';
import * as embedController from '../controllers/embed';

const router = Router();

router.get('/bot/:botId', embedController.getBotInfo);

export default router;
