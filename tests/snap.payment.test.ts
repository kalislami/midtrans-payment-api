// test/payment.test.ts
import request from 'supertest';
import app from '../src/app'; // pastikan path-nya sesuai
import { snap } from '../src/midtrans/client';
import { Invoice } from '../src/models/invoice';

jest.mock('../src/midtrans/client', () => ({
    snap: {
        createTransaction: jest.fn(),
    },
}));

jest.mock('../src/models/invoice', () => ({
    Invoice: {
        create: jest.fn(),
        update: jest.fn(),
    },
}));

describe('Payment API', () => {
    const mockOrderId = 'order-001';
    const mockGrossAmount = 10000;
    const endpoint = (param: string) => `/api/snap/${param}`;

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /payment', () => {
        it('should create a transaction and save invoice', async () => {
            const mockSnapResponse = {
                token: 'mock-token',
                redirect_url: 'https://sandbox.midtrans.com/redirect',
            };

            (snap.createTransaction as jest.Mock).mockResolvedValue(mockSnapResponse);
            (Invoice.create as jest.Mock).mockResolvedValue({});

            const res = await request(app)
                .post(endpoint('payment'))
                .send({ orderId: mockOrderId, grossAmount: mockGrossAmount });

            expect(res.status).toBe(200);
            expect(res.body).toEqual({
                token: mockSnapResponse.token,
                redirect_url: mockSnapResponse.redirect_url,
            });

            expect(snap.createTransaction).toHaveBeenCalledWith({
                transaction_details: {
                    order_id: mockOrderId,
                    gross_amount: mockGrossAmount,
                },
            });
            expect(Invoice.create).toHaveBeenCalledWith({
                orderId: mockOrderId,
                grossAmount: mockGrossAmount,
                status: 'pending',
            });
        });

        it('should handle error when creating transaction', async () => {
            (snap.createTransaction as jest.Mock).mockRejectedValue({
                rawHttpClientData: { status: 500 },
                message: 'Create transaction failed',
            });

            const res = await request(app)
                .post(endpoint('payment'))
                .send({ orderId: mockOrderId, grossAmount: mockGrossAmount });

            expect(res.status).toBe(500);
            expect(res.body).toEqual({ error: 'Create transaction failed' });
        });
    });

    describe('POST /payment-callback', () => {
        it('should update invoice status based on callback', async () => {
            (Invoice.update as jest.Mock).mockResolvedValue([1]);

            const res = await request(app)
                .post(endpoint('payment-callback'))
                .send({
                    order_id: mockOrderId,
                    transaction_status: 'settlement',
                });

            expect(res.status).toBe(200);
            expect(Invoice.update).toHaveBeenCalledWith(
                { status: 'settlement' },
                { where: { orderId: mockOrderId } }
            );
        });

        it('should handle error on callback update', async () => {
            (Invoice.update as jest.Mock).mockRejectedValue({
                rawHttpClientData: { status: 500 },
                message: 'DB update error',
            });

            const res = await request(app)
                .post(endpoint('payment-callback'))
                .send({
                    order_id: mockOrderId,
                    transaction_status: 'cancel',
                });

            expect(res.status).toBe(500);
            expect(res.body).toEqual({ error: 'DB update error' });
        });
    });
});
