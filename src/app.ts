import express from 'express';
import 'dotenv/config';

import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger';
import snapPaymentRoutes from './routes/snap.payment';
import corePaymentRoutes from './routes/core.payment';
import { errorHandler } from './middleware/error-handler';

const app = express();

app.use(express.json());
app.use('/api/snap/', snapPaymentRoutes);
app.use('/api/core/', corePaymentRoutes);

if (process.env.NODE_ENV !== 'production') {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

app.use(errorHandler);

export default app;
