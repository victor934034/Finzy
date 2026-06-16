import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import * as ctrl from '../controllers/investmentsController.js';

const router = Router();
router.use(authMiddleware);

router.get('/', ctrl.getInvestments);
router.post('/', ctrl.createInvestment);
router.put('/:id', ctrl.updateInvestment);
router.delete('/:id', ctrl.deleteInvestment);

export default router;
