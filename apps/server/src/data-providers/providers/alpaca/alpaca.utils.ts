import { timeframeToSeconds } from '@ticker/shared';
import { Candle } from '../../../candles/candles.type';
import { AlpacaBar, AlpacaStreamBar } from './alpaca.types';

export const ALPACA_DATA_BASE_URL = 'https://data.alpaca.markets';

export function buildBarsUrl(
  symbol: string,
  count: number,
  timeframe: string = '1Day',
  now: Date = new Date(),
): string {
  const lookbackMs = (count * 2 + 5) * timeframeToSeconds(timeframe) * 1000;
  const start = new Date(now.getTime() - lookbackMs);
  const params = new URLSearchParams({
    timeframe,
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
