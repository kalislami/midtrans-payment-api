import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
dotenv.config();

import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger';
import snapPaymentRoutes from './routes/snap.payment';
import corePaymentRoutes from './routes/core.payment';

const app = express();

app.use(bodyParser.json());
app.use('/api/snap/', snapPaymentRoutes);
app.use('/api/core/', corePaymentRoutes);

if (process.env.NODE_ENV !== 'production') {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

export default app;