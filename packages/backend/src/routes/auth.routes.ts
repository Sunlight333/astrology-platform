import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { env } from '../config/env';
import { prisma } from '../lib/prisma';
import * as authService from '../services/auth.service';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required').max(100),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const REFRESH_COOKIE = 'refresh_token';

function setRefreshCookie(res: Response, refreshToken: string): void {
  res.cookie(REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/auth',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

// POST /register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors });
      return;
    }

    const { email, password, name } = parsed.data;
    const { user, tokens } = await authService.register(email, password, name);

    setRefreshCookie(res, tokens.refreshToken);
    res.status(201).json({ accessToken: tokens.accessToken, user });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Registration failed';
    const status = message === 'Email already registered' ? 409 : 500;
    res.status(status).json({ error: message });
  }
});

// POST /login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors });
      return;
    }

    const { email, password } = parsed.data;
    const { user, tokens } = await authService.login(email, password);

    setRefreshCookie(res, tokens.refreshToken);
    res.json({ accessToken: tokens.accessToken, user });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Login failed';
    const status = message === 'Invalid email or password' ? 401 : 500;
    res.status(status).json({ error: message });
  }
});

// GET /me
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, email: true, name: true, createdAt: true, updatedAt: true },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
    });
  } catch {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// POST /refresh
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies?.[REFRESH_COOKIE];

    if (!refreshToken) {
      res.status(401).json({ error: 'No refresh token provided' });
      return;
    }

    const payload = authService.verifyToken(refreshToken);

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    const accessToken = authService.generateAccessToken(user.id);
    const newRefreshToken = authService.generateRefreshToken(user.id);

    setRefreshCookie(res, newRefreshToken);
    res.json({ accessToken });
  } catch {
    res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
});

export default router;
