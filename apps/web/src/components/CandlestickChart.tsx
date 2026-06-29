import { useEffect, useRef, useState } from 'react';
import { useDrawingTools, type DrawingState } from '../hooks/useDrawingTools';
import { useTextTool } from '../hooks/useTextTool';
import { TextEditor } from './TextEditor';
import { TextPrimitive } from '../drawings/TextPrimitive';
import {
  CandlestickSeries,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from 'lightweight-charts';
import { timeframeToSeconds } from '@ticker/shared';
import type { Candle } from '@ticker/server';
import type { DrawingTool } from '../drawings/types';
import { chartTheme } from '../config/chartTheme';
import { aggregateLiveBar } from '../lib/live-aggregator';

type Props = {
  candles: Candle[];
  liveCandle?: Candle | null;
  timeframe?: string;
  activeTool?: DrawingTool | null;
  onToolDeselect?: () => void;
};

export function CandlestickChart({
  candles,
  liveCandle,
  timeframe = '1Day',
  activeTool = null,
  onToolDeselect,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [chart, setChart] = useState<IChartApi | null>(null);
  const [series, setSeries] = useState<ISeriesApi<'Candlestick'> | null>(null);
  const drawingStateRef = useRef<DrawingState>({ phase: 'idle', finished: [] });
  const lastCandleRef = useRef<Candle | null>(null);
  const crosshairTimeRef = useRef<UTCTimestamp | null>(null);
  const crosshairPriceRef = useRef<number | null>(null);
  const textPrimitivesRef = useRef<TextPrimitive[]>([]);

  useDrawingTools({
    chart,
    series,
    activeTool,
    drawingStateRef,
    crosshairTimeRef,
    crosshairPriceRef,
    onToolDeselect,
  });

  const { editor, updateText, commit, cancel } = useTextTool({
    chart,
    series,
    activeTool,
    textPrimitivesRef,
    onToolDeselect,
  });

  useEffect(() => {
    if (!containerRef.current) return;

    const chartInstance = createChart(containerRef.current, {
      autoSize: true,
      layout: {
        background: { color: chartTheme.bg },
        textColor: chartTheme.text,
        fontSize: 12,
      },
      grid: {
        vertLines: { color: chartTheme.grid },
        horzLines: { color: chartTheme.grid },
      },
    });
    setChart(chartInstance);

    const seriesInstance = chartInstance.addSeries(CandlestickSeries);
    setSeries(seriesInstance);

    return () => {
      chartInstance.remove();
      setChart(null);
      setSeries(null);
    };
  }, []);

  useEffect(() => {
    if (!series || candles.length === 0) return;

    series.setData(
      candles.map((c) => ({
        time: Math.floor(c.time) as UTCTimestamp,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      })),
    );
    lastCandleRef.current = candles.at(-1) ?? null;
    chart?.timeScale().fitContent();
  }, [candles, series, chart]);

  useEffect(() => {
    if (!series || !liveCandle) return;

    const base = lastCandleRef.current;
    const aggregated = base
      ? aggregateLiveBar(base, liveCandle, timeframeToSeconds(timeframe))
      : liveCandle;
    lastCandleRef.current = aggregated;

    series.update({
      time: Math.floor(aggregated.time) as UTCTimestamp,
      open: aggregated.open,
      high: aggregated.high,
      low: aggregated.low,
      close: aggregated.close,
    });
  }, [liveCandle, series, timeframe]);

  return (
    <div ref={containerRef} className="relative h-full w-full">
      {editor && (
        <TextEditor
          x={editor.x}
          y={editor.y}
          value={editor.value}
          onChange={updateText}
          onCommit={commit}
          onCancel={cancel}
        />
      )}
    </div>
  );
}
