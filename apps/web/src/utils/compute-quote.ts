import type { Candle } from '@ticker/server';

export type Quote = {
  price: number;
  change: number;
  changePercent: number;
};

export function computeQuote(
  candles: Candle[],
  liveCandle: Candle | null,
): Quote | null {
  const lastCandle = candles.at(-1) ?? null;
  const priceSource = liveCandle ?? lastCandle;
  if (!priceSource) return null;

  const baseline = candles[0]?.open ?? priceSource.open;
  const price = priceSource.close;
  const change = price - baseline;
  const changePercent = baseline === 0 ? 0 : (change / baseline) * 100;

  return { price, change, changePercent };
}
