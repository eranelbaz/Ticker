import { useEffect, useRef } from 'react';
import { useDrawingTools, type DrawingState } from '../hooks/useDrawingTools';
import {
  CandlestickSeries,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type MouseEventParams,
  type Time,
  type UTCTimestamp,
} from 'lightweight-charts';
import type { Candle } from '@ticker/server';
import type { DrawingTool, DrawingPoint } from '../drawings/types';
import { LinePrimitive } from '../drawings/LinePrimitive';
import { RectanglePrimitive } from '../drawings/RectanglePrimitive';
import { chartTheme } from '../config/chartTheme';

type DrawingPrimitive = LinePrimitive | RectanglePrimitive;

interface Props {
  candles: Candle[];
  activeTool?: DrawingTool | null;
}

export function CandlestickChart({ candles, activeTool = null }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const drawingStateRef = useRef<DrawingState>({ phase: 'idle', finished: [] });
  const crosshairTimeRef = useRef<Time | null>(null);
  const crosshairPriceRef = useRef<number | null>(null);

  useDrawingTools({
    chart: chartRef.current,
    series: seriesRef.current,
    activeTool,
    drawingStateRef,
    crosshairTimeRef,
    crosshairPriceRef,
  });

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
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
    chartRef.current = chart;

    const series = chart.addSeries(CandlestickSeries);
    seriesRef.current = series;

    return () => {
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!seriesRef.current || candles.length === 0) return;

    seriesRef.current.setData(
      candles.map((c) => ({
        time: Math.floor(c.time) as UTCTimestamp,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      })),
    );
    chartRef.current?.timeScale().fitContent();
  }, [candles]);

  return <div ref={containerRef} className="h-full w-full" />;
}
