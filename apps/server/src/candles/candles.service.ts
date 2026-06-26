import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Candle } from './candle.interface';
import { ProviderName } from '../data-providers/providers.types';
import { createFetcher } from '../data-providers/alpaca';
import { createFakeFetcher } from '../data-providers/alpaca-fake';

const DEFAULT_PROVIDER: ProviderName = 'alpaca';

const fetchers: Record<
  ProviderName,
  (symbol: string, count: number, timeframe?: string) => Promise<Candle[]>
> = {
  alpaca: createFetcher(),
  'alpaca-fake': createFakeFetcher(),
};

@Injectable()
export class CandlesService {
  async getCandles(
    symbol: string,
    count: number,
    timeframe: string = '1Day',
  ): Promise<Candle[]> {
    const providerName: ProviderName =
      (process.env.MARKET_DATA_PROVIDER as ProviderName) ?? DEFAULT_PROVIDER;

    const fetcher = fetchers[providerName];
    if (!fetcher) {
      throw new HttpException(
        `Unknown market data provider: ${providerName}`,
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    try {
      return await fetcher(symbol, count, timeframe);
    } catch (err) {
      throw new HttpException((err as Error).message, HttpStatus.BAD_GATEWAY);
    }
  }
}
