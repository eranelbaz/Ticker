import axios from 'axios';
import type { Candle } from '@ticker/server';

export async function fetchCandles(
  symbol: string,
  count: number,
  timeframe = '1Min',
): Promise<Candle[]> {
  const { data } = await axios.get<Candle[]>(
    `/api/candles/${encodeURIComponent(symbol)}/history`,
    { params: { count, timeframe }, timeout: 10_000 },
  );
  return data;
}
