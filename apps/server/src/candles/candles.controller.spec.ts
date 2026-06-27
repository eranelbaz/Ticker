import { BadRequestException } from '@nestjs/common';
import { CandlesController } from './candles.controller';

describe('CandlesController', () => {
  let controller: CandlesController;
  let service: { getHistoricalData: jest.Mock };

  beforeEach(() => {
    service = { getHistoricalData: jest.fn() };
    controller = new CandlesController(service);
  });

  it('delegates to the service and returns its candles', async () => {
    const candles = [
      { time: 1, open: 1, high: 2, low: 0.5, close: 1.5, volume: 10 },
    ];
    service.getHistoricalData.mockResolvedValue(candles);

    await expect(controller.getHistoricalData('SPY', 10, '1Day')).resolves.toEqual(candles);
    expect(service.getHistoricalData).toHaveBeenCalledWith('SPY', 10, '1Day');
  });

  it('rejects count above the maximum', async () => {
    await expect(controller.getHistoricalData('SPY', 5000)).rejects.toThrow(
      BadRequestException,
    );
    expect(service.getHistoricalData).not.toHaveBeenCalled();
  });

  it('rejects count below the minimum', async () => {
    await expect(controller.getHistoricalData('SPY', -5)).rejects.toThrow(
      BadRequestException,
    );
    expect(service.getHistoricalData).not.toHaveBeenCalled();
  });

  it('returns default symbol SPY when provider is not mock-provider', () => {
    process.env.MARKET_DATA_PROVIDER = 'alpaca';
    expect(controller.getConfig()).toEqual({
      defaultSymbol: 'SPY',
      defaultTimeframe: '1Min',
    });
  });

  it('returns default symbol FAKE when provider is mock-provider', () => {
    process.env.MARKET_DATA_PROVIDER = 'mock-provider';
    expect(controller.getConfig()).toEqual({
      defaultSymbol: 'FAKE',
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
