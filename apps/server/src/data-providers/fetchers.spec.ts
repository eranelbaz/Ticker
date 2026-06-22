import axios from 'axios';
import { fetchers } from './fetchers';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const ORIGINAL_ENV = { ...process.env };

function mockGetResolves(body: unknown) {
  mockedAxios.get.mockResolvedValue({ data: body });
}

describe('fetchers.alpaca', () => {
  beforeEach(() => {
    process.env.ALPACA_API_KEY_ID = 'test-key';
    process.env.ALPACA_API_SECRET_KEY = 'test-secret';
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    jest.resetAllMocks();
  });

  it('fetches bars and maps them to candles sorted ascending', async () => {
    mockGetResolves({
      symbol: 'SPY',
      next_page_token: null,
      bars: [
        { t: '2026-06-19T04:00:00Z', o: 2, h: 5, l: 1, c: 4, v: 200 },
        { t: '2026-06-18T04:00:00Z', o: 1, h: 4, l: 0.5, c: 3, v: 100 },
      ],
    });

    const candles = await fetchers.alpaca('SPY', 2);

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

    await fetchers.alpaca('SPY', 1);

    const [, config] = mockedAxios.get.mock.calls[0];
    expect(config?.headers?.['APCA-API-KEY-ID']).toBe('test-key');
    expect(config?.headers?.['APCA-API-SECRET-KEY']).toBe('test-secret');
  });

  it('throws when credentials are missing', async () => {
    delete process.env.ALPACA_API_KEY_ID;
    delete process.env.ALPACA_API_SECRET_KEY;
    await expect(fetchers.alpaca('SPY', 1)).rejects.toThrow(
      'Alpaca API credentials are not configured',
    );
  });

  it('throws when Alpaca returns no bars', async () => {
    mockGetResolves({ bars: null, next_page_token: null });
    await expect(fetchers.alpaca('SPY', 1)).rejects.toThrow(
      'No market data returned for symbol SPY',
    );
  });

  it('throws on network failure', async () => {
    mockedAxios.get.mockRejectedValue(new Error('boom'));
    await expect(fetchers.alpaca('SPY', 1)).rejects.toThrow('boom');
  });
});
