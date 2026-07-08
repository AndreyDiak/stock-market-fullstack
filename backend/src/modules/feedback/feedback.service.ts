import type { PrismaClient } from '@prisma/client';
import type { CreateFeedbackInput } from './feedback.schema.js';

export class FeedbackService {
  readonly #prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.#prisma = prisma;
  }

  async create(userId: string, data: CreateFeedbackInput) {
    const feedback = await this.#prisma.feedback.create({
      data: {
        userId,
        saveId: data.saveId,
        messageType: data.messageType,
        comment: data.comment,
      },
    });

    return {
      id: feedback.id,
      createdAt: feedback.createdAt.toISOString(),
    };
  }
}
