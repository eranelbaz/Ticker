import axios from 'axios';
import type { Candle } from '@ticker/server';

export async function fetchCandles(
  symbol: string,
  count: number,
): Promise<Candle[]> {
  const { data } = await axios.get<Candle[]>(
    `/api/candles/${encodeURIComponent(symbol)}`,
    { params: { count }, timeout: 10_000 },
  );
  return data;
}
