/**
 * Integration tests for birth profile routes (/api/profiles/*).
 *
 * Covers validation, creation, and listing with mocked Prisma.
 */
import {
  createMockPrismaClient,
  createTestBirthProfile,
  generateTestAccessToken,
} from '../helpers/setup';

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

const mockPrisma = createMockPrismaClient();
jest.mock('../../lib/prisma', () => ({ prisma: mockPrisma }));

// Mock bcrypt (native addon may not be available in test environment)
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('$2b$10$hashed'),
  compare: jest.fn().mockResolvedValue(true),
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

// Suppress morgan
jest.mock('morgan', () => () => (_req: any, _res: any, next: any) => next());

import request from 'supertest';
import app from '../../app';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const USER_ID = 'profile-user-1';
const OTHER_USER_ID = 'profile-user-2';
const accessToken = generateTestAccessToken(USER_ID);

function authPost(url: string) {
  return request(app).post(url).set('Authorization', `Bearer ${accessToken}`);
}

function authGet(url: string) {
  return request(app).get(url).set('Authorization', `Bearer ${accessToken}`);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Profile routes – /api/profiles', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // -----------------------------------------------------------------------
  // POST / — Create profile
  // -----------------------------------------------------------------------

  describe('POST / (create profile)', () => {
    const validPayload = {
      name: 'My Birth Chart',
      birthDate: '1990-06-15',
      birthTime: '14:30',
      birthCity: 'Sao Paulo',
    };

    it('creates a profile with valid data', async () => {
      const created = createTestBirthProfile({
        id: 'new-profile-1',
        userId: USER_ID,
        name: 'My Birth Chart',
        birthCity: 'Sao Paulo',
        birthTime: '14:30',
      });
      mockPrisma.birthProfile.create.mockResolvedValue(created);

      const res = await authPost('/api/profiles').send(validPayload);

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        id: 'new-profile-1',
        name: 'My Birth Chart',
        birthCity: 'Sao Paulo',
        birthTime: '14:30',
      });
      expect(res.body).toHaveProperty('createdAt');
    });

    it('returns 400 when birthTime is missing', async () => {
      const res = await authPost('/api/profiles').send({
        name: 'No Time',
        birthDate: '1990-06-15',
        birthCity: 'Sao Paulo',
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/invalid/i);
    });

    it('returns 400 when birthCity is missing', async () => {
      const res = await authPost('/api/profiles').send({
        name: 'No City',
        birthDate: '1990-06-15',
        birthTime: '14:30',
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/invalid/i);
    });

    it('returns 400 for a future birth date', async () => {
      const res = await authPost('/api/profiles').send({
        name: 'Future Person',
        birthDate: '2150-01-01',
        birthTime: '12:00',
        birthCity: 'Rio de Janeiro',
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/invalid/i);
    });

    it('returns 400 for invalid birth date format', async () => {
      const res = await authPost('/api/profiles').send({
        name: 'Bad Date',
        birthDate: '15/06/1990',
        birthTime: '14:30',
        birthCity: 'Sao Paulo',
      });

      expect(res.status).toBe(400);
    });

    it('returns 400 for invalid birth time format', async () => {
      const res = await authPost('/api/profiles').send({
        name: 'Bad Time',
        birthDate: '1990-06-15',
        birthTime: '2:30 PM',
        birthCity: 'Sao Paulo',
      });

      expect(res.status).toBe(400);
    });

    it('returns 401 without authentication', async () => {
      const res = await request(app)
        .post('/api/profiles')
        .send(validPayload);

      expect(res.status).toBe(401);
    });
  });

  // -----------------------------------------------------------------------
  // GET / — List profiles
  // -----------------------------------------------------------------------

  describe('GET / (list profiles)', () => {
    it('returns only the authenticated user profiles', async () => {
      const profiles = [
        createTestBirthProfile({ id: 'p1', userId: USER_ID, name: 'Profile A' }),
        createTestBirthProfile({ id: 'p2', userId: USER_ID, name: 'Profile B' }),
      ];
      mockPrisma.birthProfile.findMany.mockResolvedValue(profiles);

      const res = await authGet('/api/profiles');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(2);
      expect(res.body[0].name).toBe('Profile A');
      expect(res.body[1].name).toBe('Profile B');

      // Verify the query filtered by userId
      expect(mockPrisma.birthProfile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: USER_ID },
        }),
      );
    });

    it('returns an empty array when user has no profiles', async () => {
      mockPrisma.birthProfile.findMany.mockResolvedValue([]);

      const res = await authGet('/api/profiles');

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('returns 401 without authentication', async () => {
      const res = await request(app).get('/api/profiles');
      expect(res.status).toBe(401);
    });
  });

  // -----------------------------------------------------------------------
  // GET /:id — Get single profile
  // -----------------------------------------------------------------------

  describe('GET /:id (single profile)', () => {
    it('returns 403 when profile belongs to another user', async () => {
      const otherProfile = createTestBirthProfile({
        id: 'other-p',
        userId: OTHER_USER_ID,
      });
      mockPrisma.birthProfile.findUnique.mockResolvedValue(otherProfile);

      const res = await authGet('/api/profiles/other-p');

      expect(res.status).toBe(403);
    });

    it('returns 404 when profile does not exist', async () => {
      mockPrisma.birthProfile.findUnique.mockResolvedValue(null);

      const res = await authGet('/api/profiles/nonexistent');

      expect(res.status).toBe(404);
    });
  });

  // -----------------------------------------------------------------------
  // DELETE /:id
  // -----------------------------------------------------------------------

  describe('DELETE /:id', () => {
    it('deletes a profile owned by the user', async () => {
      const myProfile = createTestBirthProfile({ id: 'del-p', userId: USER_ID });
      mockPrisma.birthProfile.findUnique.mockResolvedValue(myProfile);
      mockPrisma.birthProfile.delete.mockResolvedValue(myProfile);

      const res = await request(app)
        .delete('/api/profiles/del-p')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/deleted/i);
    });

    it('returns 403 when trying to delete another user profile', async () => {
      const otherProfile = createTestBirthProfile({ id: 'del-other', userId: OTHER_USER_ID });
      mockPrisma.birthProfile.findUnique.mockResolvedValue(otherProfile);

      const res = await request(app)
        .delete('/api/profiles/del-other')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(403);
    });
  });
});
