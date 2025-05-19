import midtransClient from 'midtrans-client';
import crypto from 'crypto';

const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY ?? '';
const MIDTRANS_CLIENT_KEY = process.env.MIDTRANS_CLIENT_KEY ?? '';
const IS_PRODUCTION = process.env.MIDTRANS_ENV === 'production';

const args = {
  isProduction: IS_PRODUCTION,
  serverKey: MIDTRANS_SERVER_KEY,
  clientKey: MIDTRANS_CLIENT_KEY,
}

export const snap = new midtransClient.Snap(args);
export const coreApi = new midtransClient.CoreApi(args);

export const validateSignature = (notif: any) => {
  const { order_id, status_code, gross_amount, signature_key } = notif;

  const input = order_id + status_code + gross_amount + MIDTRANS_SERVER_KEY;
  const expectedSignature = crypto.createHash('sha512').update(input).digest('hex');

  if (signature_key !== expectedSignature) {
    return false;
  }

  return true;
}