/**
 * Integration tests for authentication routes (/api/auth/*).
 *
 * Strategy: mock Prisma and bcrypt at the module level so that the real route
 * handlers, Zod validation, and JWT middleware all run against supertest.
 */
import {
  createMockPrismaClient,
  createTestUser,
  generateTestAccessToken,
  generateTestRefreshToken,
  generateExpiredToken,
} from '../helpers/setup';

// ---------------------------------------------------------------------------
// Module mocks (must be declared before any import that pulls in app code)
// ---------------------------------------------------------------------------

const mockPrisma = createMockPrismaClient();

jest.mock('../../lib/prisma', () => ({ prisma: mockPrisma }));

// Mock bcrypt so we can control password comparison without real hashing
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('$2b$10$hashed'),
  compare: jest.fn(),
}));

// Mock services that depend on native modules (sweph) to avoid build issues
jest.mock('../../services/chart.service', () => ({
  calculateNatalChart: jest.fn(),
  getChart: jest.fn(),
  getChartByBirthProfileId: jest.fn(),
}));
jest.mock('../../services/transit.service', () => ({
  calculateTransits: jest.fn(),
  calculateTransitRange: jest.fn(),
}));
jest.mock('../../services/ephemeris.service', () => ({
  calculatePlanetaryPositions: jest.fn(),
  calculateHouseCusps: jest.fn(),
}));
jest.mock('../../services/geocoding.service', () => ({
  geocodeLocation: jest.fn(),
}));
jest.mock('../../services/email.service', () => ({
  sendPaymentConfirmation: jest.fn(),
  sendRefundConfirmation: jest.fn(),
  sendWelcomeEmail: jest.fn(),
}));
jest.mock('mercadopago', () => ({
  MercadoPagoConfig: jest.fn().mockImplementation(() => ({})),
  Preference: jest.fn().mockImplementation(() => ({ create: jest.fn() })),
  Payment: jest.fn().mockImplementation(() => ({ get: jest.fn() })),
}));

// Suppress morgan request logging during tests
jest.mock('morgan', () => () => (_req: any, _res: any, next: any) => next());

import request from 'supertest';
import app from '../../app';
import bcrypt from 'bcrypt';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Auth routes – /api/auth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // -----------------------------------------------------------------------
  // POST /register
  // -----------------------------------------------------------------------

  describe('POST /register', () => {
    it('creates a user and returns tokens with valid data', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null); // no duplicate
      const fakeUser = createTestUser({ id: 'new-user-1', email: 'new@test.com', name: 'New User' });
      mockPrisma.user.create.mockResolvedValue(fakeUser);

      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'new@test.com', password: 'password123', name: 'New User' });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body.user).toMatchObject({
        id: 'new-user-1',
        email: 'new@test.com',
        name: 'New User',
      });
      // Refresh token should be in httpOnly cookie
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(Array.isArray(cookies) ? cookies.join(';') : cookies).toContain('refresh_token');
    });

    it('returns 409 when email is already registered', async () => {
      const existing = createTestUser({ email: 'dup@test.com' });
      mockPrisma.user.findUnique.mockResolvedValue(existing);

      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'dup@test.com', password: 'password123', name: 'Dup User' });

      expect(res.status).toBe(409);
      expect(res.body.error).toBe('Email already registered');
    });

    it('returns 400 when validation fails (short password)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'bad@test.com', password: '123', name: 'Bad' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
    });
  });

  // -----------------------------------------------------------------------
  // POST /login
  // -----------------------------------------------------------------------

  describe('POST /login', () => {
    it('returns tokens with correct credentials', async () => {
      const user = createTestUser({ id: 'login-user', email: 'login@test.com' });
      mockPrisma.user.findUnique.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'login@test.com', password: 'password123' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body.user.email).toBe('login@test.com');
    });

    it('returns 401 with wrong password', async () => {
      const user = createTestUser({ email: 'login@test.com' });
      mockPrisma.user.findUnique.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'login@test.com', password: 'wrongpass' });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid email or password');
    });

    it('returns 401 when user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nonexistent@test.com', password: 'password123' });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid email or password');
    });
  });

  // -----------------------------------------------------------------------
  // GET /me
  // -----------------------------------------------------------------------

  describe('GET /me', () => {
    it('returns 401 without authorization header', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/missing|invalid/i);
    });

    it('returns user data with a valid token', async () => {
      const user = createTestUser({ id: 'me-user', email: 'me@test.com', name: 'Me User' });
      const token = generateTestAccessToken('me-user');
      mockPrisma.user.findUnique.mockResolvedValue(user);

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.user).toMatchObject({
        id: 'me-user',
        email: 'me@test.com',
        name: 'Me User',
      });
    });

    it('returns 401 with an expired access token', async () => {
      const token = generateExpiredToken('me-user');

      // Small delay to ensure the 0s-expiry token is actually expired
      await new Promise((r) => setTimeout(r, 50));

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/invalid|expired/i);
    });
  });

  // -----------------------------------------------------------------------
  // POST /refresh
  // -----------------------------------------------------------------------

  describe('POST /refresh', () => {
    it('returns a new access token with a valid refresh cookie', async () => {
      const user = createTestUser({ id: 'refresh-user' });
      const refreshToken = generateTestRefreshToken('refresh-user');
      mockPrisma.user.findUnique.mockResolvedValue(user);

      const res = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', `refresh_token=${refreshToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
      expect(typeof res.body.accessToken).toBe('string');
    });

    it('returns 401 when no refresh cookie is present', async () => {
      const res = await request(app).post('/api/auth/refresh');

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/no refresh token/i);
    });

    it('returns 401 with an expired refresh token', async () => {
      const expired = generateExpiredToken('refresh-user');
      await new Promise((r) => setTimeout(r, 50));

      const res = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', `refresh_token=${expired}`);

      expect(res.status).toBe(401);
    });
  });
});
