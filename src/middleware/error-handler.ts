import { ErrorRequestHandler } from 'express';
import { UniqueConstraintError, ValidationError as SequelizeValidationError } from 'sequelize';

export class AppError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}

export const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
  if (error instanceof AppError) {
    res.status(error.status).json({ error: { code: error.code, message: error.message } });
    return;
  }
  if (error instanceof UniqueConstraintError || error instanceof SequelizeValidationError) {
    res.status(409).json({ error: { code: 'DATABASE_ERROR', message: 'Invoice could not be saved' } });
    return;
  }
  if (error instanceof SyntaxError && 'status' in error && error.status === 400) {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid JSON body' } });
    return;
  }
  res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' } });
};
