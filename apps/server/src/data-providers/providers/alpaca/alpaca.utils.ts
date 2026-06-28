import { Candle } from '../../../candles/candles.type';
import { AlpacaBar, AlpacaStreamBar } from './alpaca.types';

export const ALPACA_DATA_BASE_URL = 'https://data.alpaca.markets';

const DAY_MS = 86_400_000;

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
