import { Candle } from '../../../candles/candles.type';
import { AlpacaStreamBar } from './stream-bar.type';

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
