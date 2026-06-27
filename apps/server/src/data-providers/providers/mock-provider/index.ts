import { Injectable } from '@nestjs/common';
import { Observable, interval } from 'rxjs';
import { map } from 'rxjs/operators';
import { Candle } from '../../../candles/candles.type';
import { DataProvider } from '../types';
import { timeframeToSeconds } from '@ticker/shared';

function generateFakeCandles(
  symbol: string,
  count: number,
  timeframe: string = '1Day',
): Candle[] {
  const now = new Date();
  const candles: Candle[] = [];

  let basePrice = 100;
  const intervalSeconds = timeframeToSeconds(timeframe);
  if (intervalSeconds < 60) {
    throw new Error('sub-minute timeframes are not supported');
  }
  const nowSeconds = Math.floor(now.getTime() / 1000);

  for (let i = count; i > 0; i--) {
    const time = nowSeconds - i * intervalSeconds;
    const volatility = basePrice * 0.002;
    const change = (Math.random() - 0.5) * volatility;
    const close = basePrice + change;
    const open = basePrice;
    const high = Math.max(open, close) + Math.random() * volatility * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * 0.5;
    const volume = Math.floor(Math.random() * 100000) + 1000;

    candles.push({
      time,
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
      volume,
    });

    basePrice = close;
  }

  return candles.sort((a, b) => a.time - b.time);
}

const EMIT_INTERVAL_MS = 1000;

@Injectable()
export class MockProvider implements DataProvider {
  private readonly streams = new Map<string, Observable<Candle>>();

  getHistoricalData(symbol: string, count: number, timeframe: string): Promise<Candle[]> {
    return Promise.resolve(generateFakeCandles(symbol, count, timeframe));
  }

  getStreamData(symbol: string): Observable<Candle> {
    const existing = this.streams.get(symbol);
    if (existing) {
      return existing;
    }

    let basePrice = 100;

    const stream = interval(EMIT_INTERVAL_MS).pipe(
      map(() => {
        const volatility = basePrice * 0.002;
        const change = (Math.random() - 0.5) * volatility;
        const close = basePrice + change;
        const open = basePrice;
        const high = Math.max(open, close) + Math.random() * volatility * 0.5;
        const low = Math.min(open, close) - Math.random() * volatility * 0.5;
        const volume = Math.floor(Math.random() * 100000) + 1000;
        basePrice = close;

        return {
          time: Math.floor(Date.now() / 1000),
          open: Math.round(open * 100) / 100,
          high: Math.round(high * 100) / 100,
          low: Math.round(low * 100) / 100,
          close: Math.round(close * 100) / 100,
          volume,
        };
      }),
    );

    this.streams.set(symbol, stream);
    return stream;
  }
}
