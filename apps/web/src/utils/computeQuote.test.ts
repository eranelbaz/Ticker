import { computeQuote } from './computeQuote';
import type { Candle } from '@ticker/server';

const candle = (over: Partial<Candle>): Candle => ({
  time: 0,
  open: 100,
  high: 110,
  low: 90,
  close: 105,
  volume: 0,
  ...over,
});

describe('computeQuote', () => {
  it('returns null when there is no data', () => {
    expect(computeQuote([], null)).toBeNull();
  });

  it('uses the last candle close when there is no live candle', () => {
    const candles = [candle({ open: 100 }), candle({ close: 120 })];
    expect(computeQuote(candles, null)).toEqual({
      price: 120,
      change: 20,
      changePercent: 20,
    });
  });

  it('prefers the live candle close over historical', () => {
    const candles = [candle({ open: 200 }), candle({ close: 210 })];
    const live = candle({ close: 250 });
    expect(computeQuote(candles, live)).toEqual({
      price: 250,
      change: 50,
      changePercent: 25,
    });
  });

  it('uses the live candle open as baseline when no candles are loaded', () => {
    const live = candle({ open: 50, close: 60 });
    expect(computeQuote([], live)).toEqual({
      price: 60,
      change: 10,
      changePercent: 20,
    });
  });

  it('reports zero percent change when baseline is zero', () => {
    const candles = [candle({ open: 0, close: 5 })];
    expect(computeQuote(candles, null)).toEqual({
      price: 5,
      change: 5,
      changePercent: 0,
    });
  });
});
