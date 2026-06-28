import { HttpException, HttpStatus, Injectable, Inject } from '@nestjs/common';
import type { DataProvider } from '../data-providers/providers';
import { DATA_PROVIDER } from '../data-providers/providers';
import { Candle } from './candles.type';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { timeframeToSeconds } from '@ticker/shared';

@Injectable()
export class CandlesService {
  constructor(
    @Inject(DATA_PROVIDER) private readonly provider: DataProvider,
  ) {}

  async getHistoricalData(symbol: string, count: number, timeframe: string = '1Day'): Promise<Candle[]> {
    try {
      return await this.provider.getHistoricalData(symbol, count, timeframe);
    } catch (err) {
      throw new HttpException((err as Error).message, HttpStatus.BAD_GATEWAY);
    }
  }

  stream(symbol: string, timeframe: string): Observable<Candle> {
    const timeframeSeconds = timeframeToSeconds(timeframe);
    let bucketTime: number | null = null;
    let open = 0;
    let high = -Infinity;
    let low = Infinity;
    let close = 0;
    let volume = 0;

    return this.provider.getStreamData(symbol).pipe(
      map((bar) => {
        const currentBucket = Math.floor(bar.time / timeframeSeconds) * timeframeSeconds;

        if (bucketTime === null || currentBucket !== bucketTime) {
          bucketTime = currentBucket;
          open = bar.open;
          high = bar.high;
          low = bar.low;
          close = bar.close;
          volume = bar.volume;
        } else {
          if (bar.high > high) high = bar.high;
          if (bar.low < low) low = bar.low;
          close = bar.close;
          volume += bar.volume;
        }

        return { time: bucketTime, open, high, low, close, volume };
      }),
    );
  }
}
