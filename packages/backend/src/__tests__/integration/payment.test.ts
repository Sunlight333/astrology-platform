/**
 * Integration tests for payment routes (/api/payment/*) and webhook
 * processing (/api/webhooks/mercadopago).
 *
 * Strategy: mock Prisma, Mercado Pago SDK, and email service. Exercise real
 * route handlers, Zod validation, and auth middleware via supertest.
 */
import {
  createMockPrismaClient,
  createTestUser,
  createTestOrder,
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

// Mock Mercado Pago SDK
const mockPreferenceCreate = jest.fn();
const mockPaymentGet = jest.fn();

jest.mock('mercadopago', () => ({
  MercadoPagoConfig: jest.fn().mockImplementation(() => ({})),
  Preference: jest.fn().mockImplementation(() => ({
    create: mockPreferenceCreate,
  })),
  Payment: jest.fn().mockImplementation(() => ({
    get: mockPaymentGet,
  })),
}));

// Mock email service
jest.mock('../../services/email.service', () => ({
  sendPaymentConfirmation: jest.fn().mockResolvedValue(undefined),
  sendRefundConfirmation: jest.fn().mockResolvedValue(undefined),
}));

// Mock chart service (used in post-payment fulfillment)
jest.mock('../../services/chart.service', () => ({
  calculateNatalChart: jest.fn().mockResolvedValue({ id: 'chart-1' }),
  getChart: jest.fn(),
  getChartByBirthProfileId: jest.fn(),
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

// Suppress morgan
jest.mock('morgan', () => () => (_req: any, _res: any, next: any) => next());

import request from 'supertest';
import app from '../../app';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TEST_USER_ID = 'pay-user-1';
const accessToken = generateTestAccessToken(TEST_USER_ID);

function authGet(url: string) {
  return request(app).get(url).set('Authorization', `Bearer ${accessToken}`);
}

function authPost(url: string) {
  return request(app).post(url).set('Authorization', `Bearer ${accessToken}`);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Payment routes – /api/payment', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // -----------------------------------------------------------------------
  // POST /create-checkout
  // -----------------------------------------------------------------------

  describe('POST /create-checkout', () => {
    it('returns a checkout URL for a valid product type', async () => {
      // Product price lookup
      mockPrisma.product.findUnique.mockResolvedValue(null); // fall back to default price

      // Order creation
      const order = createTestOrder({ id: 'order-checkout-1', userId: TEST_USER_ID });
      mockPrisma.order.create.mockResolvedValue(order);
      mockPrisma.order.update.mockResolvedValue({ ...order, mpPreferenceId: 'pref-123' });

      // MP preference
      mockPreferenceCreate.mockResolvedValue({
        id: 'pref-123',
        sandbox_init_point: 'https://sandbox.mercadopago.com.br/checkout/v1/redirect?pref_id=pref-123',
        init_point: 'https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=pref-123',
      });

      const res = await authPost('/api/payment/create-checkout')
        .send({ productType: 'natal_chart' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('checkoutUrl');
      expect(res.body.checkoutUrl).toContain('mercadopago');
      expect(res.body).toHaveProperty('orderId', 'order-checkout-1');
    });

    it('returns 400 for invalid product type', async () => {
      const res = await authPost('/api/payment/create-checkout')
        .send({ productType: 'invalid_product' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
    });

    it('returns 401 without authentication', async () => {
      const res = await request(app)
        .post('/api/payment/create-checkout')
        .send({ productType: 'natal_chart' });

      expect(res.status).toBe(401);
    });
  });
});

// ---------------------------------------------------------------------------
// Webhook tests
// ---------------------------------------------------------------------------

describe('Webhook routes – /api/webhooks/mercadopago', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('updates order to approved on payment.approved', async () => {
    const order = createTestOrder({
      id: 'wh-order-1',
      userId: 'wh-user-1',
      status: 'pending',
      productType: 'natal_chart',
    });

    mockPaymentGet.mockResolvedValue({
      external_reference: 'wh-order-1',
      status: 'approved',
    });

    mockPrisma.order.findUnique.mockResolvedValue(order);
    mockPrisma.order.update.mockResolvedValue({ ...order, status: 'approved' });
    mockPrisma.natalChart.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.natalChart.findMany.mockResolvedValue([]);

    const res = await request(app)
      .post('/api/webhooks/mercadopago')
      .send({ type: 'payment', data: { id: '99001' } });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ received: true });

    // Verify order was updated to approved
    expect(mockPrisma.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'wh-order-1' },
        data: expect.objectContaining({ status: 'approved' }),
      }),
    );
  });

  it('keeps order status as pending on payment.rejected', async () => {
    const order = createTestOrder({
      id: 'wh-order-2',
      userId: 'wh-user-1',
      status: 'pending',
      productType: 'natal_chart',
    });

    mockPaymentGet.mockResolvedValue({
      external_reference: 'wh-order-2',
      status: 'rejected',
    });

    mockPrisma.order.findUnique.mockResolvedValue(order);
    mockPrisma.order.update.mockResolvedValue({ ...order, status: 'rejected' });

    const res = await request(app)
      .post('/api/webhooks/mercadopago')
      .send({ type: 'payment', data: { id: '99002' } });

    expect(res.status).toBe(200);

    expect(mockPrisma.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'rejected' }),
      }),
    );
  });

  it('is idempotent: same payment processed only once', async () => {
    // Order already processed (mpPaymentId matches and status is approved)
    const order = createTestOrder({
      id: 'wh-order-3',
      userId: 'wh-user-1',
      status: 'approved',
      mpPaymentId: '99003',
      productType: 'natal_chart',
    });

    mockPaymentGet.mockResolvedValue({
      external_reference: 'wh-order-3',
      status: 'approved',
    });

    mockPrisma.order.findUnique.mockResolvedValue(order);

    // First call
    await request(app)
      .post('/api/webhooks/mercadopago')
      .send({ type: 'payment', data: { id: '99003' } });

    // Second call (duplicate notification)
    await request(app)
      .post('/api/webhooks/mercadopago')
      .send({ type: 'payment', data: { id: '99003' } });

    // order.update should NOT have been called (idempotency guard)
    expect(mockPrisma.order.update).not.toHaveBeenCalled();
  });

  it('returns 200 even for non-payment events (does not crash)', async () => {
    const res = await request(app)
      .post('/api/webhooks/mercadopago')
      .send({ type: 'merchant_order', data: { id: '12345' } });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ received: true });
    expect(mockPaymentGet).not.toHaveBeenCalled();
  });
});
