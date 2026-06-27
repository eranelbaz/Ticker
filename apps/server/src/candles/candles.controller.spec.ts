import { MockProvider } from '../data-providers/providers';
import { CandlesController } from './candles.controller';
import { CandlesService } from './candles.service';

describe('CandlesController', () => {
  let controller: CandlesController;

  beforeEach(() => {
    process.env.MARKET_DATA_PROVIDER = 'mock-provider';
    const service = new CandlesService(new MockProvider());
    controller = new CandlesController(service);
  });

  afterEach(() => {
    delete process.env.MARKET_DATA_PROVIDER;
  });

  describe('GET /candles/:symbol', () => {
    it('returns candles from the provider', async () => {
      const candles = await controller.getHistoricalData('SPY', 5, '1Day');
      expect(candles).toHaveLength(5);
      expect(candles[0]).toHaveProperty('time');
      expect(candles[0]).toHaveProperty('open');
      expect(candles[0]).toHaveProperty('high');
      expect(candles[0]).toHaveProperty('low');
      expect(candles[0]).toHaveProperty('close');
      expect(candles[0]).toHaveProperty('volume');
    });

    it('returns candles sorted ascending by time', async () => {
      const candles = await controller.getHistoricalData('SPY', 10, '1Day');
      for (let i = 1; i < candles.length; i++) {
        expect(candles[i].time).toBeGreaterThan(candles[i - 1].time);
      }
    });

    it('rejects count above the maximum', async () => {
      await expect(controller.getHistoricalData('SPY', 1001)).rejects.toThrow(
        'count must be between 1 and 1000',
      );
    });

    it('rejects count below the minimum', async () => {
      await expect(controller.getHistoricalData('SPY', 0)).rejects.toThrow(
        'count must be between 1 and 1000',
      );
    });

    it('rejects negative count', async () => {
      await expect(controller.getHistoricalData('SPY', -5)).rejects.toThrow(
        'count must be between 1 and 1000',
      );
    });
  });

  describe('GET /candles/config', () => {
    it('returns FAKE as default symbol when mock-provider', () => {
      process.env.MARKET_DATA_PROVIDER = 'mock-provider';
      expect(controller.getConfig()).toEqual({
        defaultSymbol: 'FAKE',
        defaultTimeframe: '1Min',
      });
    });

    it('returns SPY as default symbol when alpaca', () => {
      process.env.MARKET_DATA_PROVIDER = 'alpaca';
      expect(controller.getConfig()).toEqual({
        defaultSymbol: 'SPY',
        defaultTimeframe: '1Min',
      });
    });

    it('returns SPY as default symbol when unset', () => {
      delete process.env.MARKET_DATA_PROVIDER;
      expect(controller.getConfig()).toEqual({
        defaultSymbol: 'SPY',
        defaultTimeframe: '1Min',
      });
    });
  });
});
