import { firstValueFrom, of } from 'rxjs';
import { toArray } from 'rxjs/operators';
import { CandlesService } from './candles.service';
import type { DataProvider } from '../data-providers/providers';
import { Candle } from './candles.type';

const bar = (time: number, close: number): Candle => ({
  time,
  open: close,
  high: close,
  low: close,
  close,
  volume: 1,
});

describe('CandlesService', () => {
  let provider: jest.Mocked<DataProvider>;
  let service: CandlesService;

  beforeEach(() => {
    provider = {
      getHistoricalData: jest.fn(),
      getStreamData: jest.fn(),
    };
    service = new CandlesService(provider);
  });

  describe('stream', () => {
    it('passes provider bars through without aggregating', async () => {
      const bars = [bar(100, 10), bar(160, 11), bar(220, 9)];
      provider.getStreamData.mockReturnValue(of(...bars));

      const emitted = await firstValueFrom(service.stream('SPY').pipe(toArray()));

      expect(emitted).toEqual(bars);
      expect(provider.getStreamData).toHaveBeenCalledWith('SPY');
    });
  });
});
