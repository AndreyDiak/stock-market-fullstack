import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function mapError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof ZodError) {
    const message = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
    return new AppError(400, 'VALIDATION_ERROR', message);
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      return new AppError(409, 'CONFLICT', 'Resource already exists');
    }
    if (error.code === 'P2025') {
      return new AppError(404, 'NOT_FOUND', 'Resource not found');
    }
  }

  return new AppError(500, 'INTERNAL_ERROR', 'Internal server error');
}
