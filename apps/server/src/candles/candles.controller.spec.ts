import { CandlesController } from './candles.controller';
import { CandlesService } from './candles.service';

const symbol = 'SPY';
const DEFAULT_SYMBOL = 'FAKE';
const DEFAULT_TIMEFRAME = '1Min';
const COUNT_ERROR_MSG = 'count must be between 1 and 1000';
const MOCK_CONFIG = { defaultSymbol: DEFAULT_SYMBOL, defaultTimeframe: DEFAULT_TIMEFRAME };
const ALPACA_CONFIG = { defaultSymbol: symbol, defaultTimeframe: DEFAULT_TIMEFRAME };
const SAMPLE_CANDLE = { time: 1, open: 1, high: 2, low: 0.5, close: 1.5, volume: 10 };

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
      service.getHistoricalData.mockResolvedValue([SAMPLE_CANDLE]);

      await expect(controller.getHistoricalData(symbol, 10, '1Day')).resolves.toEqual([SAMPLE_CANDLE]);
      expect(service.getHistoricalData).toHaveBeenCalledWith(symbol, 10, '1Day');
    });

    it('rejects count above the maximum', async () => {
      await expect(controller.getHistoricalData(symbol, 1001)).rejects.toThrow(COUNT_ERROR_MSG);
      expect(service.getHistoricalData).not.toHaveBeenCalled();
    });

    it('rejects count below the minimum', async () => {
      await expect(controller.getHistoricalData(symbol, 0)).rejects.toThrow(COUNT_ERROR_MSG);
      expect(service.getHistoricalData).not.toHaveBeenCalled();
    });

    it('rejects negative count', async () => {
      await expect(controller.getHistoricalData(symbol, -5)).rejects.toThrow(COUNT_ERROR_MSG);
      expect(service.getHistoricalData).not.toHaveBeenCalled();
    });
  });

  describe('GET /candles/config', () => {
    it('returns FAKE as default symbol when mock-provider', () => {
      process.env.MARKET_DATA_PROVIDER = 'mock-provider';
      expect(controller.getConfig()).toEqual(MOCK_CONFIG);
    });

    it('returns SPY as default symbol when alpaca', () => {
      process.env.MARKET_DATA_PROVIDER = 'alpaca';
      expect(controller.getConfig()).toEqual(ALPACA_CONFIG);
    });

    it('returns SPY as default symbol when unset', () => {
      delete process.env.MARKET_DATA_PROVIDER;
      expect(controller.getConfig()).toEqual(ALPACA_CONFIG);
    });
  });
});
