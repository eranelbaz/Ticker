import { Subject } from 'rxjs';
import { toArray } from 'rxjs/operators';
import { LiveCandlesService } from './live-candles.service';
import { Candle } from './candle.interface';
import { DataProvider } from '../data-providers/providers';

describe('LiveCandlesService', () => {
  let liveService: LiveCandlesService;
  let dataProvider: DataProvider;
  let subject: Subject<Candle>;

  const bars: Candle[] = [
    { time: 1000, open: 10, high: 11, low: 9, close: 10.5, volume: 100 },
    { time: 1060, open: 10.5, high: 12, low: 10, close: 11, volume: 200 },
  ];

  beforeEach(() => {
    subject = new Subject<Candle>();
    dataProvider = {
      getHistoricalData: jest.fn(),
      getStreamData: jest.fn().mockReturnValue(subject),
    };
    liveService = new LiveCandlesService(dataProvider as never);
  });

  it('passes stream data through unchanged', async () => {
    const promise = liveService.stream('SPY').pipe(toArray()).toPromise();
    bars.forEach((b) => subject.next(b));
    subject.complete();
    await expect(promise).resolves.toEqual(bars);
  });

  it('subscribes to the data provider for the symbol', () => {
    liveService.stream('AAPL');
    expect(dataProvider.getStreamData).toHaveBeenCalledWith('AAPL');
  });
});
