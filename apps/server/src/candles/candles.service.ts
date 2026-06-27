import { HttpException, HttpStatus, Injectable, Inject } from '@nestjs/common';
import { Candle } from './candle.type';
import { DataProvider, DATA_PROVIDER } from '../data-providers/providers';

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
}
