import swaggerJSDoc from 'swagger-jsdoc';

const error = { description: 'Error response', content: { 'application/json': { schema: {
  type: 'object', properties: { error: { type: 'object', properties: {
    code: { type: 'string' }, message: { type: 'string' },
  } } },
} } } };
const orderId = { type: 'string', example: 'order-123' };
const notification = { type: 'object', required: ['order_id', 'status_code', 'gross_amount', 'signature_key', 'transaction_status'], properties: {
  order_id: orderId, status_code: { type: 'string', example: '200' }, gross_amount: { type: 'string', example: '10000.00' },
  signature_key: { type: 'string', description: 'Midtrans SHA-512 signature' }, transaction_status: { type: 'string', example: 'settlement' },
} };
const body = (schema: object) => ({ required: true, content: { 'application/json': { schema } } });
const responses = { 200: { description: 'Successful response' }, 400: error, 403: error, 404: error, 409: error, 502: error };

export const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: '3.0.0',
    info: { title: 'Midtrans Payment API', version: '1.0.0', description: 'RESTful payment API demonstrating Midtrans Snap and Core API integration.' },
    servers: [{ url: `http://localhost:${process.env.PORT ?? 3000}/api` }],
    paths: {
      '/core/transaction': { post: { summary: 'Create Core transaction', tags: ['Core'], requestBody: body({ type: 'object', required: ['grossAmount', 'paymentType'], properties: {
        grossAmount: { type: 'integer', minimum: 1 }, paymentType: { type: 'string', enum: ['bank_transfer', 'gopay', 'qris'] },
        bankName: { type: 'string', enum: ['bca', 'bni', 'bri', 'permata'], description: 'Only for bank_transfer; defaults to bca' },
      } }), responses } },
      '/snap/payment': { post: { summary: 'Create Snap payment', tags: ['Snap'], requestBody: body({ type: 'object', required: ['orderId', 'grossAmount'], properties: {
        orderId, grossAmount: { type: 'integer', minimum: 1 },
      } }), responses } },
      '/core/transaction-status/{orderId}': { get: { summary: 'Get transaction status from Midtrans', tags: ['Core'], parameters: [{ in: 'path', name: 'orderId', required: true, schema: orderId }], responses } },
      '/core/transaction-cancel': { post: { summary: 'Cancel transaction', tags: ['Core'], requestBody: body({ type: 'object', required: ['orderId'], properties: { orderId } }), responses } },
      '/core/transaction-expire': { post: { summary: 'Expire transaction', tags: ['Core'], requestBody: body({ type: 'object', required: ['orderId'], properties: { orderId } }), responses } },
      '/core/transaction-callback': { post: { summary: 'Midtrans Core webhook', tags: ['Webhooks'], requestBody: body(notification), responses } },
      '/snap/payment-callback': { post: { summary: 'Midtrans Snap webhook', tags: ['Webhooks'], requestBody: body(notification), responses } },
    },
  },
  apis: [],
});
