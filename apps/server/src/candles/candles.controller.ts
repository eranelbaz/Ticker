import {
  BadRequestException,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Query,
  MessageEvent,
  Sse,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Candle } from './candle.interface';
import { CandlesService } from './candles.service';
import { LiveCandlesService } from './live-candles.service';

const MIN_COUNT = 1;
const MAX_COUNT = 1000;

@Controller('candles')
export class CandlesController {
  constructor(
    private readonly candlesService: CandlesService,
    private readonly liveCandlesService: LiveCandlesService,
  ) {}

  @Get(':symbol')
  async getCandles(
    @Param('symbol') symbol: string,
    @Query('count', new DefaultValuePipe(300), ParseIntPipe) count: number,
    @Query('timeframe', new DefaultValuePipe('1Day')) timeframe: string,
  ): Promise<Candle[]> {
    if (count < MIN_COUNT || count > MAX_COUNT) {
      throw new BadRequestException(
        `count must be between ${MIN_COUNT} and ${MAX_COUNT}`,
      );
    }
    return this.candlesService.getCandles(symbol, count, timeframe);
  }

  @Sse(':symbol/stream')
  stream(
    @Param('symbol') symbol: string,
    @Query('timeframe', new DefaultValuePipe('1Min')) timeframe: string,
  ): Observable<MessageEvent> {
    return this.liveCandlesService.stream(symbol, timeframe).pipe(
      map((candle: Candle) => ({
        data: candle,
      })),
    );
  }
}
