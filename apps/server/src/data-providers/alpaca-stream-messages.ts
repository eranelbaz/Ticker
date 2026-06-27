<<<<<<< HEAD
import { Candle } from '../candles/candle.interface';
=======
import { Candle } from '../candles/candle.type';
>>>>>>> origin/main

export type AlpacaStreamBar = {
  T: 'b';
  S: string;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
  t: string;
  n?: number;
  vw?: number;
};

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
