import request from 'supertest';
import app from '../src/app';
import { Invoice } from '../src/models/invoice';
import crypto from 'crypto';

const SERVER_KEY = process.env.MIDTRANS_SERVER_KEY || 'dummy-server-key';

describe('POST /transaction-callback', () => {
    const mockTransaction = {
        id: 1,
        orderId: 'order-001',
        status: 'pending',
        grossAmount: 25000,
        save: jest.fn(),
    };
    const endpoint = '/api/core/transaction-callback';

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should update transaction if signature is valid', async () => {
        const signature = crypto.createHash('sha512')
            .update(`${mockTransaction.orderId}200${mockTransaction.grossAmount}${SERVER_KEY}`)
            .digest('hex');

        jest.spyOn(Invoice, 'findOne').mockResolvedValue(mockTransaction as any);

        const res = await request(app)
            .post(endpoint)
            .send({
                order_id: mockTransaction.orderId,
                status_code: '200',
                gross_amount: `${mockTransaction.grossAmount}`,
                signature_key: signature,
                transaction_status: 'settlement',
            });

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Transaction updated');
        expect(mockTransaction.status).toBe('settlement');
        expect(mockTransaction.save).toHaveBeenCalled();
    });

    it('should reject invalid signature', async () => {
        const res = await request(app)
            .post(endpoint)
            .send({
                order_id: 'order-001',
                status_code: '200',
                gross_amount: '25000',
                signature_key: 'invalid-signature',
                transaction_status: 'settlement',
            });

        expect(res.status).toBe(403);
        expect(res.body.message).toBe('Invalid signature');
    });

    it('should return 404 if transaction not found', async () => {
        const signature = crypto.createHash('sha512')
            .update(`order-99920025000${SERVER_KEY}`)
            .digest('hex');

        jest.spyOn(Invoice, 'findOne').mockResolvedValue(null);

        const res = await request(app)
            .post(endpoint)
            .send({
                order_id: 'order-999',
                status_code: '200',
                gross_amount: '25000',
                signature_key: signature,
                transaction_status: 'settlement',
            });

        expect(res.status).toBe(404);
        expect(res.body.message).toBe('Transaction not found');
    });
});
