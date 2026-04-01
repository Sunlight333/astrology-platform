import rateLimit from 'express-rate-limit';
import { Request } from 'express';

/**
 * Auth endpoints: 5 requests per minute per IP.
 * Protects /auth/register and /auth/login from brute-force attacks.
 */
export const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => req.ip ?? req.socket.remoteAddress ?? 'unknown',
  message: {
    error: 'Too many requests',
    message: 'Too many authentication attempts. Please try again later.',
    retryAfterSeconds: 60,
  },
});

/**
 * Chart calculation: 10 requests per hour per authenticated user.
 */
export const chartLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => req.userId ?? req.ip ?? 'unknown',
  message: {
    error: 'Too many requests',
    message: 'Chart calculation rate limit exceeded. Please try again later.',
    retryAfterSeconds: 3600,
  },
});

/**
 * Geocoding-related endpoints: 100 requests per hour per user.
 */
export const geocodingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => req.userId ?? req.ip ?? 'unknown',
  message: {
    error: 'Too many requests',
    message: 'Geocoding rate limit exceeded. Please try again later.',
    retryAfterSeconds: 3600,
  },
});

/**
 * General rate limit: 100 requests per minute per IP for all routes.
 */
export const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => req.ip ?? req.socket.remoteAddress ?? 'unknown',
  message: {
    error: 'Too many requests',
    message: 'Rate limit exceeded. Please try again later.',
    retryAfterSeconds: 60,
  },
});
