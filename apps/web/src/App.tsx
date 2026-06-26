import { useEffect, useRef, useState } from 'react';
import { fetchCandles } from './api/candles';
import { CandlestickChart } from './components/CandlestickChart';
import type { Candle } from '@ticker/server';
import type { DrawingTool } from './drawings/types';
import { DrawingToolbar } from './components/DrawingToolbar';
import { DEFAULT_SYMBOL, DEFAULT_TIMEFRAME } from './config';
import { timeframeToSeconds } from './config/timeframe';
import { foldLiveBar } from './lib/liveAggregator';

const DEFAULT_COUNT = 300;

export default function App() {
  const [candles, setCandles] = useState<Candle[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTool, setActiveTool] = useState<DrawingTool | null>(null);
  const timeframe: string = DEFAULT_TIMEFRAME;
  const chartRef = useRef<{ updateCandle: (candle: Candle) => void } | null>(null);
  const currentCandleRef = useRef<Candle | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchCandles(DEFAULT_SYMBOL, DEFAULT_COUNT, timeframe)
      .then((data) => {
        if (!cancelled) {
          setCandles(data);
          currentCandleRef.current = data.length ? data[data.length - 1] : null;
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
  }, [timeframe]);

  // SSE live data stream
  useEffect(() => {
    const tfSeconds = timeframeToSeconds(timeframe);
    const url = `/api/candles/${DEFAULT_SYMBOL}/stream?timeframe=${encodeURIComponent(timeframe)}`;
    const source = new EventSource(url);

    source.onmessage = (event: MessageEvent) => {
      try {
        const bar = JSON.parse(event.data) as Candle;
        const prev = currentCandleRef.current;
        const next = prev ? foldLiveBar(prev, bar, tfSeconds) : bar;
        currentCandleRef.current = next;
        chartRef.current?.updateCandle(next);
      } catch {
        // ignore parse errors
      }
    };

    source.onerror = () => {
      // Let EventSource auto-reconnect on transient errors;
      // only close on explicit cleanup (unmount).
    };

    return () => {
      source.close();
    };
  }, [timeframe]);

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
      <CandlestickChart
        ref={chartRef}
        candles={candles}
        activeTool={activeTool}
        onToolDeselect={() => setActiveTool(null)}
        timeframe={timeframe}
      />
    </div>
  );
}
