import type { PrismaClient } from '@prisma/client';
import { AppError } from '../../utils/errors.js';
import type { UpdateUserInput } from './users.schema.js';

export class UsersService {
  constructor(private prisma: PrismaClient) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
      },
    });

    if (!user) {
      throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
    }

    return user;
  }

  async updateMe(userId: string, data: UpdateUserInput) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.displayName !== undefined && { displayName: data.displayName }),
        ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
      },
    });

    return user;
  }
}
