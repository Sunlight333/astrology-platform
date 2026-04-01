import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { generalLimiter, authLimiter } from './middleware/rate-limit.middleware';
import { globalErrorHandler } from './middleware/error-handler.middleware';
import { sanitizeInputs } from './middleware/sanitize.middleware';
import authRoutes from './routes/auth.routes';
import webhookRoutes from './routes/webhook.routes';
import paymentRoutes from './routes/payment.routes';
import chartRoutes from './routes/chart.routes';
import profileRoutes from './routes/profile.routes';
import adminRoutes from './routes/admin.routes';
import transitRoutes from './routes/transit.routes';

const app = express();

// Trust proxy so rate limiting works behind reverse proxies (e.g., nginx, AWS ALB)
app.set('trust proxy', 1);

// Security headers – disable CSP in development (Vite proxies API requests and
// browser extensions like Chrome DevTools trigger false CSP violations).
app.use(helmet({
  contentSecurityPolicy: env.NODE_ENV === 'production' ? {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'", env.FRONTEND_URL],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
    },
  } : false,
  crossOriginEmbedderPolicy: env.NODE_ENV === 'production',
  crossOriginOpenerPolicy: env.NODE_ENV === 'production',
  crossOriginResourcePolicy: env.NODE_ENV === 'production' ? { policy: 'same-origin' as const } : false,
  hsts: env.NODE_ENV === 'production' ? {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  } : false,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  noSniff: true,
}));

// CORS - restricted to frontend URL only (no wildcards)
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 600, // 10 minutes preflight cache
}));

// Request logging
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Body parsing
app.use(express.json({ limit: '1mb' }));

// Cookie parsing with secure settings
app.use(cookieParser());

// Input sanitization (strip HTML tags, trim whitespace)
app.use(sanitizeInputs);

// General rate limit for all routes
app.use(generalLimiter);

// Health check (before auth routes, after general limiter)
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes with specific rate limiters
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/charts', chartRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/transits', transitRoutes);
// app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);

// Catch-all 404 for unmatched routes (returns JSON, not Express's default HTML)
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Global error handler (must be last middleware)
app.use(globalErrorHandler);

export default app;
