import { HttpException } from '@nestjs/common';
import axios, { AxiosError } from 'axios';
import { CandlesService } from './candles.service';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const ORIGINAL_ENV = { ...process.env };

function mockGetResolves(body: unknown) {
  mockedAxios.get.mockResolvedValue({ data: body });
}

describe('CandlesService', () => {
  let service: CandlesService;

  beforeEach(() => {
    service = new CandlesService();
    process.env.ALPACA_API_KEY_ID = 'test-key';
    process.env.ALPACA_API_SECRET_KEY = 'test-secret';
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    jest.resetAllMocks();
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

    const [, config] = mockedAxios.get.mock.calls[0];
    expect(config?.headers?.['APCA-API-KEY-ID']).toBe('test-key');
    expect(config?.headers?.['APCA-API-SECRET-KEY']).toBe('test-secret');
  });

  it('throws when credentials are missing', async () => {
    delete process.env.ALPACA_API_KEY_ID;
    delete process.env.ALPACA_API_SECRET_KEY;
    await expect(service.getCandles('SPY', 1)).rejects.toThrow(HttpException);
  });

  it('throws when Alpaca responds with a non-2xx status', async () => {
    const err = new AxiosError('Request failed');
    err.response = { status: 403 } as AxiosError['response'];
    mockedAxios.get.mockRejectedValue(err);
    await expect(service.getCandles('SPY', 1)).rejects.toThrow(HttpException);
  });

  it('throws when Alpaca returns no bars', async () => {
    mockGetResolves({ bars: null, next_page_token: null });
    await expect(service.getCandles('SPY', 1)).rejects.toThrow(HttpException);
  });

  it('throws when the network request fails', async () => {
    mockedAxios.get.mockRejectedValue(new Error('boom'));
    await expect(service.getCandles('SPY', 1)).rejects.toThrow(HttpException);
  });
});
