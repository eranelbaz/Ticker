import { CandlesController } from './candles.controller';
import { CandlesService } from './candles.service';

describe('CandlesController', () => {
  let controller: CandlesController;
  let service: jest.Mocked<CandlesService>;

  beforeEach(() => {
    service = {
      getHistoricalData: jest.fn(),
    };
    controller = new CandlesController(service);
  });

  describe('GET /candles/:symbol', () => {
    it('returns candles from the service', async () => {
      const candles = [
        { time: 1, open: 1, high: 2, low: 0.5, close: 1.5, volume: 10 },
      ];
      service.getHistoricalData.mockResolvedValue(candles);

      await expect(controller.getHistoricalData('SPY', 10, '1Day')).resolves.toEqual(candles);
      expect(service.getHistoricalData).toHaveBeenCalledWith('SPY', 10, '1Day');
    });

    it('rejects count above the maximum', async () => {
      await expect(controller.getHistoricalData('SPY', 1001)).rejects.toThrow(
        'count must be between 1 and 1000',
      );
      expect(service.getHistoricalData).not.toHaveBeenCalled();
    });

    it('rejects count below the minimum', async () => {
      await expect(controller.getHistoricalData('SPY', 0)).rejects.toThrow(
        'count must be between 1 and 1000',
      );
      expect(service.getHistoricalData).not.toHaveBeenCalled();
    });

    it('rejects negative count', async () => {
      await expect(controller.getHistoricalData('SPY', -5)).rejects.toThrow(
        'count must be between 1 and 1000',
      );
      expect(service.getHistoricalData).not.toHaveBeenCalled();
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
