import express from 'express';
import { Invoice } from '../models/invoice';
import { coreApi, validateSignature } from '../midtrans/client';
const router = express.Router();
const CALLBACK_URL = process.env.MIDTRANS_CALLBACK_URL ?? '';
const ENABLE_CALLBACK = CALLBACK_URL !== '';

/**
 * @swagger
 * /core/transaction:
 *   post:
 *     summary: Create a new transaction
 *     description: Memproses transaksi berdasarkan jenis pembayaran seperti bank transfer, gopay, atau qris.
 *     tags:
 *       - Transaction
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - grossAmount
 *               - paymentType
 *             properties:
 *               grossAmount:
 *                 type: number
 *                 example: 50000
 *               paymentType:
 *                 type: string
 *                 enum: [bank_transfer, gopay, qris]
 *                 example: bank_transfer
 *               bankName:
 *                 type: string
 *                 description: Required if paymentType is bank_transfer
 *                 example: bca
 *     responses:
 *       200:
 *         description: Transaksi berhasil dibuat
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 transaction_status:
 *                   type: string
 *                   example: pending
 *                 order_id:
 *                   type: string
 *                   example: order-1716132459000
 *                 payment_type:
 *                   type: string
 *                   example: bank_transfer
 *                 va_numbers:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       bank:
 *                         type: string
 *                         example: bca
 *                       va_number:
 *                         type: string
 *                         example: 1234567890
 *       400:
 *         description: Input tidak valid atau payment type tidak didukung
 *       500:
 *         description: Kesalahan internal dari server atau Midtrans
 */
router.post('/transaction', async (req, res) => {
    try {
        const { bankName, grossAmount, paymentType } = req.body;
        const orderId = `order-${Date.now()}`;

        let payload: any = {
            payment_type: paymentType,
            transaction_details: {
                order_id: orderId,
                gross_amount: grossAmount,
            },
        };

        switch (paymentType) {
            case 'bank_transfer':
                payload.bank_transfer = {
                    bank: bankName ?? 'bca',
                };
                break;

            case 'gopay':
                payload.gopay = {
                    enable_callback: ENABLE_CALLBACK,
                    callback_url: CALLBACK_URL,
                };
                break;

            case 'qris':
                payload.qris = {};
                break;

            default:
                res.status(400).json({ error: 'Unsupported payment type' });
                return;
        }

        const chargeResponse = await coreApi.charge(payload);

        await Invoice.create({
            orderId,
            grossAmount,
            status: chargeResponse.transaction_status,
        });

        res.json(chargeResponse);
    } catch (error: any) {
        const code = +(error.rawHttpClientData?.data?.status_code ?? 500);
        const message = error.rawHttpClientData?.data?.status_message ?? error.message;

        res.status(code).json({ error: message });
    }
});

/**
 * @swagger
 * /core/transaction-status/{orderId}:
 *   get:
 *     summary: Get transaction status
 *     description: Mengambil status transaksi berdasarkan `orderId` dari Midtrans.
 *     tags:
 *       - Transaction
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID unik dari transaksi
 *         example: order-1716132459000
 *     responses:
 *       200:
 *         description: Status transaksi berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 orderId:
 *                   type: string
 *                   example: order-1716132459000
 *                 status:
 *                   type: object
 *                   description: Response asli dari Midtrans
 *       400:
 *         description: Gagal mengambil status transaksi
 */
router.get('/transaction-status/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;
        const status = await coreApi.transaction.status(orderId);
        res.json({ orderId, status });
    } catch (error: any) {
        res.status(400).json({
            message: 'Failed to get status',
            error: error?.ApiResponse ?? error.message,
            httpStatusCode: error?.httpStatusCode,
        });
    }
});

/**
 * @swagger
 * /core/transaction-cancel:
 *   post:
 *     summary: Batalkan transaksi
 *     description: Membatalkan transaksi berdasarkan `orderId` melalui Midtrans.
 *     tags:
 *       - Transaction
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
 *     responses:
 *       200:
 *         description: Transaksi berhasil dibatalkan
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               description: Response dari Midtrans
 *       400:
 *         description: Gagal membatalkan transaksi
 */
router.post('/transaction-cancel', async (req, res) => {
    try {
        const { orderId } = req.body;
        const response = await coreApi.transaction.cancel(orderId);
        res.json(response);
    } catch (error: any) {
        res.status(400).json({
            message: 'Failed to get status',
            error: error?.ApiResponse ?? error.message,
            httpStatusCode: error?.httpStatusCode,
        });
    }
});

/**
 * @swagger
 * /api/core/transaction-expire:
 *   post:
 *     summary: Expire transaksi
 *     description: Menandai transaksi sebagai kadaluarsa berdasarkan `orderId` melalui Midtrans.
 *     tags:
 *       - Transaction
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
 *     responses:
 *       200:
 *         description: Transaksi berhasil di-expire
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               description: Response dari Midtrans
 *       400:
 *         description: Gagal expire transaksi
 */
router.post('/transaction-expire', async (req, res) => {
    try {
        const { orderId } = req.body;
        const response = await coreApi.transaction.expire(orderId);
        res.json(response);
    } catch (error: any) {
        res.status(400).json({
            message: 'Failed to get status',
            error: error?.ApiResponse ?? error.message,
            httpStatusCode: error?.httpStatusCode,
        });
    }
});

/**
 * @swagger
 * /api/core/transaction-callback:
 *   post:
 *     summary: Callback dari Midtrans
 *     description: Endpoint untuk menerima webhook notifikasi dari Midtrans mengenai status transaksi. Signature akan divalidasi sebelum memperbarui status di database.
 *     tags:
 *       - Transaction
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
 *               signature_key:
 *                 type: string
 *                 example: abcd1234signature
 *               status_code:
 *                 type: string
 *                 example: "200"
 *               gross_amount:
 *                 type: string
 *                 example: "5000.00"
 *     responses:
 *       200:
 *         description: Status transaksi berhasil diperbarui
 *       403:
 *         description: Signature tidak valid
 *       404:
 *         description: Transaksi tidak ditemukan
 *       500:
 *         description: Terjadi kesalahan saat memproses callback
 */
router.post('/transaction-callback', async (req, res) => {
    const notif = req.body;
    // console.log('Webhook received:', notif);

    try {
        const orderId = notif.order_id;
        const transactionStatus = notif.transaction_status;

        const validSignature = validateSignature(notif);
        if (!validSignature) {
            res.status(403).json({ message: 'Invalid signature' });
            return;
        }

        const transaction = await Invoice.findOne({ where: { orderId } });
        if (!transaction) {
            res.status(404).json({ message: 'Transaction not found' });
            return;
        }

        transaction.status = transactionStatus;
        await transaction.save();

        res.status(200).json({ message: 'Transaction updated' });
    } catch (error) {
        console.error('Error in transaction callback:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

export default router;