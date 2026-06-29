import { useEffect, useState } from 'react';
import type { Candle } from '@ticker/server';
import { subscribeLiveCandles } from '../api/liveCandles';

export function useLiveCandles(
  symbol: string | null,
): Candle | null {
  const [candle, setCandle] = useState<Candle | null>(null);

  useEffect(() => {
    if (!symbol) return;

    const unsubscribe = subscribeLiveCandles(symbol, setCandle);
    return unsubscribe;
  }, [symbol]);

  return candle;
}
