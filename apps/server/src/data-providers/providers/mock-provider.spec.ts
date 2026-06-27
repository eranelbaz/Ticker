import { MockProvider } from './mock-provider';
import { timeframeToSeconds } from './timeframe';

const FAKE_SYMBOL = 'FAKE';
const OTHER_SYMBOL = 'SPY';
const FAKE_BASE_PRICE = 100;
const FAKE_VOLATILITY = 0.002;

describe('MockProvider', () => {
  let provider: MockProvider;

  beforeEach(() => {
    provider = new MockProvider();
  });

  describe('getHistoricalData', () => {
    it('returns an array of candles', async () => {
      const candles = await provider.getHistoricalData(FAKE_SYMBOL, 5);
      expect(candles).toHaveLength(5);
    });

    it('returns candles sorted ascending by time', async () => {
      const candles = await provider.getHistoricalData(FAKE_SYMBOL, 10);
      for (let i = 1; i < candles.length; i++) {
        expect(candles[i].time).toBeGreaterThan(candles[i - 1].time);
      }
    });

    it('generates candles with a base price near 100 for FAKE', async () => {
      const candles = await provider.getHistoricalData(FAKE_SYMBOL, 5);
      const margin = FAKE_BASE_PRICE * FAKE_VOLATILITY;
      for (const candle of candles) {
        expect(candle.open).toBeGreaterThanOrEqual(FAKE_BASE_PRICE - margin);
        expect(candle.open).toBeLessThanOrEqual(FAKE_BASE_PRICE + margin);
      }
    });

    it('respects the count parameter', async () => {
      const candles = await provider.getHistoricalData(FAKE_SYMBOL, 20);
      expect(candles).toHaveLength(20);
    });

    it('returns empty array when count is 0', async () => {
      const candles = await provider.getHistoricalData(FAKE_SYMBOL, 0);
      expect(candles).toHaveLength(0);
    });

    it('returns empty array when count is negative', async () => {
      const candles = await provider.getHistoricalData(FAKE_SYMBOL, -5);
      expect(candles).toHaveLength(0);
    });

    it('spaces candles by the requested timeframe', async () => {
      const candles = await provider.getHistoricalData(FAKE_SYMBOL, 3, '1Hour');
      const gap = candles[1].time - candles[0].time;
      expect(gap).toBe(timeframeToSeconds('1Hour'));
    });

    it('uses the same base price for all symbols', async () => {
      const fakeCandles = await provider.getHistoricalData(FAKE_SYMBOL, 5);
      const spyCandles = await provider.getHistoricalData(OTHER_SYMBOL, 5);
      expect(fakeCandles[0].open).toBe(spyCandles[0].open);
    });
  });

  describe('getStreamData', () => {
    it('returns an observable', () => {
      const stream = provider.getStreamData(FAKE_SYMBOL);
      expect(stream).toBeDefined();
    });

    it('caches streams by symbol', () => {
      const stream1 = provider.getStreamData(FAKE_SYMBOL);
      const stream2 = provider.getStreamData(FAKE_SYMBOL);
      expect(stream1).toBe(stream2);
    });
  });
});
