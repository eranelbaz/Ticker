import {
  BadRequestException,
  Controller,
  DefaultValuePipe,
  Get,
  Inject,
  Param,
  ParseIntPipe,
  Query,
  Sse,
} from '@nestjs/common';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { Candle } from './candles.type';
import { CandlesService } from './candles.service';
import { historyCountSchema, HISTORY_COUNT_MIN, HISTORY_COUNT_MAX } from './history-count.schema';

export const COUNT_ERROR_MSG = `count must be between ${HISTORY_COUNT_MIN} and ${HISTORY_COUNT_MAX}`;

@Controller('candles')
export class CandlesController {
  constructor(
    private readonly candlesService: CandlesService,
  ) {}

  @Get('config')
  getConfig() {
    const provider = process.env.MARKET_DATA_PROVIDER;
    return {
      defaultSymbol: provider === 'mock-provider' ? 'FAKE' : 'SPY',
      defaultTimeframe: '1Min',
    };
  }

  @Get(':symbol/stream')
  @Sse()
  stream(
    @Param('symbol') symbol: string,
    @Query('timeframe') timeframe: string,
  ): Observable<MessageEvent> {
    return this.candlesService.stream(symbol, timeframe).pipe(
      map((candle) => new MessageEvent('message', { data: JSON.stringify(candle) })),
    );
  }

  @Get(':symbol/history')
  async getHistoricalData(
    @Param('symbol') symbol: string,
    @Query('count', new DefaultValuePipe(300), ParseIntPipe) count: number,
    @Query('timeframe', new DefaultValuePipe('1Min')) timeframe: string,
  ): Promise<Candle[]> {
    try {
      historyCountSchema.parse(count);
    } catch {
      throw new BadRequestException(COUNT_ERROR_MSG);
    }
    return this.candlesService.getHistoricalData(symbol, count, timeframe);
  }
}
