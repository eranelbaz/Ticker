import axios from 'axios';
import { firstValueFrom } from 'rxjs';
import { TradovateProvider } from './index';

const flush = () => new Promise((resolve) => setImmediate(resolve));

const FUTURE_ISO = '2099-01-01T00:00:00Z';

class FakeSocket {
  sentMessages: string[] = [];
  private listeners: Map<string, Set<(event: { data: string }) => void>> = new Map();

  send(data: string): void {
    this.sentMessages.push(data);
  }

  close(): void {}

  addEventListener(type: string, listener: (event: { data: string }) => void): void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(listener);
  }

  removeEventListener(type: string, listener: (event: { data: string }) => void): void {
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
    expect(() => new TradovateProvider()).toThrow('Tradovate API credentials are not configured');
  });

  it('constructs when all required credentials are present', () => {
    expect(() => new TradovateProvider(() => new FakeSocket())).not.toThrow();
  });
});
