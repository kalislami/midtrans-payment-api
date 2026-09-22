import request from 'supertest';
import crypto from 'crypto';
import app from '../src/app';
import { coreApi, snap } from '../src/midtrans/client';
import { Invoice } from '../src/models/invoice';

jest.mock('../src/midtrans/client', () => {
  const actual = jest.requireActual('../src/midtrans/client');
  return {
    ...actual,
    coreApi: { charge: jest.fn(), transaction: { status: jest.fn(), cancel: jest.fn(), expire: jest.fn() } },
    snap: { createTransaction: jest.fn() },
  };
});
jest.mock('../src/models/invoice', () => ({ Invoice: { create: jest.fn(), findOne: jest.fn() } }));

const serverKey = process.env.MIDTRANS_SERVER_KEY ?? '';
const notification = (orderId = 'order-123', amount = '10000.00') => ({
  order_id: orderId, status_code: '200', gross_amount: amount, transaction_status: 'settlement',
  signature_key: crypto.createHash('sha512').update(`${orderId}200${amount}${serverKey}`).digest('hex'),
});

beforeEach(() => jest.clearAllMocks());
beforeEach(() => {
  (coreApi.transaction.status as jest.Mock).mockResolvedValue({
    order_id: 'order-123', gross_amount: '10000.00', transaction_status: 'settlement',
  });
});

describe('create transactions', () => {
  it('creates a Core transaction with a generated order ID', async () => {
    (coreApi.charge as jest.Mock).mockResolvedValue({ transaction_status: 'pending' });
    const response = await request(app).post('/api/core/transaction').send({ grossAmount: 10000, paymentType: 'bank_transfer', bankName: 'bca' });
    expect(response.status).toBe(200);
    expect(Invoice.create).toHaveBeenCalledWith(expect.objectContaining({ grossAmount: 10000, status: 'pending', orderId: expect.stringMatching(/^order-[0-9a-f-]{36}$/) }));
  });
  it.each([{ paymentType: 'bank_transfer' }, { grossAmount: 0, paymentType: 'gopay' }, { grossAmount: 1, paymentType: 'wrong' }, { grossAmount: 1, paymentType: 'bank_transfer', bankName: 'wrong' }])('rejects invalid Core input', async body => {
    const response = await request(app).post('/api/core/transaction').send(body);
    expect(response.status).toBe(400);
    expect(coreApi.charge).not.toHaveBeenCalled();
  });
  it('handles a Midtrans failure without exposing its response', async () => {
    (coreApi.charge as jest.Mock).mockRejectedValue(new Error('secret'));
    const response = await request(app).post('/api/core/transaction').send({ grossAmount: 10000, paymentType: 'qris' });
    expect(response.status).toBe(502);
    expect(JSON.stringify(response.body)).not.toContain('secret');
  });
  it('creates a Snap transaction', async () => {
    (snap.createTransaction as jest.Mock).mockResolvedValue({ token: 'token', redirect_url: 'url' });
    const response = await request(app).post('/api/snap/payment').send({ orderId: 'order-123', grossAmount: 10000 });
    expect(response.status).toBe(200);
    expect(Invoice.create).toHaveBeenCalledWith({ orderId: 'order-123', grossAmount: 10000, status: 'pending' });
  });
});

describe('transaction operations', () => {
  it.each([
    ['get', '/api/core/transaction-status/order-123', 'status'],
    ['post', '/api/core/transaction-cancel', 'cancel'],
    ['post', '/api/core/transaction-expire', 'expire'],
  ])('supports %s %s', async (method, path, operation) => {
    (coreApi.transaction[operation as 'status'] as jest.Mock).mockResolvedValue({ transaction_status: 'pending' });
    const response = method === 'get' ? await request(app).get(path) : await request(app).post(path).send({ orderId: 'order-123' });
    expect(response.status).toBe(200);
    expect(coreApi.transaction[operation as 'status']).toHaveBeenCalledWith('order-123');
  });
  it('rejects empty order ID', async () => {
    const response = await request(app).post('/api/core/transaction-cancel').send({ orderId: '' });
    expect(response.status).toBe(400);
  });
  it('returns 404 when Midtrans cannot find an order', async () => {
    (coreApi.transaction.status as jest.Mock).mockRejectedValue({ httpStatusCode: 404 });
    const response = await request(app).get('/api/core/transaction-status/order-unknown');
    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('TRANSACTION_NOT_FOUND');
  });
});

describe.each(['/api/core/transaction-callback', '/api/snap/payment-callback'])('%s', endpoint => {
  const invoice = () => ({ grossAmount: 10000, status: 'pending', save: jest.fn() });
  it('rejects a forged callback without changing invoice', async () => {
    const response = await request(app).post(endpoint).send({ ...notification(), signature_key: 'invalid' });
    expect(response.status).toBe(403);
    expect(Invoice.findOne).not.toHaveBeenCalled();
  });
  it('rejects malformed notification', async () => {
    const response = await request(app).post(endpoint).send({ order_id: 'order-123', transaction_status: 'settlement' });
    expect(response.status).toBe(400);
  });
  it('returns 404 for an unknown order', async () => {
    (Invoice.findOne as jest.Mock).mockResolvedValue(null);
    const response = await request(app).post(endpoint).send(notification());
    expect(response.status).toBe(404);
  });
  it('rejects a signed amount that differs from the invoice', async () => {
    const existing = invoice();
    (Invoice.findOne as jest.Mock).mockResolvedValue(existing);
    const response = await request(app).post(endpoint).send(notification('order-123', '20000.00'));
    expect(response.status).toBe(403);
    expect(existing.save).not.toHaveBeenCalled();
  });
  it('updates status and handles repeated notification without another write', async () => {
    const existing = invoice();
    (Invoice.findOne as jest.Mock).mockResolvedValue(existing);
    expect((await request(app).post(endpoint).send(notification())).status).toBe(200);
    expect(existing.status).toBe('settlement');
    expect((await request(app).post(endpoint).send(notification())).status).toBe(200);
    expect(existing.save).toHaveBeenCalledTimes(1);
    expect(Invoice.create).not.toHaveBeenCalled();
  });
  it('uses Midtrans status even if a signed notification claims a different status', async () => {
    const existing = invoice();
    (Invoice.findOne as jest.Mock).mockResolvedValue(existing);
    const response = await request(app).post(endpoint).send({ ...notification(), transaction_status: 'cancel' });
    expect(response.status).toBe(200);
    expect(existing.status).toBe('settlement');
  });
});
