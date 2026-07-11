import type { FastifyInstance } from 'fastify';
import { authenticate } from '../../middleware/authenticate.js';
import { errorResponses } from '../../schemas/register.js';
import { createFeedbackSchema } from './feedback.schema.js';
import { FeedbackService } from './feedback.service.js';

export async function feedbackRoutes(fastify: FastifyInstance) {
  const feedbackService = new FeedbackService(fastify.prisma);

  fastify.post('/feedback', {
    preHandler: authenticate,
    schema: {
      tags: ['feedback'],
      security: [{ bearerAuth: [] }],
      body: { $ref: 'CreateFeedbackBody#' },
      response: { 200: { $ref: 'CreateFeedbackResponse#' }, ...errorResponses },
    },
  }, async (request) => {
    const data = createFeedbackSchema.parse(request.body);
    return feedbackService.create(request.user.sub, data);
  });
}
