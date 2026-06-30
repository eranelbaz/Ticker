import axios from 'axios';
import { firstValueFrom } from 'rxjs';
import { TradovateProvider } from './index';

const flush = () => new Promise((resolve) => setImmediate(resolve));

const FUTURE_ISO = '2099-01-01T00:00:00Z';

class FakeSocket {
  sentMessages: string[] = [];
  private listeners: Map<string, Set<(event: { data: string }) => void>> =
    new Map();

  send(data: string): void {
    this.sentMessages.push(data);
  }

  close(): void {}

  addEventListener(
    type: string,
    listener: (event: { data: string }) => void,
  ): void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(listener);
  }

  removeEventListener(
    type: string,
    listener: (event: { data: string }) => void,
  ): void {
    this.listeners.get(type)?.delete(listener);
  }

  private emit(raw: string): void {
    this.listeners.get('message')?.forEach((fn) => fn({ data: raw }));
  }

  simulateOpen(): void {
    this.emit('o');
  }

  simulateAuthorized(): void {
    this.emit(`a${JSON.stringify([{ i: 0, s: 200 }])}`);
  }

  simulateResponse(id: number, d: unknown): void {
    this.emit(`a${JSON.stringify([{ i: id, s: 200, d }])}`);
  }

  simulateChart(charts: unknown[]): void {
    this.emit(`a${JSON.stringify([{ e: 'chart', d: { charts } }])}`);
  }
}

const CREDS_ENV = {
  TRADOVATE_USERNAME: 'user',
  TRADOVATE_PASSWORD: 'pass',
  TRADOVATE_CID: '8',
  TRADOVATE_SECRET: 'secret',
  TRADOVATE_DEVICE_ID: 'device-1',
};

describe('TradovateProvider constructor', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, ...CREDS_ENV };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('throws when credentials are missing', () => {
    process.env = { ...originalEnv };
    delete process.env.TRADOVATE_USERNAME;
    expect(() => new TradovateProvider()).toThrow(
      'Tradovate API credentials are not configured',
    );
  });

  it('constructs when all required credentials are present', () => {
    expect(() => new TradovateProvider(() => new FakeSocket())).not.toThrow();
  });
});

