import type { Candle } from '@ticker/server';

export async function fetchCandles(
  symbol: string,
  count: number,
): Promise<Candle[]> {
  const url = new URL(`/api/candles/${symbol}`, window.location.origin);
  url.searchParams.set('count', String(count));

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return (await res.json()) as Candle[];
}
