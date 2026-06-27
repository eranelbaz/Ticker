import { MockProvider } from './mock-provider/index';

describe('MockProvider', () => {
  let provider: MockProvider;

  beforeEach(() => {
    provider = new MockProvider();
  });

  describe('getHistoricalData', () => {
    it('returns candles with correct count', () => {
      return provider.getHistoricalData('AAPL', 5, '1Day').then((candles) => {
        expect(candles).toHaveLength(5);
      });
    });

    it('returns candles sorted by time ascending', () => {
      return provider.getHistoricalData('AAPL', 10, '1Day').then((candles) => {
        for (let i = 1; i < candles.length; i++) {
          expect(candles[i].time).toBeGreaterThan(candles[i - 1].time);
        }
      });
    });

    it('returns candles with valid price structure', () => {
      return provider.getHistoricalData('AAPL', 3, '1Hour').then((candles) => {
        for (const c of candles) {
          expect(c.high).toBeGreaterThanOrEqual(c.open);
          expect(c.high).toBeGreaterThanOrEqual(c.close);
          expect(c.low).toBeLessThanOrEqual(c.open);
          expect(c.low).toBeLessThanOrEqual(c.close);
          expect(c.volume).toBeGreaterThan(0);
        }
      });
    });

    it('supports Min timeframe', () => {
      return provider.getHistoricalData('AAPL', 2, '5Min').then((candles) => {
        expect(candles).toHaveLength(2);
        expect(candles[1].time - candles[0].time).toBe(5 * 60);
      });
    });

    it('supports Hour timeframe', () => {
      return provider.getHistoricalData('AAPL', 2, '1Hour').then((candles) => {
        expect(candles).toHaveLength(2);
        expect(candles[1].time - candles[0].time).toBe(3600);
      });
    });

    it('supports Day timeframe', () => {
      return provider.getHistoricalData('AAPL', 2, '1Day').then((candles) => {
        expect(candles).toHaveLength(2);
        expect(candles[1].time - candles[0].time).toBe(86400);
      });
    });
  });

  describe('getStreamData', () => {
    it('returns an Observable', () => {
      const obs = provider.getStreamData('AAPL');
      expect(typeof obs.subscribe).toBe('function');
    });

    it('emits candle objects with valid structure', (done) => {
      const obs = provider.getStreamData('AAPL');
      const sub = obs.subscribe({
        next: (candle) => {
          expect(candle).toHaveProperty('time');
          expect(candle).toHaveProperty('open');
          expect(candle).toHaveProperty('high');
          expect(candle).toHaveProperty('low');
          expect(candle).toHaveProperty('close');
          expect(candle).toHaveProperty('volume');
          expect(candle.high).toBeGreaterThanOrEqual(candle.open);
          expect(candle.high).toBeGreaterThanOrEqual(candle.close);
          expect(candle.low).toBeLessThanOrEqual(candle.open);
          expect(candle.low).toBeLessThanOrEqual(candle.close);
          sub.unsubscribe();
          done();
        },
        error: done,
      });
    });

    it('caches streams by symbol', (done) => {
      const obs1 = provider.getStreamData('AAPL');
      const obs2 = provider.getStreamData('AAPL');
      expect(obs1).toBe(obs2);
      done();
    });

    it('returns different streams for different symbols', () => {
      const obs1 = provider.getStreamData('AAPL');
      const obs2 = provider.getStreamData('GOOG');
      expect(obs1).not.toBe(obs2);
    });
  });
});
