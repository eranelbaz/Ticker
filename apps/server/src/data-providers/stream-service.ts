import { Observable } from 'rxjs';
import { Candle } from '../candles/candle.interface';

export const STREAM_SERVICE = 'STREAM_SERVICE';

/**
 * The `timeframe` parameter is accepted for API compatibility but ignored
 * because the stream delivers 1-minute bars; aggregation to the target
 * timeframe happens on the client side.
 */
export interface IStreamService {
  minuteBars(symbol: string, _timeframe?: string): Observable<Candle>;
}
