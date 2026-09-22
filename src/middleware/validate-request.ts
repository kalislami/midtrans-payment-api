import { RequestHandler } from 'express';
import { z } from 'zod';
import { AppError } from './error-handler';

export const validateRequest = (schema: z.ZodType): RequestHandler => (req, _res, next) => {
  const parsed = schema.safeParse({ body: req.body, params: req.params });
  if (!parsed.success) return next(new AppError(400, 'VALIDATION_ERROR', 'Invalid request'));
  next();
};
