import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import * as ctrl from '../controllers/analyticsController.js';

const router = Router();
router.use(authMiddleware);

router.get('/trends', ctrl.getTrends);
router.get('/categories', ctrl.getCategories);
router.get('/forecast', ctrl.getForecast);

export default router;
