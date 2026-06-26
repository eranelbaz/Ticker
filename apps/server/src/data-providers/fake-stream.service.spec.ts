import { take, toArray } from 'rxjs/operators';
import { FakeStreamService } from './fake-stream.service';

const FAKE_SYMBOL = 'FAKEPACA';
const OTHER_SYMBOL = 'SPY';

describe('FakeStreamService', () => {
  let service: FakeStreamService;

  beforeEach(() => {
    service = new FakeStreamService();
  });

  it('emits bars at real wall-clock time (~1s apart, not 60s)', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-06-26T00:00:00Z'));
    const promise = service
      .minuteBars(OTHER_SYMBOL)
      .pipe(take(2), toArray())
      .toPromise();
    await jest.advanceTimersByTimeAsync(2000);
    const bars = (await promise)!;
    jest.useRealTimers();
    expect(bars[1].time - bars[0].time).toBe(1);
  });

  it('returns an observable', () => {
    const result = service.minuteBars(FAKE_SYMBOL);
    expect(result).toBeDefined();
    expect(typeof result.subscribe).toBe('function');
  });

  it('returns the same observable for the same symbol', () => {
    const obs1 = service.minuteBars(FAKE_SYMBOL);
    const obs2 = service.minuteBars(FAKE_SYMBOL);
    expect(obs1).toBe(obs2);
  });

  it('returns different observables for different symbols', () => {
    const obs1 = service.minuteBars(FAKE_SYMBOL);
    const obs2 = service.minuteBars(OTHER_SYMBOL);
    expect(obs1).not.toBe(obs2);
  });
});
