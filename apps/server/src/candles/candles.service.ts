import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Candle } from './candle.interface';
import { ProviderName, fetchers } from '../data-providers/fetchers';

const DEFAULT_PROVIDER: ProviderName = 'alpaca';

@Injectable()
export class CandlesService {
  async getCandles(symbol: string, count: number): Promise<Candle[]> {
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
      return await fetcher(symbol, count);
    } catch (err) {
      throw new HttpException((err as Error).message, HttpStatus.BAD_GATEWAY);
    }
  }
}
