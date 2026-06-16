import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { list, markRead, markAllRead, remove } from '../controllers/notificacoesController.js';

const router = Router();
router.use(authMiddleware);

router.get('/', list);
router.patch('/:id/read', markRead);
router.patch('/read-all', markAllRead);
router.delete('/:id', remove);

export default router;
