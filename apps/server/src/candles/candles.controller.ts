import {
  BadRequestException,
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
  getCandles(
    @Param('symbol') symbol: string,
    @Query('count', new DefaultValuePipe(300), ParseIntPipe) count: number,
  ): Candle[] {
    if (count < MIN_COUNT || count > MAX_COUNT) {
      throw new BadRequestException(
        `count must be between ${MIN_COUNT} and ${MAX_COUNT}`,
      );
    }
    return this.candlesService.getCandles(symbol, count);
  }
}
