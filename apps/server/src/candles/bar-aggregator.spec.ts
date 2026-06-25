import { BarAggregator } from './bar-aggregator';
import { Candle } from './candle.interface';

function c(
  time: number,
  open: number,
  high: number,
  low: number,
  close: number,
  volume: number,
): Candle {
  return { time, open, high, low, close, volume };
}

describe('BarAggregator', () => {
  it('starts with the first bar as the current bucket', () => {
    const agg = new BarAggregator(60);
    const bar = c(1000, 10, 12, 9, 11, 100);
    // 1000 / 60 = 16.67, floor = 16, 16 * 60 = 960
    const result = agg.fold(bar);
    expect(result.time).toBe(960);
    expect(result.open).toBe(10);
    expect(result.high).toBe(12);
    expect(result.low).toBe(9);
    expect(result.close).toBe(11);
    expect(result.volume).toBe(100);
  });

  it('aggregates bars within the same bucket', () => {
    const agg = new BarAggregator(60);
    const base = c(1000, 10, 12, 9, 11, 100);
    expect(agg.fold(base)).toEqual(c(960, 10, 12, 9, 11, 100));

    // 1020 / 60 = 17, floor = 17, 17 * 60 = 1020 — new bucket
    const bar2 = c(1020, 15, 18, 8, 17, 200);
    expect(agg.fold(bar2)).toEqual(c(1020, 15, 18, 8, 17, 200));
  });

  it('resets on a new bucket', () => {
    const agg = new BarAggregator(60);
    const base = c(1000, 10, 12, 9, 11, 100);
    expect(agg.fold(base)).toEqual(c(960, 10, 12, 9, 11, 100));

    // 1030 / 60 = 17.17, floor = 17, 17 * 60 = 1020 — new bucket
    const same = c(1030, 15, 14, 13, 16, 50);
    expect(agg.fold(same)).toEqual(c(1020, 15, 14, 13, 16, 50));

    // 1080 / 60 = 18, floor = 18, 18 * 60 = 1080 — new bucket
    const next = c(1080, 20, 22, 18, 21, 300);
    expect(agg.fold(next)).toEqual(c(1080, 20, 22, 18, 21, 300));
  });

  it('returns a shallow copy so mutations dont affect the aggregator', () => {
    const agg = new BarAggregator(60);
    const bar = c(1000, 10, 12, 9, 11, 100);
    const result = agg.fold(bar);
    result.close = 999;
    const result2 = agg.fold(c(1060, 5, 6, 4, 5.5, 10));
    expect(result2.close).toBe(5.5);
  });

  it('works with 5-minute timeframe', () => {
    const agg = new BarAggregator(300);
    // 1000 / 300 = 3.33, floor = 3, 3 * 300 = 900
    const base = c(1000, 10, 12, 9, 11, 100);
    expect(agg.fold(base)).toEqual(c(900, 10, 12, 9, 11, 100));

    // 1100 / 300 = 3.67, floor = 3, 3 * 300 = 900 — same bucket
    const same = c(1100, 15, 14, 8, 16, 50);
    // open stays 10, high=max(12,14)=14, low=min(9,8)=8, close=16, volume=150
    expect(agg.fold(same)).toEqual(c(900, 10, 14, 8, 16, 150));

    // 1200 / 300 = 4, floor = 4, 4 * 300 = 1200 — new bucket
    const next = c(1200, 20, 25, 18, 22, 200);
    expect(agg.fold(next)).toEqual(c(1200, 20, 25, 18, 22, 200));
  });

  it('handles bars arriving out of time order within a bucket', () => {
    const agg = new BarAggregator(60);
    // 1050 / 60 = 17.5, floor = 17, 17 * 60 = 1020
    const later = c(1050, 5, 6, 4, 5, 10);
    expect(agg.fold(later)).toEqual(c(1020, 5, 6, 4, 5, 10));
    // 1020 / 60 = 17, floor = 17, 17 * 60 = 1020 — same bucket
    const earlier = c(1020, 10, 12, 9, 11, 100);
    // open stays 5, high=max(6,12)=12, low=min(4,9)=4, close=11, volume=110
    expect(agg.fold(earlier)).toEqual(c(1020, 5, 12, 4, 11, 110));
  });

  it('uses Math.floor for bucket calculation', () => {
    const agg = new BarAggregator(60);
    // 1059 / 60 = 17.65, floor = 17, 17 * 60 = 1020
    const bar = c(1059, 10, 12, 9, 11, 100);
    expect(agg.fold(bar)).toEqual(c(1020, 10, 12, 9, 11, 100));
  });
});
