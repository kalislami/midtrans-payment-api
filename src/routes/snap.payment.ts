import { Router } from 'express';
import * as controller from '../controllers/payment.controller';
import { validateRequest } from '../middleware/validate-request';
import { notificationSchema, snapTransactionSchema } from '../schemas/payment.schema';

const router = Router();
router.post('/payment', validateRequest(snapTransactionSchema), controller.createSnap);
router.post('/payment-callback', validateRequest(notificationSchema), controller.callback);
export default router;
