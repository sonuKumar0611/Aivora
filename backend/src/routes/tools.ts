import { Router } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth';
import * as toolsController from '../controllers/tools';

const router = Router();

router.use(authMiddleware);
router.use(requireRole(['owner', 'admin']));

router.get('/', toolsController.listTools);
router.post('/', toolsController.createTool);
router.get('/:id', toolsController.getTool);
router.put('/:id', toolsController.updateTool);
router.delete('/:id', toolsController.deleteTool);

export default router;
