module.exports = {
  testEnvironment: 'jest-fixed-jsdom',
  transform: {
    '^.+\\.(tsx?|mjs|js)$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.test.json' }],
  },
  transformIgnorePatterns: [
    '/\\.pnpm/(?!(msw|@mswjs|rettime|until-async|is-node-process|outvariant|headers-polyfill|strict-event-emitter|@open-draft|cookie|lightweight-charts)[@+])',
  ],
  moduleNameMapper: {
    '^lightweight-charts$': '<rootDir>/node_modules/lightweight-charts/dist/lightweight-charts.production.mjs',
  },
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
};
