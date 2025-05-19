import express from 'express';
import { Invoice } from '../models/invoice';
import { snap } from '../midtrans/client';

const router = express.Router();

/**
 * @swagger
 * /api/snap/payment:
 *   post:
 *     summary: Buat transaksi Midtrans menggunakan Snap
 *     description: Menginisiasi transaksi menggunakan Midtrans Snap dan menghasilkan token pembayaran serta URL redirect.
 *     tags:
 *       - Payment
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orderId:
 *                 type: string
 *                 example: order-1716132459000
 *               grossAmount:
 *                 type: number
 *                 example: 10000
 *     responses:
 *       200:
 *         description: Token Snap dan URL redirect berhasil dibuat
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   example: abc123-token
 *                 redirect_url:
 *                   type: string
 *                   example: https://app.sandbox.midtrans.com/snap/v2/vtweb/abc123
 *       400:
 *         description: Permintaan tidak valid
 *       500:
 *         description: Terjadi kesalahan saat membuat transaksi
 */
router.post('/payment', async (req, res) => {
  const { orderId, grossAmount } = req.body;

  try {
    const transaction = await snap.createTransaction({
      transaction_details: {
        order_id: orderId,
        gross_amount: grossAmount,
      },
    });

    await Invoice.create({ orderId, grossAmount, status: 'pending' });

    res.json({
      token: transaction.token,
      redirect_url: transaction.redirect_url,
    });
  } catch (error: any) {
    const code = error.rawHttpClientData?.status ?? 500;
    const message = error.ApiResponse?.error_messages?.join(', ') ?? error.message;

    res.status(code).json({ error: message });
  }
});

/**
 * @swagger
 * /api/snap/payment-callback:
 *   post:
 *     summary: Webhook callback dari Midtrans Snap
 *     description: Endpoint untuk menerima notifikasi status pembayaran dari Midtrans Snap dan memperbarui status transaksi di database.
 *     tags:
 *       - Payment
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               order_id:
 *                 type: string
 *                 example: order-1716132459000
 *               transaction_status:
 *                 type: string
 *                 example: settlement
 *     responses:
 *       200:
 *         description: Status transaksi berhasil diperbarui
 *       400:
 *         description: Permintaan tidak valid
 *       500:
 *         description: Terjadi kesalahan saat memproses callback
 */

router.post('/payment-callback', async (req, res) => {
  const notification = req.body;

  // console.log('/payment-callback payload: ', notification);
  const { order_id, transaction_status } = notification;

  try {
    await Invoice.update(
      { status: transaction_status },
      { where: { orderId: order_id } }
    );
    res.sendStatus(200);
  } catch (error: any) {
    const code = error.rawHttpClientData?.status ?? 500;
    const message = error.ApiResponse?.error_messages?.join(', ') ?? error.message;

    res.status(code).json({ error: message });
  }
});

export default router;
