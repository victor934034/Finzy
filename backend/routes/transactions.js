import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import * as ctrl from '../controllers/transactionsController.js';

const router = Router();
router.use(authMiddleware);

router.get('/', ctrl.getTransactions);
router.post('/', ctrl.createTransaction);
router.put('/:id', ctrl.updateTransaction);
router.delete('/:id', ctrl.deleteTransaction);
router.get('/summary/monthly', ctrl.getMonthlySummary);

export default router;
