import { useEffect, useState } from 'react';
import type { Candle } from '@ticker/server';
import { subscribeLiveCandles } from '../api/liveCandles';

export function useLiveCandles(
  symbol: string | null,
  timeframe: string,
): Candle | null {
  const [candle, setCandle] = useState<Candle | null>(null);

  useEffect(() => {
    if (!symbol) return;

    const unsubscribe = subscribeLiveCandles(symbol, timeframe, setCandle);
    return unsubscribe;
  }, [symbol, timeframe]);

  return candle;
}
