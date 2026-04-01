// Jest configuration for @star/backend
// Uses ts-jest to transform TypeScript test files.

// Set minimal environment variables required by src/config/env.ts
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/star_test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-for-unit-tests';
process.env.NODE_ENV = 'test';

/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  roots: ['<rootDir>/src'],

  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.json',
        // Disable type-checking diagnostics in tests. The sweph native module
        // uses runtime APIs (swe_julday, SE_SUN, etc.) that differ from its
        // shipped .d.ts file. Production code works via `any` casts; disabling
        // diagnostics here avoids false TS errors during test runs.
        diagnostics: false,
      },
    ],
  },

  moduleNameMapper: {
    '^@star/shared$': '<rootDir>/../shared/src',
    '^@star/shared/(.*)$': '<rootDir>/../shared/src/$1',
    // Map the native sweph module to our TypeScript mock so tests run
    // without requiring a compiled C++ addon.
    '^sweph$': '<rootDir>/src/__mocks__/sweph.ts',
  },

  // Allow JSON fixture imports
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  // Test path patterns for selective runs:
  //   npm run test:unit      -> jest --testPathPattern=unit
  //   npm run test:accuracy  -> jest --testPathPattern=accuracy
  testMatch: [
    '<rootDir>/src/__tests__/**/*.test.ts',
  ],

  // Accuracy tests may involve heavy ephemeris calculations
  testTimeout: 30000,

  // Do not collect coverage from test/fixture files
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/__tests__/**',
    '!src/__fixtures__/**',
  ],
};
