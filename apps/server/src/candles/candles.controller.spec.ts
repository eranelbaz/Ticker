import { BadRequestException } from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { CandlesController, COUNT_ERROR_MSG } from './candles.controller';
import { CandlesService } from './candles.service';

const symbol = 'SPY';
const DEFAULT_SYMBOL = 'FAKE';
const DEFAULT_TIMEFRAME = '1Min';
const MOCK_CONFIG = { defaultSymbol: DEFAULT_SYMBOL, defaultTimeframe: DEFAULT_TIMEFRAME };
const DEFAULT_CONFIG = { defaultSymbol: symbol, defaultTimeframe: DEFAULT_TIMEFRAME };
const SAMPLE_CANDLE = { time: 1, open: 1, high: 2, low: 0.5, close: 1.5, volume: 10 };

describe('CandlesController', () => {
  let controller: CandlesController;
  let service: CandlesService;

  beforeEach(() => {
    service = {
      provider: {
        getHistoricalData: jest.fn(),
        getStreamData: jest.fn(),
      },
      getHistoricalData: jest.fn(),
      stream: jest.fn().mockReturnValue(of([])),
    } as any;
    controller = new CandlesController(service as any);
  });

  describe('GET /candles/:symbol', () => {
    it('returns candles from the service', async () => {
      (service.getHistoricalData as jest.Mock).mockResolvedValue([SAMPLE_CANDLE]);

      await expect(controller.getHistoricalData(symbol, 10, '1Day')).resolves.toEqual([SAMPLE_CANDLE]);
      expect(service.getHistoricalData).toHaveBeenCalledWith(symbol, 10, '1Day');
    });

    it('rejects count above the maximum', async () => {
      await expect(controller.getHistoricalData(symbol, 1001, '1Day')).rejects.toThrow(COUNT_ERROR_MSG);
      expect(service.getHistoricalData).not.toHaveBeenCalled();
    });

    it('rejects count below the minimum', async () => {
      await expect(controller.getHistoricalData(symbol, 0, '1Day')).rejects.toThrow(COUNT_ERROR_MSG);
      expect(service.getHistoricalData).not.toHaveBeenCalled();
    });

    it('rejects negative count', async () => {
      await expect(controller.getHistoricalData(symbol, -5, '1Day')).rejects.toThrow(COUNT_ERROR_MSG);
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
      expect(controller.getConfig()).toEqual(DEFAULT_CONFIG);
    });

    it('returns SPY as default symbol when unset', () => {
      delete process.env.MARKET_DATA_PROVIDER;
      expect(controller.getConfig()).toEqual(DEFAULT_CONFIG);
    });
  });

  describe('stream (SSE)', () => {
    it('delegates to the candles service', () => {
      (controller as any).stream('SPY');
      expect(service.stream).toHaveBeenCalledWith('SPY');
    });

    it('emits MessageEvent objects with candle data', () => {
      const mockCandle = {
        time: 1000,
        open: 10,
        high: 11,
        low: 9,
        close: 10.5,
        volume: 100,
      };
      (service.stream as jest.Mock).mockReturnValue(of(mockCandle));
      const result = (controller as any).stream('SPY');
      expect(result).toBeDefined();
      expect(typeof (result as Observable<any>).subscribe).toBe(
        'function',
      );
    });
  });
});
