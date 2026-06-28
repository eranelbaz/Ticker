import { Injectable } from '@nestjs/common';
import { Observable, interval } from 'rxjs';
import { map } from 'rxjs/operators';
import { Candle } from '../../../candles/candles.type';
import { DataProvider } from '../types';
import { EMIT_INTERVAL_MS, generateFakeCandles, generateNextCandle } from './mock-provider.utils';

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
        const { candle, nextBasePrice } = generateNextCandle(basePrice, Math.floor(Date.now() / 1000));
        basePrice = nextBasePrice;
        return candle;
      }),
    );

    this.streams.set(symbol, stream);
    return stream;
  }
}
