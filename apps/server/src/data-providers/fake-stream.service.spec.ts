import { take, toArray } from 'rxjs/operators';
import { FakeStreamService } from './fake-stream.service';

describe('FakeStreamService', () => {
  let service: FakeStreamService;

  beforeEach(() => {
    service = new FakeStreamService();
  });

  it('emits bars at real wall-clock time (~1s apart, not 60s)', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-06-26T00:00:00Z'));
    const promise = service
      .minuteBars('SPY')
      .pipe(take(2), toArray())
      .toPromise();
    await jest.advanceTimersByTimeAsync(2000);
    const bars = (await promise)!;
    jest.useRealTimers();
    // Real time: ~1s between emits. Old buggy code advanced 60s per emit.
    expect(bars[1].time - bars[0].time).toBe(1);
  });

  it('returns an observable', () => {
    const result = service.minuteBars('FAKEPACA');
    expect(result).toBeDefined();
    expect(typeof result.subscribe).toBe('function');
  });

  it('returns the same observable for the same symbol', () => {
    const obs1 = service.minuteBars('FAKEPACA');
    const obs2 = service.minuteBars('FAKEPACA');
    expect(obs1).toBe(obs2);
  });

  it('returns different observables for different symbols', () => {
    const obs1 = service.minuteBars('FAKEPACA');
    const obs2 = service.minuteBars('SPY');
    expect(obs1).not.toBe(obs2);
  });
});
