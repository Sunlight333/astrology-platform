import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  moduleNameMapper: {
    '@star/shared': '<rootDir>/../shared/src',
  },
  testTimeout: 30000,
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
};

export default config;
