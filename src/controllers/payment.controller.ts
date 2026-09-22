import { Request, Response } from 'express';
import * as payment from '../services/payment.service';

export async function createCore(req: Request, res: Response) { res.json(await payment.createCoreTransaction(req.body)); }
export async function createSnap(req: Request, res: Response) {
  const { orderId, grossAmount } = req.body;
  res.json(await payment.createSnapTransaction(orderId, grossAmount));
}
export async function status(req: Request, res: Response) {
  const { orderId } = req.params;
  res.json({ orderId, status: await payment.getStatus(orderId) });
}
export async function cancel(req: Request, res: Response) { res.json(await payment.cancelTransaction(req.body.orderId)); }
export async function expire(req: Request, res: Response) { res.json(await payment.expireTransaction(req.body.orderId)); }
export async function callback(req: Request, res: Response) { res.json(await payment.processNotification(req.body)); }
