import { HttpException } from '@nestjs/common';
import axios, { AxiosResponse } from 'axios';
import { CandlesService } from './candles.service';

const ORIGINAL_ENV = { ...process.env };

function mockGetResolves(body: unknown) {
  (axios.get as jest.Mock).mockResolvedValue({ data: body } as AxiosResponse);
}

describe('CandlesService', () => {
  let service: CandlesService;
  let mockGetSpy: jest.SpyInstance;

  beforeEach(() => {
    service = new CandlesService();
    process.env.ALPACA_API_KEY_ID = 'test-key';
    process.env.ALPACA_API_SECRET_KEY = 'test-secret';
    mockGetSpy = jest
      .spyOn(axios, 'get')
      .mockResolvedValue({ data: { bars: [] } });
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    jest.clearAllMocks();
    mockGetSpy.mockRestore();
  });

  it('fetches bars and maps them to candles sorted ascending by time', async () => {
    mockGetResolves({
      symbol: 'SPY',
      next_page_token: null,
      bars: [
        { t: '2026-06-19T04:00:00Z', o: 2, h: 5, l: 1, c: 4, v: 200 },
        { t: '2026-06-18T04:00:00Z', o: 1, h: 4, l: 0.5, c: 3, v: 100 },
      ],
    });

    const candles = await service.getCandles('SPY', 2);

    expect(candles).toHaveLength(2);
    expect(candles[0].time).toBeLessThan(candles[1].time);
    expect(candles[0].close).toBe(3);
    expect(candles[1].close).toBe(4);
  });

  it('sends the Alpaca credential headers', async () => {
    mockGetResolves({
      next_page_token: null,
      bars: [{ t: '2026-06-18T04:00:00Z', o: 1, h: 4, l: 0.5, c: 3, v: 100 }],
    });

    await service.getCandles('SPY', 1);

    const call = mockGetSpy.mock.calls.at(-1) as [string, Record<string, unknown>];
    expect(call?.[1]?.['headers']?.['APCA-API-KEY-ID']).toBe('test-key');
    expect(call?.[1]?.['headers']?.['APCA-API-SECRET-KEY']).toBe('test-secret');
  });

  it('throws when provider is unknown', async () => {
    process.env.MARKET_DATA_PROVIDER = 'nonexistent';
    await expect(service.getCandles('SPY', 1)).rejects.toThrow(HttpException);
  });

  it('throws when credentials are missing', async () => {
    delete process.env.ALPACA_API_KEY_ID;
    delete process.env.ALPACA_API_SECRET_KEY;
    await expect(service.getCandles('SPY', 1)).rejects.toThrow(
      'Alpaca API credentials are not configured',
    );
  });

  it('throws when Alpaca returns no bars', async () => {
    mockGetResolves({ bars: null, next_page_token: null });
    await expect(service.getCandles('SPY', 1)).rejects.toThrow(
      'No market data returned for symbol SPY',
    );
  });

  it('throws on network failure', async () => {
    mockGetSpy.mockRejectedValue(new Error('boom'));
    await expect(service.getCandles('SPY', 1)).rejects.toThrow('boom');
  });
});
