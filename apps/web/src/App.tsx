import { useEffect, useState } from 'react';
import { fetchCandles } from './api/candles';
import { fetchConfig } from './api/config';
import { CandlestickChart } from './components/CandlestickChart';
import { TopBar } from './components/TopBar';
import type { Candle } from '@ticker/server';
import type { DrawingTool } from './drawings/types';
import { DrawingToolbar } from './components/DrawingToolbar';
import { useLiveCandles } from './hooks/useLiveCandles';
import { computeQuote } from './utils/compute-quote';

const DEFAULT_COUNT = 300;
const DEFAULT_TIMEFRAME = '1Min';

export default function App() {
  const [candles, setCandles] = useState<Candle[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTool, setActiveTool] = useState<DrawingTool | null>(null);
  const [configSymbol, setConfigSymbol] = useState<string | null>(null);

  const liveCandle = useLiveCandles(configSymbol, DEFAULT_TIMEFRAME);

  useEffect(() => {
    let cancelled = false;
    fetchConfig()
      .then((config) => {
        setConfigSymbol(config.defaultSymbol);
        if (!cancelled) {
          return fetchCandles(config.defaultSymbol, DEFAULT_COUNT);
        }
      })
      .then((data) => {
        if (!cancelled && data) {
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

  const quote = computeQuote(candles, liveCandle);

  return (
    <div className="fixed inset-0 flex flex-col bg-chart-bg text-chart-text">
      <TopBar
        symbol={configSymbol ?? ''}
        quote={quote}
        isLive={liveCandle !== null}
      />
      <div className="flex min-h-0 flex-1">
        <DrawingToolbar activeTool={activeTool} onToolSelect={onToolSelect} />
        <CandlestickChart
          candles={candles}
          liveCandle={liveCandle}
          activeTool={activeTool}
          onToolDeselect={() => setActiveTool(null)}
        />
      </div>
    </div>
  );
}
