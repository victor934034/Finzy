import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import * as ctrl from '../controllers/aiController.js';

const router = Router();

router.get('/providers', ctrl.getProviders);

router.use(authMiddleware);

router.post('/chat', ctrl.chat);
router.post('/categorize', ctrl.categorize);
router.get('/insight/dashboard', ctrl.getDashboardInsight);
router.get('/insight/investments', ctrl.getInvestmentsInsight);
router.get('/insight/business', ctrl.getBusinessInsight);
router.get('/cashflow/predict', ctrl.predictCashFlow);

export default router;
