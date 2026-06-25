import axios from 'axios';
import type { Candle } from '@ticker/server';

export async function fetchCandles(
  symbol: string,
  count: number,
  timeframe?: string,
): Promise<Candle[]> {
  const { data } = await axios.get<Candle[]>(
    `/api/candles/${encodeURIComponent(symbol)}`,
    { params: { count, timeframe }, timeout: 10_000 },
  );
  return data;
}
