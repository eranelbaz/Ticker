import {
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { Candle } from './candle.interface';
import { CandlesService } from './candles.service';

const MIN_COUNT = 1;
const MAX_COUNT = 1000;

@Controller('candles')
export class CandlesController {
  constructor(private readonly candlesService: CandlesService) {}

  @Get(':symbol')
  async getCandles(
    @Param('symbol') symbol: string,
    @Query('count', new DefaultValuePipe(300), ParseIntPipe) count: number,
  ): Promise<Candle[]> {
    const clamped = Math.min(Math.max(count, MIN_COUNT), MAX_COUNT);
    return this.candlesService.getCandles(symbol, clamped);
  }
}
