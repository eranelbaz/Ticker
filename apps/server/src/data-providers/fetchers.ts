import { Candle } from '../candles/candle.interface';
import { createFetcher } from './alpaca';

export type ProviderName = 'alpaca';

export const fetchers: Record<
  ProviderName,
  (symbol: string, count: number) => Promise<Candle[]>
> = {
  alpaca: createFetcher(),
};
