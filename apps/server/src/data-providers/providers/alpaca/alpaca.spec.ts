import axios from 'axios';
import { firstValueFrom } from 'rxjs';
import { AlpacaProvider, buildAuthMessage, buildBarsUrl, buildSubscribeMessage, mapBar, mapStreamBar } from './index';

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

      await expect(provider.getHistoricalData('AAPL', 5, '1Day')).rejects.toThrow(
        'Alpaca API credentials are not configured',
      );
      expect(getSpy).not.toHaveBeenCalled();
    });

    it('throws when API credentials are empty', async () => {
      process.env.ALPACA_API_KEY_ID = '';
      process.env.ALPACA_API_SECRET_KEY = '';

      await expect(provider.getHistoricalData('AAPL', 5, '1Day')).rejects.toThrow(
        'Alpaca API credentials are not configured',
      );
    });

    it('throws when no bars returned', async () => {
      process.env.ALPACA_API_KEY_ID = 'test-key';
      process.env.ALPACA_API_SECRET_KEY = 'test-secret';
      getSpy.mockResolvedValue({ data: { bars: null, next_page_token: null } });

      await expect(provider.getHistoricalData('AAPL', 5, '1Day')).rejects.toThrow(
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

      const result = await provider.getHistoricalData('AAPL', 3, '1Day');

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

      await expect(provider.getHistoricalData('AAPL', 5, '1Day')).rejects.toThrow(
        'No market data returned for symbol AAPL',
      );
    });
  });

  describe('getStreamData', () => {
    it('throws when credentials are missing', () => {
      delete process.env.ALPACA_API_KEY_ID;
      delete process.env.ALPACA_API_SECRET_KEY;
      expect(() => provider.getStreamData('AAPL')).toThrow('Alpaca API credentials are not configured');
    });

    it('returns an Observable when credentials are present', () => {
      process.env.ALPACA_API_KEY_ID = 'test-key';
      process.env.ALPACA_API_SECRET_KEY = 'test-secret';
      const obs = provider.getStreamData('AAPL');
      expect(typeof obs.subscribe).toBe('function');
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

describe('buildAuthMessage', () => {
  it('returns JSON with action auth and the provided credentials', () => {
    const msg = buildAuthMessage('key-123', 'secret-456');
    const parsed = JSON.parse(msg);
    expect(parsed).toEqual({
      action: 'auth',
      key: 'key-123',
      secret: 'secret-456',
    });
  });

  it('produces valid JSON string', () => {
    expect(() => JSON.parse(buildAuthMessage('k', 's'))).not.toThrow();
  });
});

describe('buildSubscribeMessage', () => {
  it('returns JSON with action subscribe and bars array of symbols', () => {
    const msg = buildSubscribeMessage(['SPY', 'AAPL']);
    const parsed = JSON.parse(msg);
    expect(parsed).toEqual({
      action: 'subscribe',
      bars: ['SPY', 'AAPL'],
    });
  });

  it('handles an empty symbols array', () => {
    const msg = buildSubscribeMessage([]);
    const parsed = JSON.parse(msg);
    expect(parsed).toEqual({
      action: 'subscribe',
      bars: [],
    });
  });

  it('produces valid JSON string', () => {
    expect(() => JSON.parse(buildSubscribeMessage(['X']))).not.toThrow();
  });
});

describe('mapStreamBar', () => {
  it('maps a stream bar to a Candle with Unix-second time', () => {
    const streamBar = {
      T: 'b' as const,
      S: 'SPY',
      o: 100,
      h: 105,
      l: 99,
      c: 103,
      v: 5000,
      t: '2026-06-19T04:00:00Z',
      n: 10,
      vw: 102.5,
    };
    const candle = mapStreamBar(streamBar);
    expect(candle).toEqual({
      time: Math.floor(Date.parse('2026-06-19T04:00:00Z') / 1000),
      open: 100,
      high: 105,
      low: 99,
      close: 103,
      volume: 5000,
    });
  });

  it('omits optional fields from the output Candle', () => {
    const streamBar = {
      T: 'b' as const,
      S: 'AAPL',
      o: 50,
      h: 52,
      l: 49,
      c: 51,
      v: 1000,
      t: '2026-01-01T00:00:00Z',
    };
    const candle = mapStreamBar(streamBar);
    expect(candle).not.toHaveProperty('S');
    expect(candle).not.toHaveProperty('T');
    expect(candle).not.toHaveProperty('n');
    expect(candle).not.toHaveProperty('vw');
  });

  it('handles bars without optional n and vw fields', () => {
    const streamBar = {
      T: 'b' as const,
      S: 'TSLA',
      o: 200,
      h: 210,
      l: 195,
      c: 205,
      v: 3000,
      t: '2026-03-15T20:00:00Z',
    };
    const candle = mapStreamBar(streamBar);
    expect(candle.open).toBe(200);
    expect(candle.volume).toBe(3000);
  });
});

describe('AlpacaProvider streaming', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, ALPACA_API_KEY_ID: 'test-key', ALPACA_API_SECRET_KEY: 'test-secret' };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('throws when credentials are missing', () => {
    delete process.env.ALPACA_API_KEY_ID;
    delete process.env.ALPACA_API_SECRET_KEY;
    const service = new AlpacaProvider();
    expect(() => service.getStreamData('SPY')).toThrow('Alpaca API credentials are not configured');
  });

  it('emits a mapped bar for the subscribed symbol', async () => {
    const fakeSocket = new FakeSocket();
    const service = new AlpacaProvider(() => fakeSocket);

    const obs = service.getStreamData('SPY');

    fakeSocket.simulateOpen();
    fakeSocket.simulateAuthenticated();

    const subscriptionPromise = firstValueFrom(obs);

    fakeSocket.simulateMessage(JSON.stringify({
      T: 'b',
      S: 'SPY',
      o: 150,
      h: 155,
      l: 148,
      c: 152,
      v: 10000,
      t: '2026-01-01T00:00:00.000Z',
    }));

    const candle = await subscriptionPromise;

    expect(candle).toEqual({
      time: Math.floor(Date.parse('2026-01-01T00:00:00.000Z') / 1000),
      open: 150,
      high: 155,
      low: 148,
      close: 152,
      volume: 10000,
    });
  });

  it('filters out bars for other symbols', async () => {
    const fakeSocket = new FakeSocket();
    const service = new AlpacaProvider(() => fakeSocket);

    const obs = service.getStreamData('SPY');

    fakeSocket.simulateOpen();
    fakeSocket.simulateAuthenticated();

    const subscriptionPromise = firstValueFrom(obs);

    fakeSocket.simulateMessage(JSON.stringify({
      T: 'b',
      S: 'AAPL',
      o: 100,
      h: 105,
      l: 98,
      c: 102,
      v: 5000,
      t: '2026-01-01T00:01:00.000Z',
    }));

    fakeSocket.simulateMessage(JSON.stringify({
      T: 'b',
      S: 'SPY',
      o: 150,
      h: 155,
      l: 148,
      c: 152,
      v: 10000,
      t: '2026-01-01T00:00:00.000Z',
    }));

    const candle = await subscriptionPromise;
    expect(candle.close).toBe(152);
  });

  it('sends auth message on open', () => {
    const fakeSocket = new FakeSocket();
    const service = new AlpacaProvider(() => fakeSocket);
    service.getStreamData('SPY');
    fakeSocket.simulateOpen();
    expect(fakeSocket.sentMessages[0]).toBe(
      buildAuthMessage('test-key', 'test-secret'),
    );
  });

  it('sends subscribe message on authenticated', () => {
    const fakeSocket = new FakeSocket();
    const service = new AlpacaProvider(() => fakeSocket);
    service.getStreamData('SPY');
    fakeSocket.simulateOpen();
    fakeSocket.simulateAuthenticated();
    expect(fakeSocket.sentMessages[1]).toBe(
      buildSubscribeMessage(['SPY']),
    );
  });

  it('reuses the connection for a second symbol subscription', async () => {
    const fakeSocket = new FakeSocket();
    const service = new AlpacaProvider(() => fakeSocket);

    const obs1 = service.getStreamData('SPY');
    fakeSocket.simulateOpen();
    fakeSocket.simulateAuthenticated();

    const obs2 = service.getStreamData('AAPL');
    fakeSocket.simulateAuthenticated();

    const lastSubscribe = fakeSocket.sentMessages
      .filter((m) => JSON.parse(m).action === 'subscribe')
      .pop();
    expect(lastSubscribe).toBe(
      buildSubscribeMessage(['SPY', 'AAPL']),
    );

    const subscriptionPromise = firstValueFrom(obs2);

    fakeSocket.simulateMessage(JSON.stringify({
      T: 'b',
      S: 'AAPL',
      o: 200,
      h: 205,
      l: 198,
      c: 202,
      v: 8000,
      t: '2026-01-01T00:00:00.000Z',
    }));

    const candle = await subscriptionPromise;
    expect(candle.close).toBe(202);
  });
});

class FakeSocket {
  sentMessages: string[] = [];
  onopen: (() => void) | null = null;
  onclose: ((...args: any[]) => void) | null = null;
  onerror: ((...args: any[]) => void) | null = null;
  private _listeners: Map<string, Set<(...args: any[]) => void>> = new Map();

  send(data: string): void {
    this.sentMessages.push(data);
  }

  close(): void {
    this.onclose?.();
  }

  addEventListener(type: string, listener: (...args: any[]) => void): void {
    if (!this._listeners.has(type)) {
      this._listeners.set(type, new Set());
    }
    this._listeners.get(type)!.add(listener);
  }

  removeEventListener(type: string, listener: (...args: any[]) => void): void {
    this._listeners.get(type)?.delete(listener);
  }

  simulateOpen(): void {
    this.onopen?.();
    this._emit('open', []);
  }

  simulateAuthenticated(): void {
    this._emit('message', [{ data: JSON.stringify({ T: 'status', status: 'authenticated', message: 'authenticated' }) }]);
  }

  simulateMessage(raw: string): void {
    this._emit('message', [{ data: raw }]);
  }

  private _emit(type: string, args: any[]): void {
    this._listeners.get(type)?.forEach((fn) => fn(...args));
  }
}
