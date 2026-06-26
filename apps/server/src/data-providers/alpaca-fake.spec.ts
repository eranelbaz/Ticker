import { createFakeFetcher } from './alpaca-fake';
import { timeframeToSeconds } from '../candles/timeframe';

describe('createFakeFetcher', () => {
  let fetcher: ReturnType<typeof createFakeFetcher>;

  beforeEach(() => {
    fetcher = createFakeFetcher();
  });

  it('returns an array of candles', async () => {
    const candles = await fetcher('FAKEPACA', 5);
    expect(candles).toHaveLength(5);
  });

  it('returns candles sorted ascending by time', async () => {
    const candles = await fetcher('FAKEPACA', 10);
    for (let i = 1; i < candles.length; i++) {
      expect(candles[i].time).toBeGreaterThan(candles[i - 1].time);
    }
  });

  it('generates candles with a base price near 100 for FAKEPACA', async () => {
    const candles = await fetcher('FAKEPACA', 5);
    for (const candle of candles) {
      expect(candle.open).toBeGreaterThanOrEqual(90);
      expect(candle.open).toBeLessThanOrEqual(110);
    }
  });

  it('generates candles with a base price near 50 for other symbols', async () => {
    const candles = await fetcher('SPY', 5);
    for (const candle of candles) {
      expect(candle.open).toBeGreaterThanOrEqual(40);
      expect(candle.open).toBeLessThanOrEqual(60);
    }
  });

  it('respects the count parameter', async () => {
    const candles = await fetcher('FAKEPACA', 20);
    expect(candles).toHaveLength(20);
  });

  it('returns empty array when count is 0', async () => {
    const candles = await fetcher('FAKEPACA', 0);
    expect(candles).toHaveLength(0);
  });

  it('returns empty array when count is negative', async () => {
    const candles = await fetcher('FAKEPACA', -5);
    expect(candles).toHaveLength(0);
  });

  it('spaces candles by the requested timeframe', async () => {
    const candles = await fetcher('FAKEPACA', 3, '1Hour');
    const gap = candles[1].time - candles[0].time;
    expect(gap).toBe(timeframeToSeconds('1Hour'));
  });
});
