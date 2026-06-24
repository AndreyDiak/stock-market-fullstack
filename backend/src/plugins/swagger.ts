import fp from 'fastify-plugin';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { registerOpenApiSchemas } from '../schemas/register.js';

export default fp(async (fastify) => {
  await registerOpenApiSchemas(fastify);

  await fastify.register(swagger, {
    openapi: {
      openapi: '3.1.0',
      info: {
        title: 'Stock Simulator API',
        description: 'Backend API for the stock market simulator',
        version: '1.0.0',
      },
      servers: [{ url: 'http://localhost:3000', description: 'Local development' }],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
      tags: [
        { name: 'auth', description: 'Authentication' },
        { name: 'characters', description: 'Playable character roster' },
        { name: 'users', description: 'User profile' },
        { name: 'games', description: 'Game slots and saves' },
        { name: 'health', description: 'Health checks' },
      ],
    },
  });

  if (process.env.NODE_ENV !== 'test') {
    await fastify.register(swaggerUi, {
      routePrefix: '/docs',
    });
  }
});
