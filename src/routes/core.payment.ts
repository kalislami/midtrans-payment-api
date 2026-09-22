import { Router } from 'express';
import * as controller from '../controllers/payment.controller';
import { validateRequest } from '../middleware/validate-request';
import { coreTransactionSchema, notificationSchema, orderBodySchema, orderParamsSchema } from '../schemas/payment.schema';

const router = Router();
router.post('/transaction', validateRequest(coreTransactionSchema), controller.createCore);
router.get('/transaction-status/:orderId', validateRequest(orderParamsSchema), controller.status);
router.post('/transaction-cancel', validateRequest(orderBodySchema), controller.cancel);
router.post('/transaction-expire', validateRequest(orderBodySchema), controller.expire);
router.post('/transaction-callback', validateRequest(notificationSchema), controller.callback);
export default router;
