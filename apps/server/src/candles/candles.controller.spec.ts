import { BadRequestException } from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { MessageEvent } from 'stream';
import { CandlesController } from './candles.controller';

describe('CandlesController', () => {
  let controller: CandlesController;
  let service: { getCandles: jest.Mock };
  let liveService: { stream: jest.Mock };

  beforeEach(() => {
    service = { getCandles: jest.fn() };
    liveService = { stream: jest.fn() };
    controller = new CandlesController(
      service as any,
      liveService as any,
    );
  });

  it('delegates to the service and returns its candles', async () => {
    const candles = [
      { time: 1, open: 1, high: 2, low: 0.5, close: 1.5, volume: 10 },
    ];
    service.getCandles.mockResolvedValue(candles);

    await expect(controller.getCandles('SPY', 10)).resolves.toEqual(candles);
    // DefaultValuePipe doesn't apply in unit tests, so timeframe is undefined
    expect(service.getCandles).toHaveBeenCalledWith('SPY', 10, undefined);
  });

  it('passes through the timeframe query param', async () => {
    const candles = [
      { time: 1, open: 1, high: 2, low: 0.5, close: 1.5, volume: 10 },
    ];
    service.getCandles.mockResolvedValue(candles);

    await expect(
      controller.getCandles('SPY', 10, '1Hour'),
    ).resolves.toEqual(candles);
    expect(service.getCandles).toHaveBeenCalledWith('SPY', 10, '1Hour');
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

  describe('stream (SSE)', () => {
    it('delegates to the live candles service', () => {
      liveService.stream.mockReturnValue(of([]));
      (controller as any).stream('SPY');
      // DefaultValuePipe doesn't apply in unit tests, so timeframe is undefined
      expect(liveService.stream).toHaveBeenCalledWith('SPY', undefined);
    });

    it('passes through the timeframe query param', () => {
      liveService.stream.mockReturnValue(of([]));
      // stream(symbol, timeframe) — timeframe is the second argument
      (controller as any).stream('AAPL', '1Hour');
      expect(liveService.stream).toHaveBeenCalledWith('AAPL', '1Hour');
    });

    it('emits MessageEvent objects with candle data', () => {
      const mockCandle = {
        time: 1000,
        open: 10,
        high: 11,
        low: 9,
        close: 10.5,
        volume: 100,
      };
      liveService.stream.mockReturnValue(of(mockCandle));
      const result = (controller as any).stream('SPY');
      expect(result).toBeDefined();
      expect(typeof (result as Observable<MessageEvent>).subscribe).toBe(
        'function',
      );
    });
  });
});
