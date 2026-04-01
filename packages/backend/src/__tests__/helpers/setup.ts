/**
 * Test helpers: mock Prisma client, JWT generation, user factories, and env setup.
 */
import jwt from 'jsonwebtoken';

// ---------------------------------------------------------------------------
// Environment variables (set BEFORE any app code is imported)
// ---------------------------------------------------------------------------

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://star_test:star_test_password@localhost:5433/star_astrology_test';
process.env.REDIS_URL = 'redis://localhost:6380';
process.env.JWT_SECRET = 'test-jwt-secret-do-not-use-in-production';
process.env.JWT_ACCESS_EXPIRY = '15m';
process.env.JWT_REFRESH_EXPIRY = '7d';
process.env.FRONTEND_URL = 'http://localhost:5173';
process.env.MERCADO_PAGO_ACCESS_TOKEN = 'TEST-fake-mp-token';
process.env.EPHEMERIS_PATH = './data/ephe';

// ---------------------------------------------------------------------------
// Mock Prisma client
// ---------------------------------------------------------------------------

/**
 * Creates a deeply-mocked Prisma client where every model method returns
 * a jest.fn(). Call this once per test file and pass it to `jest.mock`.
 */
export function createMockPrismaClient() {
  const modelMethods = [
    'findUnique',
    'findFirst',
    'findMany',
    'create',
    'update',
    'updateMany',
    'delete',
    'deleteMany',
    'count',
    'upsert',
  ];

  const models = [
    'user',
    'birthProfile',
    'natalChart',
    'order',
    'product',
    'transitReport',
  ];

  const client: Record<string, Record<string, jest.Mock>> = {};
  for (const model of models) {
    client[model] = {};
    for (const method of modelMethods) {
      client[model][method] = jest.fn();
    }
  }

  return client;
}

// ---------------------------------------------------------------------------
// JWT helpers
// ---------------------------------------------------------------------------

const TEST_JWT_SECRET = process.env.JWT_SECRET!;

/**
 * Generate a valid access token for testing authenticated routes.
 */
export function generateTestAccessToken(userId: string, expiresIn = '15m'): string {
  return jwt.sign({ userId }, TEST_JWT_SECRET, { expiresIn });
}

/**
 * Generate a valid refresh token for testing the /refresh endpoint.
 */
export function generateTestRefreshToken(userId: string, expiresIn = '7d'): string {
  return jwt.sign({ userId }, TEST_JWT_SECRET, { expiresIn });
}

/**
 * Generate an expired token for testing expiry handling.
 */
export function generateExpiredToken(userId: string): string {
  return jwt.sign({ userId }, TEST_JWT_SECRET, { expiresIn: '0s' });
}

// ---------------------------------------------------------------------------
// Test user factory
// ---------------------------------------------------------------------------

let userCounter = 0;

export interface TestUser {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create a fake user object that matches the Prisma User model shape.
 * Does NOT insert into the database -- use with mocked Prisma methods.
 */
export function createTestUser(overrides: Partial<TestUser> = {}): TestUser {
  userCounter++;
  const now = new Date();
  return {
    id: overrides.id ?? `test-user-${userCounter}`,
    email: overrides.email ?? `user${userCounter}@test.com`,
    name: overrides.name ?? `Test User ${userCounter}`,
    // bcrypt hash of "password123" with 10 rounds
    passwordHash:
      overrides.passwordHash ??
      '$2b$10$K4GHe1bWfYqyJGBqQw0jXeJ7Jz8YGzKjG8Z5aYpQrR8yQV2qGzS2a',
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
  };
}

// ---------------------------------------------------------------------------
// Test birth profile factory
// ---------------------------------------------------------------------------

let profileCounter = 0;

export interface TestBirthProfile {
  id: string;
  userId: string;
  name: string;
  birthDate: Date;
  birthTime: string;
  birthCity: string;
  birthLatitude: number;
  birthLongitude: number;
  timezoneId: string;
  utcDatetime: Date;
  julianDay: number;
  createdAt: Date;
}

export function createTestBirthProfile(
  overrides: Partial<TestBirthProfile> = {},
): TestBirthProfile {
  profileCounter++;
  const now = new Date();
  return {
    id: overrides.id ?? `test-profile-${profileCounter}`,
    userId: overrides.userId ?? `test-user-1`,
    name: overrides.name ?? `Profile ${profileCounter}`,
    birthDate: overrides.birthDate ?? new Date('1990-06-15'),
    birthTime: overrides.birthTime ?? '14:30',
    birthCity: overrides.birthCity ?? 'Sao Paulo',
    birthLatitude: overrides.birthLatitude ?? -23.5505,
    birthLongitude: overrides.birthLongitude ?? -46.6333,
    timezoneId: overrides.timezoneId ?? 'America/Sao_Paulo',
    utcDatetime: overrides.utcDatetime ?? new Date('1990-06-15T17:30:00Z'),
    julianDay: overrides.julianDay ?? 2448057.2291667,
    createdAt: overrides.createdAt ?? now,
  };
}

// ---------------------------------------------------------------------------
// Test order factory
// ---------------------------------------------------------------------------

let orderCounter = 0;

export interface TestOrder {
  id: string;
  userId: string;
  productType: string;
  status: string;
  amount: number;
  mpPreferenceId: string | null;
  mpPaymentId: string | null;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export function createTestOrder(overrides: Partial<TestOrder> = {}): TestOrder {
  orderCounter++;
  const now = new Date();
  return {
    id: overrides.id ?? `test-order-${orderCounter}`,
    userId: overrides.userId ?? 'test-user-1',
    productType: overrides.productType ?? 'natal_chart',
    status: overrides.status ?? 'pending',
    amount: overrides.amount ?? 49.9,
    mpPreferenceId: overrides.mpPreferenceId ?? null,
    mpPaymentId: overrides.mpPaymentId ?? null,
    paidAt: overrides.paidAt ?? null,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
  };
}
