import { BadRequestException } from '@nestjs/common';
import { CandlesController } from './candles.controller';
import { CandlesService } from './candles.service';

describe('CandlesController', () => {
  let controller: CandlesController;
  let service: { getCandles: jest.Mock };

  beforeEach(() => {
    service = { getCandles: jest.fn() };
    controller = new CandlesController(service as unknown as CandlesService);
  });

  it('delegates to the service and returns its candles', async () => {
    const candles = [
      { time: 1, open: 1, high: 2, low: 0.5, close: 1.5, volume: 10 },
    ];
    service.getCandles.mockResolvedValue(candles);

    await expect(controller.getCandles('SPY', 10)).resolves.toEqual(candles);
    expect(service.getCandles).toHaveBeenCalledWith('SPY', 10);
  });

  it('rejects count above the maximum', async () => {
    await expect(controller.getCandles('SPY', 5000)).rejects.toThrow(
      BadRequestException,
    );
    expect(service.getCandles).not.toHaveBeenCalled();
  });

  it('rejects count below the minimum', async () => {
    await expect(controller.getCandles('SPY', -5)).rejects.toThrow(
      BadRequestException,
    );
    expect(service.getCandles).not.toHaveBeenCalled();
  });
});
