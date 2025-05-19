import request from 'supertest';
import app from '../src/app';
import { coreApi } from '../src/midtrans/client';

jest.mock('../src/midtrans/client', () => ({
    coreApi: {
        transaction: {
            status: jest.fn(),
            cancel: jest.fn(),
            expire: jest.fn(),
        },
    },
}));

describe('Transaction Status APIs', () => {
    const mockOrderId = 'order-123';
    const endpoint = (param: string) => `/api/core/${param}`;

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /transaction-status/:orderId', () => {
        it('should return transaction status successfully', async () => {
            const mockStatus = { transaction_status: 'settlement' };
            (coreApi.transaction.status as jest.Mock).mockResolvedValue(mockStatus);

            const res = await request(app).get(endpoint(`transaction-status/${mockOrderId}`));

            expect(res.status).toBe(200);
            expect(res.body).toEqual({ orderId: mockOrderId, status: mockStatus });
            expect(coreApi.transaction.status).toHaveBeenCalledWith(mockOrderId);
        });

        it('should handle error in transaction status', async () => {
            (coreApi.transaction.status as jest.Mock).mockRejectedValue({
                ApiResponse: 'Not Found',
                httpStatusCode: 400,
            });

            const res = await request(app).get(endpoint(`transaction-status/${mockOrderId}`));

            expect(res.status).toBe(400);
            expect(res.body.message).toBe('Failed to get status');
            expect(res.body.error).toBe('Not Found');
        });
    });

    describe('POST /transaction-cancel', () => {
        it('should cancel transaction successfully', async () => {
            const mockResponse = { status: 'cancelled' };
            (coreApi.transaction.cancel as jest.Mock).mockResolvedValue(mockResponse);

            const res = await request(app)
                .post(endpoint('transaction-cancel'))
                .send({ orderId: mockOrderId });

            expect(res.status).toBe(200);
            expect(res.body).toEqual(mockResponse);
            expect(coreApi.transaction.cancel).toHaveBeenCalledWith(mockOrderId);
        });

        it('should handle error in canceling transaction', async () => {
            (coreApi.transaction.cancel as jest.Mock).mockRejectedValue({
                ApiResponse: 'Cancel Error',
                httpStatusCode: 400,
            });

            const res = await request(app)
                .post(endpoint('transaction-cancel'))
                .send({ orderId: mockOrderId });

            expect(res.status).toBe(400);
            expect(res.body.message).toBe('Failed to get status');
            expect(res.body.error).toBe('Cancel Error');
        });
    });

    describe('POST /transaction-expire', () => {
        it('should expire transaction successfully', async () => {
            const mockResponse = { status: 'expired' };
            (coreApi.transaction.expire as jest.Mock).mockResolvedValue(mockResponse);

            const res = await request(app)
                .post(endpoint('transaction-expire'))
                .send({ orderId: mockOrderId });

            expect(res.status).toBe(200);
            expect(res.body).toEqual(mockResponse);
            expect(coreApi.transaction.expire).toHaveBeenCalledWith(mockOrderId);
        });

        it('should handle error in expiring transaction', async () => {
            (coreApi.transaction.expire as jest.Mock).mockRejectedValue({
                ApiResponse: 'Expire Error',
                httpStatusCode: 400,
            });

            const res = await request(app)
                .post(endpoint('transaction-expire'))
                .send({ orderId: mockOrderId });

            expect(res.status).toBe(400);
            expect(res.body.message).toBe('Failed to get status');
            expect(res.body.error).toBe('Expire Error');
        });
    });
});
