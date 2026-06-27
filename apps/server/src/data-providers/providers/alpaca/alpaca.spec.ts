import axios from 'axios';
import { AlpacaProvider, buildBarsUrl, mapBar } from './index';

describe('AlpacaProvider', () => {
  let provider: AlpacaProvider;
  let getSpy: jest.SpyInstance;

  beforeEach(() => {
    provider = new AlpacaProvider();
    getSpy = jest.spyOn(axios, 'get');
  });

  afterEach(() => {
    getSpy.mockRestore();
  });

  describe('getHistoricalData', () => {
    it('throws when API credentials are missing', async () => {
      delete process.env.ALPACA_API_KEY_ID;
      delete process.env.ALPACA_API_SECRET_KEY;

      await expect(provider.getHistoricalData('AAPL', 5)).rejects.toThrow(
        'Alpaca API credentials are not configured',
      );
      expect(getSpy).not.toHaveBeenCalled();
    });

    it('throws when API credentials are empty', async () => {
      process.env.ALPACA_API_KEY_ID = '';
      process.env.ALPACA_API_SECRET_KEY = '';

      await expect(provider.getHistoricalData('AAPL', 5)).rejects.toThrow(
        'Alpaca API credentials are not configured',
      );
    });

    it('throws when no bars returned', async () => {
      process.env.ALPACA_API_KEY_ID = 'test-key';
      process.env.ALPACA_API_SECRET_KEY = 'test-secret';
      getSpy.mockResolvedValue({ data: { bars: null, next_page_token: null } });

      await expect(provider.getHistoricalData('AAPL', 5)).rejects.toThrow(
        'No market data returned for symbol AAPL',
      );
    });

    it('maps bars and returns sorted candles', async () => {
      process.env.ALPACA_API_KEY_ID = 'test-key';
      process.env.ALPACA_API_SECRET_KEY = 'test-secret';
      const mockBars = [
        { t: '2024-01-03T00:00:00Z', o: 150, h: 155, l: 148, c: 153, v: 100000 },
        { t: '2024-01-02T00:00:00Z', o: 148, h: 152, l: 146, c: 150, v: 90000 },
        { t: '2024-01-01T00:00:00Z', o: 145, h: 150, l: 144, c: 148, v: 80000 },
      ];
      getSpy.mockResolvedValue({ data: { bars: mockBars, next_page_token: null } });

      const result = await provider.getHistoricalData('AAPL', 3);

      expect(result).toHaveLength(3);
      expect(result[0].time).toBeLessThan(result[1].time);
      expect(result[1].time).toBeLessThan(result[2].time);
      expect(result[0].open).toBe(145);
      expect(result[0].high).toBe(150);
      expect(result[0].low).toBe(144);
      expect(result[0].close).toBe(148);
      expect(result[0].volume).toBe(80000);
      expect(getSpy).toHaveBeenCalledWith(
        expect.stringContaining('/v2/stocks/AAPL/bars'),
        expect.objectContaining({
          headers: {
            'APCA-API-KEY-ID': 'test-key',
            'APCA-API-SECRET-KEY': 'test-secret',
          },
          timeout: 10_000,
        }),
      );
    });

    it('throws when bars array is empty', async () => {
      process.env.ALPACA_API_KEY_ID = 'test-key';
      process.env.ALPACA_API_SECRET_KEY = 'test-secret';
      getSpy.mockResolvedValue({ data: { bars: [], next_page_token: null } });

      await expect(provider.getHistoricalData('AAPL', 5)).rejects.toThrow(
        'No market data returned for symbol AAPL',
      );
    });
  });

  describe('getStreamData', () => {
    it('throws with not implemented message', () => {
      expect(() => provider.getStreamData('AAPL')).toThrow(
        'Real-time streaming not implemented for alpaca provider',
      );
    });
  });
});

describe('buildBarsUrl', () => {
  it('generates correct URL with parameters', () => {
    const fixedDate = new Date('2024-01-10T00:00:00Z');
    const url = buildBarsUrl('AAPL', 10, fixedDate);

    expect(url).toContain('https://data.alpaca.markets/v2/stocks/AAPL/bars?');
    expect(url).toContain('timeframe=1Day');
    expect(url).toContain('feed=iex');
    expect(url).toContain('sort=desc');
    expect(url).toContain('limit=10');
    expect(url).toContain('start=');
    expect(url).toContain('end=2024-01-10T00%3A00%3A00.000Z');
  });

  it('calculates start date based on count', () => {
    const fixedDate = new Date('2024-01-10T00:00:00Z');
    const url = buildBarsUrl('AAPL', 5, fixedDate);

    // start = now - (5 * 2 + 5) * DAY_MS = now - 15 days = 2023-12-26
    expect(url).toContain('start=2023-12-26');
  });
});

describe('mapBar', () => {
  it('transforms AlpacaBar to Candle', () => {
    const bar = { t: '2024-01-05T00:00:00Z', o: 100, h: 105, l: 98, c: 102, v: 50000 };
    const candle = mapBar(bar);

    expect(candle.time).toBe(1704412800);
    expect(candle.open).toBe(100);
    expect(candle.high).toBe(105);
    expect(candle.low).toBe(98);
    expect(candle.close).toBe(102);
    expect(candle.volume).toBe(50000);
  });
});
