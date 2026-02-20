import { Router } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth';
import * as settingsController from '../controllers/settings';

const router = Router();

router.use(authMiddleware);

router.get('/organization', settingsController.getOrganization);
router.put('/organization', settingsController.updateOrganization);

router.get('/profile', settingsController.getProfile);
router.put('/profile', settingsController.updateProfile);
router.patch('/onboarding', settingsController.updateOnboarding);
router.post('/profile/change-password', settingsController.changePassword);

router.get('/api-keys', settingsController.listApiKeys);
router.post('/api-keys', settingsController.createApiKey);
router.delete('/api-keys/:id', settingsController.deleteApiKey);

router.get('/team', settingsController.listTeamMembers);
router.post('/team', settingsController.inviteMember);
router.post('/team/:id/resend-invite', settingsController.resendInvite);
router.put('/team/:id', settingsController.updateMember);
router.delete('/team/:id', settingsController.removeOrSuspendMember);

router.get('/integrations', requireRole(['owner', 'admin']), settingsController.listIntegrations);
router.post('/integrations/:provider/connect', requireRole(['owner', 'admin']), settingsController.connectIntegration);
router.delete('/integrations/:provider/disconnect', requireRole(['owner', 'admin']), settingsController.disconnectIntegration);

export default router;
