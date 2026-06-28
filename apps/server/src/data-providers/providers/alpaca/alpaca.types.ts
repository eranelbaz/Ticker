import { z } from 'zod';
import { Candle } from '../../../candles/candles.type';

export const ALPACA_DATA_BASE_URL = 'https://data.alpaca.markets';

const DAY_MS = 86_400_000;

export type AlpacaBar = {
  t: string;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
  n?: number;
  vw?: number;
};

export type AlpacaBarsResponse = {
  bars: AlpacaBar[] | null;
  symbol?: string;
  next_page_token: string | null;
};

export const alpacaStreamBarSchema = z.object({
  T: z.literal('b'),
  S: z.string(),
  o: z.number(),
  h: z.number(),
  l: z.number(),
  c: z.number(),
  v: z.number(),
  t: z.string(),
  n: z.number().optional(),
  vw: z.number().optional(),
});

export type AlpacaStreamBar = z.infer<typeof alpacaStreamBarSchema>;

export interface WebSocketLike {
  send(data: string): void;
  close(): void;
  readyState?: number;
  addEventListener(type: string, listener: (event: { data: string }) => void): void;
  removeEventListener(type: string, listener: (event: { data: string }) => void): void;
}

export type WebSocketFactory = () => WebSocketLike;

export function buildBarsUrl(symbol: string, count: number, now: Date = new Date()): string {
  const start = new Date(now.getTime() - (count * 2 + 5) * DAY_MS);
  const params = new URLSearchParams({
    timeframe: '1Day',
    feed: 'iex',
    sort: 'desc',
    limit: String(count),
    start: start.toISOString(),
    end: now.toISOString(),
  });
  return `${ALPACA_DATA_BASE_URL}/v2/stocks/${symbol}/bars?${params.toString()}`;
}

export function mapBar(bar: AlpacaBar): Candle {
  return {
    time: Math.floor(Date.parse(bar.t) / 1000),
    open: bar.o,
    high: bar.h,
    low: bar.l,
    close: bar.c,
    volume: bar.v,
  };
}

export function buildAuthMessage(key: string, secret: string): string {
  return JSON.stringify({ action: 'auth', key, secret });
}

export function buildSubscribeMessage(symbols: string[]): string {
  return JSON.stringify({ action: 'subscribe', bars: symbols });
}

export function mapStreamBar(bar: AlpacaStreamBar): Candle {
  return {
    time: Math.floor(Date.parse(bar.t) / 1000),
    open: bar.o,
    high: bar.h,
    low: bar.l,
    close: bar.c,
    volume: bar.v,
  };
}
