import { randomBytes } from 'node:crypto';
import type { PrismaClient } from '@prisma/client';
import type { FastifyInstance } from 'fastify';
import { AppError } from '../../utils/errors.js';
import { env } from '../../config/env.js';

export type AuthProvider = 'yandex' | 'google';

export interface OAuthProfile {
  provider: AuthProvider;
  id: string;
  email: string;
  name: string;
  picture?: string;
}

const PROVIDER_ID_FIELD = {
  yandex: 'yandexId',
  google: 'googleId',
} as const;

function parseDurationToMs(duration: string): number {
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) {
    throw new Error(`Invalid duration format: ${duration}`);
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 's':
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    default:
      throw new Error(`Unknown duration unit: ${unit}`);
  }
}

export class AuthService {
  constructor(
    private prisma: PrismaClient,
    private fastify: FastifyInstance,
  ) {}

  async findOrCreateUser(profile: OAuthProfile) {
    const idField = PROVIDER_ID_FIELD[profile.provider];

    const existingByProvider = await this.prisma.user.findFirst({
      where: { [idField]: profile.id },
    });

    if (existingByProvider) {
      return this.prisma.user.update({
        where: { id: existingByProvider.id },
        data: {
          email: profile.email,
          displayName: profile.name,
          avatarUrl: profile.picture ?? null,
          lastLoginAt: new Date(),
        },
      });
    }

    const existingByEmail = await this.prisma.user.findUnique({
      where: { email: profile.email },
    });

    if (existingByEmail) {
      return this.prisma.user.update({
        where: { id: existingByEmail.id },
        data: {
          [idField]: profile.id,
          displayName: profile.name,
          avatarUrl: profile.picture ?? existingByEmail.avatarUrl,
          lastLoginAt: new Date(),
        },
      });
    }

    return this.prisma.user.create({
      data: {
        email: profile.email,
        displayName: profile.name,
        avatarUrl: profile.picture ?? null,
        [idField]: profile.id,
      },
    });
  }

  async issueTokens(userId: string, email: string) {
    const accessToken = this.fastify.jwt.sign({ sub: userId, email });

    const refreshToken = randomBytes(64).toString('hex');
    const expiresAt = new Date(Date.now() + parseDurationToMs(env.JWT_REFRESH_EXPIRES_IN));

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        expiresAt,
      },
    });

    return { accessToken, refreshToken, expiresAt };
  }

  async refreshAccessToken(refreshToken: string) {
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!storedToken) {
      throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'Invalid refresh token');
    }

    if (storedToken.revokedAt) {
      throw new AppError(401, 'REVOKED_REFRESH_TOKEN', 'Refresh token has been revoked');
    }

    if (storedToken.expiresAt < new Date()) {
      throw new AppError(401, 'EXPIRED_REFRESH_TOKEN', 'Refresh token has expired');
    }

    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    return this.issueTokens(storedToken.userId, storedToken.user.email);
  }

  async revokeRefreshToken(refreshToken: string) {
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!storedToken || storedToken.revokedAt) {
      return;
    }

    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });
  }
}
