/**
 * Integration tests for content access control on chart routes (/api/charts/*).
 *
 * Verifies:
 * - Unauthenticated users are rejected (401)
 * - Authenticated users without a paid order receive free preview (Sun, Moon, Ascendant only)
 * - Authenticated users with a paid order receive the full chart
 * - Refunded orders lose access (chart reverted to free preview)
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

// Mock chart service — returns controlled chart data
const mockGetChart = jest.fn();
const mockGetChartByBirthProfileId = jest.fn();
const mockCalculateNatalChart = jest.fn();

jest.mock('../../services/chart.service', () => ({
  getChart: (...args: any[]) => mockGetChart(...args),
  getChartByBirthProfileId: (...args: any[]) => mockGetChartByBirthProfileId(...args),
  calculateNatalChart: (...args: any[]) => mockCalculateNatalChart(...args),
}));

// Mock services that depend on native modules (sweph)
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
// Fixtures
// ---------------------------------------------------------------------------

const USER_ID = 'access-user-1';
const OTHER_USER_ID = 'access-user-2';
const PROFILE_ID = '00000000-0000-4000-a000-000000000001';
const CHART_ID = 'access-chart-1';

const fullChart = {
  id: CHART_ID,
  birthProfileId: PROFILE_ID,
  planetaryPositions: [
    { planet: 'Sun', longitude: 84.5, latitude: 0, distance: 1, speedInLongitude: 1, sign: 'Gemini', degree: 24, minute: 30, isRetrograde: false },
    { planet: 'Moon', longitude: 210.2, latitude: 3, distance: 1, speedInLongitude: 13, sign: 'Libra', degree: 0, minute: 12, isRetrograde: false },
    { planet: 'Mercury', longitude: 70.1, latitude: -1, distance: 0.8, speedInLongitude: 1.5, sign: 'Gemini', degree: 10, minute: 6, isRetrograde: false },
    { planet: 'Venus', longitude: 120.3, latitude: 2, distance: 1.2, speedInLongitude: 1.2, sign: 'Leo', degree: 0, minute: 18, isRetrograde: false },
    { planet: 'Mars', longitude: 300.7, latitude: -0.5, distance: 1.5, speedInLongitude: 0.7, sign: 'Aquarius', degree: 0, minute: 42, isRetrograde: false },
  ],
  houseCusps: [
    { house: 1, sign: 'Aries', degree: 0, longitude: 0 },
    { house: 2, sign: 'Taurus', degree: 30, longitude: 30 },
  ],
  angles: { ascendant: 0, mc: 270, armc: 270, vertex: 180 },
  aspects: [
    { planetA: 'Sun', planetB: 'Moon', aspectType: 'trine', angle: 120, orb: 1.5, isApplying: true },
    { planetA: 'Sun', planetB: 'Mercury', aspectType: 'conjunction', angle: 0, orb: 5, isApplying: false },
    { planetA: 'Mercury', planetB: 'Venus', aspectType: 'sextile', angle: 60, orb: 2, isApplying: true },
  ],
  houseSystem: 'P',
  calculatedAt: '2024-01-01T00:00:00.000Z',
  isPaid: false,
};

const profile = createTestBirthProfile({ id: PROFILE_ID, userId: USER_ID }) as any;
const accessToken = generateTestAccessToken(USER_ID);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Content access – /api/charts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // -----------------------------------------------------------------------
  // Unauthenticated access
  // -----------------------------------------------------------------------

  describe('unauthenticated access', () => {
    it('returns 401 for GET /api/charts/:id without a token', async () => {
      const res = await request(app).get(`/api/charts/${CHART_ID}`);
      expect(res.status).toBe(401);
    });

    it('returns 401 for POST /api/charts/calculate without a token', async () => {
      const res = await request(app)
        .post('/api/charts/calculate')
        .send({ birthProfileId: PROFILE_ID });
      expect(res.status).toBe(401);
    });
  });

  // -----------------------------------------------------------------------
  // Free preview (unpaid)
  // -----------------------------------------------------------------------

  describe('authenticated user without paid order (free preview)', () => {
    it('returns only Sun, Moon, and Ascendant data from GET /:id', async () => {
      const unpaidChart = { ...fullChart, isPaid: false };
      mockGetChart.mockResolvedValue(unpaidChart);
      mockPrisma.birthProfile.findUnique.mockResolvedValue(profile);

      const res = await request(app)
        .get(`/api/charts/${CHART_ID}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);

      // Should only contain Sun and Moon in planetaryPositions
      const planets = res.body.planetaryPositions.map((p: any) => p.planet);
      expect(planets).toContain('Sun');
      expect(planets).toContain('Moon');
      expect(planets).not.toContain('Mercury');
      expect(planets).not.toContain('Venus');
      expect(planets).not.toContain('Mars');

      // House cusps should be empty in free preview
      expect(res.body.houseCusps).toEqual([]);

      // Ascendant should be present, but mc/armc/vertex zeroed
      expect(res.body.angles.ascendant).toBe(0);
      expect(res.body.angles.mc).toBe(0);

      // isPaid should be false
      expect(res.body.isPaid).toBe(false);
    });

    it('returns free preview from POST /calculate when no paid order exists', async () => {
      mockPrisma.birthProfile.findUnique.mockResolvedValue(profile);
      mockPrisma.order.findFirst.mockResolvedValue(null); // no paid order

      const calculatedChart = { ...fullChart, isPaid: false };
      mockCalculateNatalChart.mockResolvedValue(calculatedChart);

      const res = await request(app)
        .post('/api/charts/calculate')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ birthProfileId: PROFILE_ID });

      expect(res.status).toBe(200);

      const planets = res.body.planetaryPositions.map((p: any) => p.planet);
      expect(planets).toContain('Sun');
      expect(planets).toContain('Moon');
      expect(planets).not.toContain('Mercury');
      expect(res.body.isPaid).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // Full chart (paid)
  // -----------------------------------------------------------------------

  describe('authenticated user with paid order (full chart)', () => {
    it('returns the complete chart from GET /:id', async () => {
      const paidChart = { ...fullChart, isPaid: true };
      mockGetChart.mockResolvedValue(paidChart);
      mockPrisma.birthProfile.findUnique.mockResolvedValue(profile);

      const res = await request(app)
        .get(`/api/charts/${CHART_ID}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);

      // All planets should be present
      const planets = res.body.planetaryPositions.map((p: any) => p.planet);
      expect(planets).toContain('Sun');
      expect(planets).toContain('Moon');
      expect(planets).toContain('Mercury');
      expect(planets).toContain('Venus');
      expect(planets).toContain('Mars');

      // House cusps should be populated
      expect(res.body.houseCusps.length).toBeGreaterThan(0);

      // Full angles
      expect(res.body.angles.mc).toBe(270);

      expect(res.body.isPaid).toBe(true);
    });

    it('returns full chart from POST /calculate when paid order exists', async () => {
      mockPrisma.birthProfile.findUnique.mockResolvedValue(profile);
      mockPrisma.order.findFirst.mockResolvedValue({
        id: 'paid-order-1',
        userId: USER_ID,
        productType: 'natal_chart',
        status: 'paid',
      });

      const calculatedChart = { ...fullChart, isPaid: false };
      mockCalculateNatalChart.mockResolvedValue(calculatedChart);
      mockPrisma.natalChart.update.mockResolvedValue({ ...calculatedChart, isPaid: true });

      const res = await request(app)
        .post('/api/charts/calculate')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ birthProfileId: PROFILE_ID });

      expect(res.status).toBe(200);

      // All planets present
      const planets = res.body.planetaryPositions.map((p: any) => p.planet);
      expect(planets.length).toBe(5);
      expect(res.body.isPaid).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // Refunded order loses access
  // -----------------------------------------------------------------------

  describe('refunded order reverts to free preview', () => {
    it('returns free preview after chart isPaid is set to false', async () => {
      // Simulate a chart whose isPaid flag was set back to false after refund
      const refundedChart = { ...fullChart, isPaid: false };
      mockGetChart.mockResolvedValue(refundedChart);
      mockPrisma.birthProfile.findUnique.mockResolvedValue(profile);

      const res = await request(app)
        .get(`/api/charts/${CHART_ID}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);

      const planets = res.body.planetaryPositions.map((p: any) => p.planet);
      expect(planets).toContain('Sun');
      expect(planets).toContain('Moon');
      expect(planets).not.toContain('Mercury');
      expect(planets).not.toContain('Venus');
      expect(res.body.isPaid).toBe(false);
    });
  });
});
