import {
  BadRequestException,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { Candle } from './candle.type';
import { CandlesService } from './candles.service';

export const MIN_COUNT = 1;
export const MAX_COUNT = 1000;
export const COUNT_ERROR_MSG = `count must be between ${MIN_COUNT} and ${MAX_COUNT}`;

@Controller('candles')
export class CandlesController {
  constructor(private readonly candlesService: CandlesService) {}

  @Get(':symbol')
  async getHistoricalData(
    @Param('symbol') symbol: string,
    @Query('count', new DefaultValuePipe(300), ParseIntPipe) count: number,
    @Query('timeframe', new DefaultValuePipe('1Day')) timeframe: string,
  ): Promise<Candle[]> {
    if (count < MIN_COUNT || count > MAX_COUNT) {
      throw new BadRequestException(COUNT_ERROR_MSG);
    }
    return this.candlesService.getHistoricalData(symbol, count, timeframe);
  }

  @Get('config')
  getConfig() {
    const provider = process.env.MARKET_DATA_PROVIDER;
    return {
      defaultSymbol: provider === 'mock-provider' ? 'FAKE' : 'SPY',
      defaultTimeframe: '1Min',
    };
  }
}