describe('TradovateProvider connect + authorize', () => {
  const originalEnv = process.env;
  let postSpy: jest.SpyInstance;

  beforeEach(() => {
    process.env = { ...originalEnv, ...CREDS_ENV, TRADOVATE_ENV: 'demo' };
    postSpy = jest.spyOn(axios, 'post').mockResolvedValue({
      data: { mdAccessToken: 'md-token', expirationTime: FUTURE_ISO },
    });
  });

  afterEach(() => {
    postSpy.mockRestore();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('requests a token from the demo auth URL then sends the authorize frame on open', async () => {
    const fake = new FakeSocket();
    const provider = new TradovateProvider(() => fake);

    void provider.getStreamData('MESU6');
    await flush();

    expect(postSpy).toHaveBeenCalledWith(
      'https://demo.tradovateapi.com/v1/auth/accesstokenrequest',
      expect.objectContaining({
        name: 'user',
        cid: 8,
        sec: 'secret',
        deviceId: 'device-1',
      }),
      expect.objectContaining({ timeout: 10_000 }),
    );

    fake.simulateOpen();
    expect(fake.sentMessages[0]).toBe('authorize\n0\n\n"md-token"');
  });
});

describe('TradovateProvider getHistoricalData', () => {
  const originalEnv = process.env;
  let postSpy: jest.SpyInstance;

  beforeEach(() => {
    process.env = { ...originalEnv, ...CREDS_ENV };
    postSpy = jest.spyOn(axios, 'post').mockResolvedValue({
      data: { mdAccessToken: 'md-token', expirationTime: FUTURE_ISO },
    });
  });

  afterEach(() => {
    postSpy.mockRestore();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  const bar = (timestamp: string, close: number) => ({
    timestamp,
    open: close,
    high: close + 1,
    low: close - 1,
    close,
    upVolume: 10,
    downVolume: 5,
  });

  it('collects bars until eoh, cancels the chart, and returns sorted candles', async () => {
    const fake = new FakeSocket();
    const provider = new TradovateProvider(() => fake);

    const promise = provider.getHistoricalData('MESU6', 2, '1Min');
    await flush();
    fake.simulateOpen();
    fake.simulateAuthorized();
    await flush();

    expect(fake.sentMessages.some((m) => m.startsWith('md/getChart'))).toBe(
      true,
    );

    fake.simulateResponse(1, { historicalId: 10, realtimeId: 11 });
    await flush();

    fake.simulateChart([
      {
        id: 10,
        bars: [
          bar('2024-01-02T00:00:00Z', 200),
          bar('2024-01-01T00:00:00Z', 100),
        ],
      },
    ]);
    fake.simulateChart([{ id: 10, eoh: true }]);

    const candles = await promise;

    expect(candles).toHaveLength(2);
    expect(candles[0].close).toBe(100);
    expect(candles[1].close).toBe(200);
    expect(candles[0].time).toBeLessThan(candles[1].time);
    expect(candles[0].volume).toBe(15);
    expect(fake.sentMessages.some((m) => m.startsWith('md/cancelChart'))).toBe(
      true,
    );
  });

  it('throws when history is empty', async () => {
    const fake = new FakeSocket();
    const provider = new TradovateProvider(() => fake);

    const promise = provider.getHistoricalData('MESU6', 2, '1Min');
    await flush();
    fake.simulateOpen();
    fake.simulateAuthorized();
    await flush();
    fake.simulateResponse(1, { historicalId: 10, realtimeId: 11 });
    await flush();
    fake.simulateChart([{ id: 10, eoh: true }]);

    await expect(promise).rejects.toThrow(
      'No market data returned for symbol MESU6',
    );
  });
});

describe('TradovateProvider getStreamData', () => {
  const originalEnv = process.env;
  let postSpy: jest.SpyInstance;

  beforeEach(() => {
    process.env = { ...originalEnv, ...CREDS_ENV };
    postSpy = jest.spyOn(axios, 'post').mockResolvedValue({
      data: { mdAccessToken: 'md-token', expirationTime: FUTURE_ISO },
    });
  });

  afterEach(() => {
    postSpy.mockRestore();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  const liveBar = (timestamp: string, close: number) => ({
    timestamp,
    open: close,
    high: close + 1,
    low: close - 1,
    close,
    upVolume: 3,
    downVolume: 2,
  });

  it('returns an Observable', () => {
    const provider = new TradovateProvider(() => new FakeSocket());
    expect(typeof provider.getStreamData('MESU6').subscribe).toBe('function');
  });

  it('emits bars for the subscribed symbol on its subscription id', async () => {
    const fake = new FakeSocket();
    const provider = new TradovateProvider(() => fake);

    const obs = provider.getStreamData('MESU6');
    await flush();
    fake.simulateOpen();
    fake.simulateAuthorized();
    await flush();

    fake.simulateResponse(1, { historicalId: 20, realtimeId: 21 });
    await flush();

    const next = firstValueFrom(obs);

    fake.simulateChart([
      { id: 21, bars: [liveBar('2024-01-01T00:01:00Z', 150)] },
    ]);

    const candle = await next;
    expect(candle.close).toBe(150);
    expect(candle.volume).toBe(5);
  });

  it('reuses the same subject for repeat subscriptions to one symbol', () => {
    const provider = new TradovateProvider(() => new FakeSocket());
    const a = provider.getStreamData('MESU6');
    const b = provider.getStreamData('MESU6');
    expect(a).toBe(b);
  });
});

describe('TradovateProvider getStreamData stream failure recovery', () => {
  const originalEnv = process.env;
  let postSpy: jest.SpyInstance;

  beforeEach(() => {
    process.env = { ...originalEnv, ...CREDS_ENV };
  });

  afterEach(() => {
    postSpy?.mockRestore();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('evicts the errored symbol so a subsequent call returns a new observable', async () => {
    postSpy = jest
      .spyOn(axios, 'post')
      .mockRejectedValueOnce(new Error('network failure'));

    const provider = new TradovateProvider(() => new FakeSocket());

    const first = provider.getStreamData('MESU6');
    await flush();

    const firstError = firstValueFrom(first).then(
      () => null,
      (err: Error) => err,
    );

    const err = await firstError;
    expect(err).toBeInstanceOf(Error);

    const second = provider.getStreamData('MESU6');
    expect(second).not.toBe(first);
  });
});

describe('TradovateProvider credential-only auth (Path B)', () => {
  const originalEnv = process.env;
  let postSpy: jest.SpyInstance;

  afterEach(() => {
    postSpy?.mockRestore();
    process.env = originalEnv;
  });

  it('constructs with only username and password (no cid/sec)', () => {
    process.env = {
      ...originalEnv,
      TRADOVATE_USERNAME: 'user',
      TRADOVATE_PASSWORD: 'pass',
    };
    delete process.env.TRADOVATE_CID;
    delete process.env.TRADOVATE_SECRET;
    expect(() => new TradovateProvider(() => new FakeSocket())).not.toThrow();
  });

  it('omits cid and sec from the auth body when they are not configured', async () => {
    process.env = {
      ...originalEnv,
      TRADOVATE_USERNAME: 'user',
      TRADOVATE_PASSWORD: 'pass',
    };
    delete process.env.TRADOVATE_CID;
    delete process.env.TRADOVATE_SECRET;
    delete process.env.TRADOVATE_DEVICE_ID;
    postSpy = jest
      .spyOn(axios, 'post')
      .mockResolvedValue({ data: { mdAccessToken: 'md-token' } });

    const provider = new TradovateProvider(() => new FakeSocket());
    void provider.getStreamData('MESU6');
    await flush();

    const body = postSpy.mock.calls[0][1];
    expect(body).toEqual(
      expect.objectContaining({ name: 'user', password: 'pass' }),
    );
    expect(body).not.toHaveProperty('cid');
    expect(body).not.toHaveProperty('sec');
  });

  it('throws an actionable error when the auth response requires a captcha', async () => {
    process.env = {
      ...originalEnv,
      TRADOVATE_USERNAME: 'user',
      TRADOVATE_PASSWORD: 'pass',
    };
    postSpy = jest.spyOn(axios, 'post').mockResolvedValue({
      data: { 'p-ticket': 'tkt', 'p-time': 60, 'p-captcha': true },
    });

    const provider = new TradovateProvider(() => new FakeSocket());

    await expect(
      provider.getHistoricalData('MESU6', 2, '1Min'),
    ).rejects.toThrow(/captcha/i);
  });

  it('retries after a time penalty using the p-ticket and then authorizes', async () => {
    process.env = {
      ...originalEnv,
      TRADOVATE_USERNAME: 'user',
      TRADOVATE_PASSWORD: 'pass',
    };
    postSpy = jest
      .spyOn(axios, 'post')
      .mockResolvedValueOnce({ data: { 'p-ticket': 'tkt', 'p-time': 0 } })
      .mockResolvedValueOnce({ data: { mdAccessToken: 'md-token' } });

    const provider = new TradovateProvider(() => new FakeSocket());
    void provider.getStreamData('MESU6');

    await flush();
    await new Promise((resolve) => setTimeout(resolve, 0));
    await flush();

    expect(postSpy).toHaveBeenCalledTimes(2);
    expect(postSpy.mock.calls[1][1]).toEqual(
      expect.objectContaining({ 'p-ticket': 'tkt' }),
    );
  });
});
