import { Observable } from 'rxjs';
import { Candle } from '../candles/candle.interface';

export const STREAM_SERVICE = 'STREAM_SERVICE';

export type StreamService = {
  minuteBars(symbol: string, _timeframe?: string): Observable<Candle>;
};
