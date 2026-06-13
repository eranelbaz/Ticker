import { useEffect, useState } from 'react';
import { fetchCandles } from './api/candles';
import { CandlestickChart } from './components/CandlestickChart';
import type { Candle } from '@ticker/server';

const DEFAULT_SYMBOL = 'BTCUSD';
const DEFAULT_COUNT = 300;

export default function App() {
  const [candles, setCandles] = useState<Candle[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCandles(DEFAULT_SYMBOL, DEFAULT_COUNT)
      .then(setCandles)
      .catch((err: Error) => setError(err.message));
  }, []);

  if (error) {
    return (
      <p className="p-4 font-mono text-red-400">
        Failed to load candles: {error}
      </p>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#131722] text-[#d1d4dc]">
      <CandlestickChart candles={candles} />
    </div>
  );
}
