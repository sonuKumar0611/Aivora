import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import * as settingsController from '../controllers/settings';

const router = Router();

router.use(authMiddleware);

router.get('/organization', settingsController.getOrganization);
router.put('/organization', settingsController.updateOrganization);

router.get('/profile', settingsController.getProfile);
router.put('/profile', settingsController.updateProfile);
router.post('/profile/change-password', settingsController.changePassword);

router.get('/api-keys', settingsController.listApiKeys);
router.post('/api-keys', settingsController.createApiKey);
router.delete('/api-keys/:id', settingsController.deleteApiKey);

router.get('/team', settingsController.listTeamMembers);
router.post('/team', settingsController.inviteMember);
router.post('/team/:id/resend-invite', settingsController.resendInvite);
router.put('/team/:id', settingsController.updateMember);
router.delete('/team/:id', settingsController.removeOrSuspendMember);

export default router;
