import { Observable } from 'rxjs';
import { Candle } from '../candles/candle.type';

export type DataProvider = {
  getHistoricalData(symbol: string, count: number, timeframe: string): Promise<Candle[]>;
  getStreamData(symbol: string): Observable<Candle>;
};

export const DATA_PROVIDER = 'DATA_PROVIDER';
