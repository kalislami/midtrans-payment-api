import 'dotenv/config';
import midtransClient from 'midtrans-client';
import crypto from 'crypto';

const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY ?? '';
const MIDTRANS_CLIENT_KEY = process.env.MIDTRANS_CLIENT_KEY ?? '';
const IS_PRODUCTION = process.env.MIDTRANS_IS_PRODUCTION === 'true' || process.env.MIDTRANS_ENV === 'production';

const args = {
  isProduction: IS_PRODUCTION,
  serverKey: MIDTRANS_SERVER_KEY,
  clientKey: MIDTRANS_CLIENT_KEY,
}

export const snap = new midtransClient.Snap(args);
export const coreApi = new midtransClient.CoreApi(args);

export interface Notification {
  order_id: string;
  status_code: string;
  gross_amount: string;
  signature_key: string;
  transaction_status: string;
}

export const validateSignature = (notif: Notification): boolean => {
  const { order_id, status_code, gross_amount, signature_key } = notif;
  if (!MIDTRANS_SERVER_KEY || !/^[a-f0-9]{128}$/i.test(signature_key)) return false;
  const input = order_id + status_code + gross_amount + MIDTRANS_SERVER_KEY;
  const expectedSignature = crypto.createHash('sha512').update(input).digest();
  const suppliedSignature = Buffer.from(signature_key, 'hex');
  return suppliedSignature.length === expectedSignature.length && crypto.timingSafeEqual(suppliedSignature, expectedSignature);
}
