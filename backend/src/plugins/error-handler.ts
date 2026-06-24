import fp from 'fastify-plugin';
import { AppError, isAppError, mapError } from '../utils/errors.js';
import { env } from '../config/env.js';

export default fp(async (fastify) => {
  fastify.setErrorHandler((error, _request, reply) => {
    const appError = isAppError(error) ? error : mapError(error);

    if (appError.statusCode >= 500 && env.NODE_ENV !== 'test') {
      fastify.log.error(error);
    }

    reply.status(appError.statusCode).send({
      error: {
        code: appError.code,
        message: appError.message,
      },
    });
  });

  fastify.setNotFoundHandler((_request, reply) => {
    const error = new AppError(404, 'NOT_FOUND', 'Route not found');
    reply.status(404).send({
      error: {
        code: error.code,
        message: error.message,
      },
    });
  });
});
