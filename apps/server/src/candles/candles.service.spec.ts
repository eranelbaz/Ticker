import { HttpException } from '@nestjs/common';
import { CandlesService } from './candles.service';
import * as fetchersModule from '../data-providers/fetchers';

jest.mock('../data-providers/fetchers', () => ({
  __esModule: true,
  fetchers: { alpaca: jest.fn() },
}));

const ORIGINAL_ENV = { ...process.env };

describe('CandlesService', () => {
  let service: CandlesService;
  let mockFetcher: jest.Mock;

  beforeEach(() => {
    service = new CandlesService();
    process.env.ALPACA_API_KEY_ID = 'test-key';
    process.env.ALPACA_API_SECRET_KEY = 'test-secret';
    mockFetcher = fetchersModule.fetchers.alpaca as jest.Mock;
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    jest.clearAllMocks();
  });

  it('delegates to the default alpaca fetcher', async () => {
    const testCandles = [
      { time: 1718659200, open: 1, high: 4, low: 0.5, close: 3, volume: 100 },
      { time: 1718745600, open: 2, high: 5, low: 1, close: 4, volume: 200 },
    ];
    mockFetcher.mockResolvedValue(testCandles);

    const candles = await service.getCandles('SPY', 2);

    expect(candles).toHaveLength(2);
    expect(candles[0].time).toBeLessThan(candles[1].time);
    expect(candles[0].close).toBe(3);
    expect(candles[1].close).toBe(4);
    expect(mockFetcher).toHaveBeenCalledWith('SPY', 2);
  });

  it('throws when provider is unknown', async () => {
    process.env.MARKET_DATA_PROVIDER = 'nonexistent';
    await expect(service.getCandles('SPY', 1)).rejects.toThrow(HttpException);
  });

  it('throws when fetcher throws', async () => {
    mockFetcher.mockRejectedValue(new Error('network error'));
    await expect(service.getCandles('SPY', 1)).rejects.toThrow('network error');
  });
});
