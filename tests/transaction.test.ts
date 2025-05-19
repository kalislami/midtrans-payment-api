import request from 'supertest';
import app from '../src/app';
import { coreApi } from '../src/midtrans/client';
import { Invoice } from '../src/models/invoice';

jest.mock('../src/midtrans/client', () => ({
    coreApi: {
        charge: jest.fn(),
    },
}));

jest.mock('../src/models/invoice', () => ({
    Invoice: {
        create: jest.fn(),
    },
}));

describe('POST /transaction', () => {
    const endpoint = '/api/core/transaction'
    it('should create a bank transfer transaction', async () => {
        const mockResponse = {
            transaction_status: 'pending',
            transaction_id: 'abc123',
            redirect_url: 'https://midtrans.com/redirect',
        };

        (coreApi.charge as jest.Mock).mockResolvedValue(mockResponse);
        (Invoice.create as jest.Mock).mockResolvedValue({});

        const res = await request(app).post(endpoint).send({
            bankName: 'bca',
            grossAmount: 10000,
            paymentType: 'bank_transfer',
        });

        expect(res.status).toBe(200);
        expect(res.body.transaction_status).toBe('pending');
        expect(coreApi.charge).toHaveBeenCalled();
        expect(Invoice.create).toHaveBeenCalled();
    });

    it('should return 400 for unsupported payment type', async () => {
        const res = await request(app).post(endpoint).send({
            grossAmount: 10000,
            paymentType: 'unsupported_type',
        });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Unsupported payment type');
    });

    it('should handle coreApi error', async () => {
        (coreApi.charge as jest.Mock).mockRejectedValue({
            rawHttpClientData: {
                data: {
                    status_code: '400',
                    status_message: 'Invalid request',
                },
            },
        });

        const res = await request(app).post(endpoint).send({
            bankName: 'bca',
            grossAmount: 10000,
            paymentType: 'bank_transfer',
        });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Invalid request');
    });
});
