import { foldLiveBar } from './liveAggregator';
import type { Candle } from '@ticker/server';

const c = (time: number, o: number, h: number, l: number, cl: number, v: number): Candle => ({
  time,
  open: o,
  high: h,
  low: l,
  close: cl,
  volume: v,
});

describe('foldLiveBar', () => {
  const dayTf = 86400;
  const lastDaily = c(1000, 10, 12, 9, 11, 100);

  it('merges a bar within the same bucket, keeping time and open', () => {
    const bar = c(1000 + 60, 11, 15, 8, 9, 50);
    expect(foldLiveBar(lastDaily, bar, dayTf)).toEqual(
      c(1000, 10, 15, 8, 9, 150),
    );
  });

  it('keeps merging successive bars in the same bucket', () => {
    const first = foldLiveBar(lastDaily, c(1060, 11, 13, 10, 12, 50), dayTf);
    const second = foldLiveBar(first, c(1120, 12, 16, 7, 14, 25), dayTf);
    expect(second).toEqual(c(1000, 10, 16, 7, 14, 175));
  });

  it('opens a new candle aligned to the grid when a bucket boundary passes', () => {
    const bar = c(1000 + dayTf + 30, 20, 25, 19, 24, 70);
    expect(foldLiveBar(lastDaily, bar, dayTf)).toEqual(
      c(1000 + dayTf, 20, 25, 19, 24, 70),
    );
  });

  it('skips empty buckets but stays on the grid (multiple tf ahead)', () => {
    const bar = c(1000 + 3 * dayTf + 5, 30, 31, 29, 30, 10);
    expect(foldLiveBar(lastDaily, bar, dayTf).time).toBe(1000 + 3 * dayTf);
  });

  it('works for a 1-minute chart too (tf=60)', () => {
    const last = c(600, 5, 6, 4, 5.5, 10);
    expect(foldLiveBar(last, c(630, 5.5, 7, 5, 6, 4), 60)).toEqual(
      c(600, 5, 7, 4, 6, 14),
    );
    expect(foldLiveBar(last, c(660, 6, 6.5, 5.8, 6.2, 3), 60)).toEqual(
      c(660, 6, 6.5, 5.8, 6.2, 3),
    );
  });
});
