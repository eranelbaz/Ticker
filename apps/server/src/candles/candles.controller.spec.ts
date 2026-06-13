import { BadRequestException } from '@nestjs/common';
import { CandlesController } from './candles.controller';
import { CandlesService } from './candles.service';

describe('CandlesController', () => {
  let controller: CandlesController;

  beforeEach(() => {
    controller = new CandlesController(new CandlesService());
  });

  it('returns candles for a symbol', () => {
    expect(controller.getCandles('BTCUSD', 10)).toHaveLength(10);
  });

  it('rejects count above the maximum', () => {
    expect(() => controller.getCandles('BTCUSD', 5000)).toThrow(
      BadRequestException,
    );
  });

  it('rejects count below the minimum', () => {
    expect(() => controller.getCandles('BTCUSD', -5)).toThrow(
      BadRequestException,
    );
  });
});
