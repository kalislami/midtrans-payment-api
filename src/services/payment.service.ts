import { randomUUID } from 'crypto';
import { Invoice } from '../models/invoice';
import { coreApi, snap, validateSignature, Notification } from '../midtrans/client';
import { AppError } from '../middleware/error-handler';

type CoreInput = { grossAmount: number; paymentType: 'bank_transfer' | 'gopay' | 'qris'; bankName?: string };

async function midtransRequest<T>(operation: () => Promise<T>): Promise<T> {
  try { return await operation(); }
  catch (error) {
    const candidate = error as { httpStatusCode?: number; rawHttpClientData?: { status?: number; data?: { status_code?: string } } };
    const status = Number(candidate?.httpStatusCode ?? candidate?.rawHttpClientData?.status ?? candidate?.rawHttpClientData?.data?.status_code);
    if (status === 404) throw new AppError(404, 'TRANSACTION_NOT_FOUND', 'Transaction not found');
    throw new AppError(502, 'MIDTRANS_REQUEST_FAILED', 'Failed to process payment request');
  }
}

export async function createCoreTransaction(input: CoreInput) {
  const orderId = `order-${randomUUID()}`;
  const payload: Record<string, unknown> = {
    payment_type: input.paymentType,
    transaction_details: { order_id: orderId, gross_amount: input.grossAmount },
  };
  if (input.paymentType === 'bank_transfer') payload.bank_transfer = { bank: input.bankName ?? 'bca' };
  if (input.paymentType === 'gopay') {
    const callbackUrl = process.env.MIDTRANS_CALLBACK_URL;
    payload.gopay = { enable_callback: Boolean(callbackUrl), callback_url: callbackUrl ?? '' };
  }
  if (input.paymentType === 'qris') payload.qris = {};
  const response = await midtransRequest(() => coreApi.charge(payload as any));
  await Invoice.create({ orderId, grossAmount: input.grossAmount, status: response.transaction_status });
  return response;
}

export async function createSnapTransaction(orderId: string, grossAmount: number) {
  const response = await midtransRequest(() => snap.createTransaction({
    transaction_details: { order_id: orderId, gross_amount: grossAmount },
  }));
  await Invoice.create({ orderId, grossAmount, status: 'pending' });
  return { token: response.token, redirect_url: response.redirect_url };
}

export const getStatus = (orderId: string) => midtransRequest(() => coreApi.transaction.status(orderId));
export const cancelTransaction = (orderId: string) => midtransRequest(() => coreApi.transaction.cancel(orderId));
export const expireTransaction = (orderId: string) => midtransRequest(() => coreApi.transaction.expire(orderId));

export async function processNotification(notification: Notification) {
  if (!validateSignature(notification)) throw new AppError(403, 'INVALID_SIGNATURE', 'Invalid signature');
  const invoice = await Invoice.findOne({ where: { orderId: notification.order_id } });
  if (!invoice) throw new AppError(404, 'TRANSACTION_NOT_FOUND', 'Transaction not found');
  if (Number(notification.gross_amount) !== invoice.grossAmount) {
    throw new AppError(403, 'INVALID_SIGNATURE', 'Transaction amount mismatch');
  }
  const status = await getStatus(notification.order_id);
  if (status.order_id !== notification.order_id || Number(status.gross_amount) !== invoice.grossAmount) {
    throw new AppError(403, 'INVALID_SIGNATURE', 'Transaction details mismatch');
  }
  if (invoice.status !== status.transaction_status) {
    invoice.status = status.transaction_status;
    await invoice.save();
  }
  return { message: 'Transaction updated' };
}
