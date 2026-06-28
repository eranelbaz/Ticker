module.exports = {
  testEnvironment: 'jest-fixed-jsdom',
  transform: {
    '^.+\\.(tsx?|mjs|js)$': [
      'ts-jest',
      { tsconfig: '<rootDir>/tsconfig.jest.json' },
    ],
  },
  transformIgnorePatterns: [
    '/\\.pnpm/(?!(msw|@mswjs|rettime|until-async|is-node-process|outvariant|headers-polyfill|strict-event-emitter|@open-draft|cookie|lightweight-charts)[@+])',
  ],
  moduleNameMapper: {
    '^@ticker/shared$':
      '<rootDir>/../../packages/shared/src/index.ts',
    '^@ticker/server$':
      '<rootDir>/../server/src/api.ts',
    '^lightweight-charts$':
      '<rootDir>/node_modules/lightweight-charts/dist/lightweight-charts.production.mjs',
  },
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
};
