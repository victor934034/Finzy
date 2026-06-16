import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { list, create, update, remove, addProgress } from '../controllers/metasController.js';

const router = Router();
router.use(authMiddleware);

router.get('/', list);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);
router.post('/:id/progress', addProgress);

export default router;
