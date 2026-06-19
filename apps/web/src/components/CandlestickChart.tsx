import { useEffect, useRef, useState } from 'react';
import { useDrawingTools, type DrawingState } from '../hooks/useDrawingTools';
import {
  CandlestickSeries,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from 'lightweight-charts';
import type { Candle } from '@ticker/server';
import type { DrawingTool } from '../drawings/types';
import { chartTheme } from '../config/chartTheme';

type Props = {
  candles: Candle[];
  activeTool?: DrawingTool | null;
  onToolDeselect?: () => void;
}

export function CandlestickChart({ candles, activeTool = null, onToolDeselect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [chart, setChart] = useState<IChartApi | null>(null);
  const [series, setSeries] = useState<ISeriesApi<'Candlestick'> | null>(null);
  const drawingStateRef = useRef<DrawingState>({ phase: 'idle', finished: [] });
  const crosshairTimeRef = useRef<UTCTimestamp | null>(null);
  const crosshairPriceRef = useRef<number | null>(null);

  useDrawingTools({
    chart,
    series,
    activeTool,
    drawingStateRef,
    crosshairTimeRef,
    crosshairPriceRef,
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
    chart?.timeScale().fitContent();
  }, [candles, series, chart]);

  return <div ref={containerRef} className="h-full w-full" />;
}
