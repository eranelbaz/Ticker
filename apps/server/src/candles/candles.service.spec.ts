import { CandlesService } from './candles.service';

describe('CandlesService', () => {
  let service: CandlesService;

  beforeEach(() => {
    service = new CandlesService();
  });

  it('returns the requested number of candles', async () => {
    await expect(service.getCandles('BTCUSD', 100)).resolves.toHaveLength(100);
  });

  it('returns candles with valid OHLC ordering', async () => {
    const candles = await service.getCandles('BTCUSD', 50);
    for (const c of candles) {
      expect(c.high).toBeGreaterThanOrEqual(Math.max(c.open, c.close));
      expect(c.low).toBeLessThanOrEqual(Math.min(c.open, c.close));
      expect(c.low).toBeGreaterThan(0);
      expect(c.volume).toBeGreaterThan(0);
    }
  });

  it('returns candles in strictly increasing time order', async () => {
    const candles = await service.getCandles('BTCUSD', 50);
    for (let i = 1; i < candles.length; i++) {
      expect(candles[i].time).toBeGreaterThan(candles[i - 1].time);
    }
  });
});
