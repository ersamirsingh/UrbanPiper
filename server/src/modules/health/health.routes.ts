import { Router } from 'express';
import { HealthController } from './health.controller.js';

const router = Router();

router.get('/', HealthController.getPublicHealth);
router.get('/detailed', HealthController.getDetailedHealth);

export default router;
