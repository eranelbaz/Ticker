import { useEffect, useState } from 'react';
import { fetchCandles } from './api/candles';
import { CandlestickChart } from './components/CandlestickChart';
import type { Candle } from '@ticker/server';
import type { DrawingTool } from './drawings/types';
import { DrawingToolbar } from './components/DrawingToolbar';

const DEFAULT_SYMBOL = 'BTCUSD';
const DEFAULT_COUNT = 300;

export default function App() {
  const [candles, setCandles] = useState<Candle[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTool, setActiveTool] = useState<DrawingTool | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchCandles(DEFAULT_SYMBOL, DEFAULT_COUNT)
      .then((data) => {
        if (!cancelled) {
          setCandles(data);
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError((err as Error).message);
          setIsLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

const onToolSelect = (tool: DrawingTool | null) => {
  setActiveTool(tool);
};

  if (isLoading) return <div className="fixed inset-0 bg-chart-bg" />;

  if (error) {
    return (
      <p className="p-4 font-mono text-red-400">
        Failed to load candles: {error}
      </p>
    );
  }

  return (
      <div className="fixed inset-0 flex bg-chart-bg text-chart-text">
        <DrawingToolbar activeTool={activeTool} onToolSelect={onToolSelect} />
        <CandlestickChart candles={candles} activeTool={activeTool} />
      </div>
  );
}
