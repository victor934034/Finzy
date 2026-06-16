import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import * as ctrl from '../controllers/businessController.js';

const router = Router();
router.use(authMiddleware);

router.get('/', ctrl.getBusinessEntries);
router.post('/', ctrl.createBusinessEntry);
router.put('/:id', ctrl.updateBusinessEntry);
router.delete('/:id', ctrl.deleteBusinessEntry);
router.get('/report/monthly', ctrl.getMonthlyReport);

export default router;
