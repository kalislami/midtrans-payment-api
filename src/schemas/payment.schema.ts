import { z } from 'zod';

const amount = z.number().int().positive();
const orderId = z.string().trim().min(1).max(255);
const bankName = z.enum(['bca', 'bni', 'bri', 'permata']);

export const coreTransactionSchema = z.object({ body: z.discriminatedUnion('paymentType', [
  z.object({ paymentType: z.literal('bank_transfer'), grossAmount: amount, bankName: bankName.optional() }),
  z.object({ paymentType: z.literal('gopay'), grossAmount: amount }),
  z.object({ paymentType: z.literal('qris'), grossAmount: amount }),
]) });
export const snapTransactionSchema = z.object({ body: z.object({ orderId, grossAmount: amount }) });
export const orderBodySchema = z.object({ body: z.object({ orderId }) });
export const orderParamsSchema = z.object({ params: z.object({ orderId }) });
export const notificationSchema = z.object({ body: z.object({
  order_id: orderId,
  status_code: z.string().min(1),
  gross_amount: z.string().regex(/^\d+(?:\.\d{1,2})?$/),
  signature_key: z.string().min(1),
  transaction_status: z.string().min(1),
}) });
