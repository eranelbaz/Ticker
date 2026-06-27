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
import { Candle } from './candle-type';
import { CandlesService } from './candles-service';

export interface LiveCandlesService {
  stream(symbol: string, timeframe: string): Observable<Candle>;
}

export const LIVE_CANDLES_SERVICE = 'LIVE_CANDLES_SERVICE';

export const MIN_COUNT = 1;
export const MAX_COUNT = 1000;
export const COUNT_ERROR_MSG = `count must be between ${MIN_COUNT} and ${MAX_COUNT}`;

@Controller('candles')
export class CandlesController {
  constructor(
    private readonly candlesService: CandlesService,
    @Inject(LIVE_CANDLES_SERVICE)
    private readonly liveCandlesService: LiveCandlesService,
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
    return this.liveCandlesService.stream(symbol, timeframe).pipe(
      map((candle) => new MessageEvent('message', { data: JSON.stringify(candle) })),
    );
  }

  @Get(':symbol')
  async getHistoricalData(
    @Param('symbol') symbol: string,
    @Query('count', new DefaultValuePipe(300), ParseIntPipe) count: number,
    @Query('timeframe', new DefaultValuePipe('1Min')) timeframe: string,
  ): Promise<Candle[]> {
    if (count < MIN_COUNT || count > MAX_COUNT) {
      throw new BadRequestException(COUNT_ERROR_MSG);
    }
    return this.candlesService.getHistoricalData(symbol, count, timeframe);
  }
}
