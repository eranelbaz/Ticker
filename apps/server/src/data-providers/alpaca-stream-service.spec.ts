import { firstValueFrom } from 'rxjs';
import { AlpacaStreamService } from './alpaca-stream.service';
import { buildAuthMessage, buildSubscribeMessage, mapStreamBar } from './alpaca-stream-messages';
<<<<<<< HEAD
import { Candle } from '../candles/candle.interface';
=======
import { Candle } from '../candles/candle.type';
>>>>>>> origin/main

describe('AlpacaStreamService', () => {
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
    const service = new AlpacaStreamService();
    expect(() => service.minuteBars('SPY')).toThrow('Alpaca API credentials are not configured');
  });

  describe('minuteBars', () => {
    it('emits a mapped bar for the subscribed symbol', async () => {
      const fakeSocket = new FakeSocket();
      const service = new AlpacaStreamService(() => fakeSocket);

      const obs = service.minuteBars('SPY');

      fakeSocket.simulateOpen();
      fakeSocket.simulateAuthenticated();

      // Subscribe before emitting the bar so the value is not dropped
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
      const service = new AlpacaStreamService(() => fakeSocket);

      const obs = service.minuteBars('SPY');

      fakeSocket.simulateOpen();
      fakeSocket.simulateAuthenticated();

      // Subscribe before emitting bars
      const subscriptionPromise = firstValueFrom(obs);

      // Emit a bar for a different symbol
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

      // Emit a bar for SPY
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
      const service = new AlpacaStreamService(() => fakeSocket);
      // Call minuteBars to trigger connect()
      service.minuteBars('SPY');
      fakeSocket.simulateOpen();
      expect(fakeSocket.sentMessages[0]).toBe(
        buildAuthMessage('test-key', 'test-secret'),
      );
    });

    it('sends subscribe message on authenticated', () => {
      const fakeSocket = new FakeSocket();
      const service = new AlpacaStreamService(() => fakeSocket);
      service.minuteBars('SPY');
      fakeSocket.simulateOpen();
      fakeSocket.simulateAuthenticated();
      expect(fakeSocket.sentMessages[1]).toBe(
        buildSubscribeMessage(['SPY']),
      );
    });

    it('reuses the connection for a second symbol subscription', async () => {
      const fakeSocket = new FakeSocket();
      const service = new AlpacaStreamService(() => fakeSocket);

      const obs1 = service.minuteBars('SPY');
      fakeSocket.simulateOpen();
      fakeSocket.simulateAuthenticated();

      // Now subscribe to a second symbol - should reuse existing connection
      const obs2 = service.minuteBars('AAPL');
      fakeSocket.simulateAuthenticated();

      // The last subscribe message should include both symbols
      const lastSubscribe = fakeSocket.sentMessages
        .filter((m) => JSON.parse(m).action === 'subscribe')
        .pop();
      expect(lastSubscribe).toBe(
        buildSubscribeMessage(['SPY', 'AAPL']),
      );

      // Subscribe before emitting the bar
      const subscriptionPromise = firstValueFrom(obs2);

      // Emit a bar for AAPL
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
});

/**
 * Fake WebSocket that simulates the Alpaca real-time WebSocket protocol.
 */
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
<<<<<<< HEAD
    this._emit('message', [{ data: JSON.stringify([{ T: 'success', msg: 'authenticated' }]) }]);
  }

  simulateMessage(raw: string): void {
    // Alpaca batches messages into a JSON array.
    this._emit('message', [{ data: `[${raw}]` }]);
=======
    this._emit('message', [{ data: JSON.stringify({ T: 'status', status: 'authenticated', message: 'authenticated' }) }]);
  }

  simulateMessage(raw: string): void {
    this._emit('message', [{ data: raw }]);
>>>>>>> origin/main
  }

  private _emit(type: string, args: any[]): void {
    this._listeners.get(type)?.forEach((fn) => fn(...args));
  }
}
