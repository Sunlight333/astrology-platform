import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { prisma } from '../lib/prisma';
import type { User, AuthTokens } from '@star/shared';

const BCRYPT_ROUNDS = 10;

export interface TokenPayload {
  userId: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateAccessToken(userId: string): string {
  return jwt.sign({ userId } satisfies TokenPayload, env.JWT_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRY,
  });
}

export function generateRefreshToken(userId: string): string {
  return jwt.sign({ userId } satisfies TokenPayload, env.JWT_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRY,
  });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
}

function toUserResponse(dbUser: { id: string; email: string; name: string; createdAt: Date; updatedAt: Date }): User {
  return {
    id: dbUser.id,
    email: dbUser.email,
    name: dbUser.name,
    createdAt: dbUser.createdAt.toISOString(),
    updatedAt: dbUser.updatedAt.toISOString(),
  };
}

export async function register(
  email: string,
  password: string,
  name: string,
): Promise<{ user: User; tokens: AuthTokens }> {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error('Email already registered');
  }

  const passwordHash = await hashPassword(password);
  const dbUser = await prisma.user.create({
    data: { email, passwordHash, name },
  });

  const tokens: AuthTokens = {
    accessToken: generateAccessToken(dbUser.id),
    refreshToken: generateRefreshToken(dbUser.id),
  };

  return { user: toUserResponse(dbUser), tokens };
}

export async function login(
  email: string,
  password: string,
): Promise<{ user: User; tokens: AuthTokens }> {
  const dbUser = await prisma.user.findUnique({ where: { email } });
  if (!dbUser) {
    throw new Error('Invalid email or password');
  }

  const valid = await comparePassword(password, dbUser.passwordHash);
  if (!valid) {
    throw new Error('Invalid email or password');
  }

  const tokens: AuthTokens = {
    accessToken: generateAccessToken(dbUser.id),
    refreshToken: generateRefreshToken(dbUser.id),
  };

  return { user: toUserResponse(dbUser), tokens };
}
