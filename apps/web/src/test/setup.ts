import '@testing-library/jest-dom';
import { server } from './server';

const g = globalThis as Record<string, unknown>;
g.__DEFAULT_SYMBOL__ ??= 'SPY';
g.__DEFAULT_TIMEFRAME__ ??= '1Min';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
