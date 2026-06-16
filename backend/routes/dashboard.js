import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import * as ctrl from '../controllers/dashboardController.js';

const router = Router();
router.use(authMiddleware);

router.get('/summary', ctrl.getSummary);
router.get('/chart/monthly', ctrl.getMonthlyChart);

export default router;
