import { BadRequestException } from '@nestjs/common';
import { CandlesController } from './candles.controller';

describe('CandlesController', () => {
  let controller: CandlesController;
  let service: { getCandles: jest.Mock };

  beforeEach(() => {
    service = { getCandles: jest.fn() };
    controller = new CandlesController(service);
  });

  it('delegates to the service and returns its candles', async () => {
    const candles = [
      { time: 1, open: 1, high: 2, low: 0.5, close: 1.5, volume: 10 },
    ];
    service.getCandles.mockResolvedValue(candles);

    await expect(controller.getCandles('SPY', 10, '1Day')).resolves.toEqual(candles);
    expect(service.getCandles).toHaveBeenCalledWith('SPY', 10, '1Day');
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

  it('returns default symbol SPY when provider is not mock-provider', () => {
    process.env.MARKET_DATA_PROVIDER = 'alpaca';
    expect(controller.getConfig()).toEqual({
      defaultSymbol: 'SPY',
      defaultTimeframe: '1Min',
    });
  });

  it('returns default symbol FAKEPACA when provider is mock-provider', () => {
    process.env.MARKET_DATA_PROVIDER = 'mock-provider';
    expect(controller.getConfig()).toEqual({
      defaultSymbol: 'FAKEPACA',
      defaultTimeframe: '1Min',
    });
  });

  it('returns default symbol SPY when provider is unset', () => {
    delete process.env.MARKET_DATA_PROVIDER;
    expect(controller.getConfig()).toEqual({
      defaultSymbol: 'SPY',
      defaultTimeframe: '1Min',
    });
  });
});
