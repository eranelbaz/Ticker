import { HttpException, HttpStatus, Injectable, Inject } from '@nestjs/common';
import type { DataProvider } from '../data-providers/providers';
import { DATA_PROVIDER } from '../data-providers/providers';
import { Candle } from './candles.type';
import { Observable } from 'rxjs';

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

  // Emits raw provider bars; the client folds them into the active timeframe
  // candle (see web foldLiveBar) so live updates align with historical times.
  stream(symbol: string, _timeframe: string): Observable<Candle> {
    return this.provider.getStreamData(symbol);
  }
}
