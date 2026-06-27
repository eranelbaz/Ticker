import { Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Candle } from '../candles/candle-type';
import { LiveCandlesService } from '../candles/candles.controller';
import { MockProvider } from './providers/mock-provider';

@Injectable()
export class MockLiveCandlesService implements LiveCandlesService {
  private readonly mockProvider = new MockProvider();
  private readonly streams = new Map<string, Observable<Candle>>();

  stream(symbol: string, _timeframe: string): Observable<Candle> {
    // Ignores _timeframe — delegates to mock-provider which emits at a fixed interval.
    // The client folds bars (foldLiveBar) so this works for all timeframes.
    const existing = this.streams.get(symbol);
    if (existing) {
      return existing;
    }

    const stream = this.mockProvider.getStreamData(symbol);
    this.streams.set(symbol, stream);
    return stream;
  }
}
