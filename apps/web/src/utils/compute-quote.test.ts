import { computeQuote } from './compute-quote';
import type { Candle } from '@ticker/server';

const candle = (open: number, close: number): Candle =>
  ({ open, close, high: close, low: open, volume: 0, time: 0 }) as Candle;

describe('computeQuote', () => {
  it('returns null with no candles and no liveCandle', () => {
    expect(computeQuote([], null)).toBeNull();
  });

  it('change = last candle close - last candle open (positive)', () => {
    const candles = [candle(100, 110), candle(110, 120)];
    const result = computeQuote(candles, null)!;
    expect(result.change).toBeCloseTo(10);
    expect(result.changePercent).toBeCloseTo((10 / 110) * 100);
    expect(result.price).toBe(120);
  });

  it('change = last candle close - last candle open (negative)', () => {
    const candles = [candle(100, 110), candle(115, 108)];
    const result = computeQuote(candles, null)!;
    expect(result.change).toBeCloseTo(-7);
    expect(result.changePercent).toBeCloseTo((-7 / 115) * 100);
  });

  it('uses last aggregated candle open as baseline when liveCandle provided', () => {
    const candles = [candle(100, 110)];
    const live = candle(112, 118);
    const result = computeQuote(candles, live)!;
    expect(result.change).toBeCloseTo(18); // 118 - 100 (lastCandle.open)
    expect(result.changePercent).toBeCloseTo((18 / 100) * 100);
    expect(result.price).toBe(118);
  });

  it('change = 0 when open equals close', () => {
    const candles = [candle(100, 100)];
    const result = computeQuote(candles, null)!;
    expect(result.change).toBe(0);
    expect(result.changePercent).toBe(0);
  });
});
