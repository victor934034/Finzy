import { Router } from 'express';
import multer from 'multer';
import { authMiddleware } from '../middleware/auth.js';
import * as ctrl from '../controllers/integrationsController.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// OAuth callback — Google redirects here without JWT
router.get('/gmail/callback', ctrl.gmailCallback);

router.use(authMiddleware);

// Gmail
router.get('/gmail/auth-url', ctrl.gmailAuthUrl);
router.get('/gmail/status', ctrl.gmailStatus);
router.post('/gmail/sync', ctrl.gmailSync);
router.delete('/gmail', ctrl.gmailDisconnect);

// Pluggy
router.get('/pluggy/connect-token', ctrl.pluggyConnectToken);
router.post('/pluggy/item', ctrl.pluggySaveItem);
router.get('/pluggy/status', ctrl.pluggyStatus);
router.get('/pluggy/balances', ctrl.pluggyBalances);
router.post('/pluggy/sync', ctrl.pluggySync);
router.delete('/pluggy/item', ctrl.pluggyRemoveItem);

// File import
router.post('/import/preview', upload.single('file'), ctrl.importPreview);
router.post('/import/confirm', ctrl.importConfirm);

export default router;
