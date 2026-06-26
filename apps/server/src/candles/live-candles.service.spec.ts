import { Subject } from 'rxjs';
import { toArray } from 'rxjs/operators';
import { LiveCandlesService } from './live-candles.service';
import { Candle } from './candle.interface';

describe('LiveCandlesService', () => {
  let liveService: LiveCandlesService;
  let streamService: { minuteBars: jest.Mock };
  let subject: Subject<Candle>;

  const bars: Candle[] = [
    { time: 1000, open: 10, high: 11, low: 9, close: 10.5, volume: 100 },
    { time: 1060, open: 10.5, high: 12, low: 10, close: 11, volume: 200 },
  ];

  beforeEach(() => {
    subject = new Subject<Candle>();
    streamService = { minuteBars: jest.fn().mockReturnValue(subject) };
    liveService = new LiveCandlesService(streamService as never);
  });

  it('passes minute bars through unchanged', async () => {
    const promise = liveService.stream('SPY', '1Day').pipe(toArray()).toPromise();
    bars.forEach((b) => subject.next(b));
    subject.complete();
    await expect(promise).resolves.toEqual(bars);
  });

  it('subscribes to the stream service for the symbol', () => {
    liveService.stream('AAPL', '1Hour');
    expect(streamService.minuteBars).toHaveBeenCalledWith('AAPL', '1Hour');
  });

  it('defaults timeframe to 1Min', () => {
    liveService.stream('SPY');
    expect(streamService.minuteBars).toHaveBeenCalledWith('SPY', '1Min');
  });
});
