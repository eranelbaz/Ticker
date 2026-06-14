import { useEffect, useRef } from 'react';
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

type DrawingState =
  | { phase: 'idle'; finished: DrawingPrimitive[] }
  | { phase: 'placing-p2'; p1: DrawingPoint; preview: DrawingPrimitive };

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

  // Initialize chart (runs once)
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

  // Subscribe to drawing events when activeTool changes
  useEffect(() => {
    const chart = chartRef.current;
    const series = seriesRef.current;
    if (!chart || !series) return;

    const onChartClick = (param: MouseEventParams) => {
      if (!activeTool || param.point === undefined) {
        return;
      }

      const price = series.coordinateToPrice(param.point.y);
      if (price === null) {
        return;
      }

      if (param.time === undefined) {
        return;
      }

      const clickPoint: DrawingPoint = {
        time: param.time as Time,
        price: price,
      };

      if (drawingStateRef.current.phase === 'idle') {
        drawingStateRef.current = {
          phase: 'placing-p2',
          p1: clickPoint,
          preview: activeTool === 'line'
            ? new LinePrimitive(series, clickPoint, clickPoint)
            : new RectanglePrimitive(series, clickPoint, clickPoint),
        };
        chart.panes()[0].attachPrimitive(drawingStateRef.current.preview);
        drawingStateRef.current.preview.updateAllViews();
      } else if (drawingStateRef.current.phase === 'placing-p2') {
        const finishedDrawing = activeTool === 'line'
          ? new LinePrimitive(series, drawingStateRef.current.p1, clickPoint)
          : new RectanglePrimitive(series, drawingStateRef.current.p1, clickPoint);

        chart.panes()[0].detachPrimitive(drawingStateRef.current.preview);
        chart.panes()[0].attachPrimitive(finishedDrawing);
        finishedDrawing.updateAllViews();

        const currentFinished = 
          drawingStateRef.current.phase === 'idle' 
            ? (drawingStateRef.current as any).finished 
            : [];

        drawingStateRef.current = {
          phase: 'idle',
          finished: [...(Array.isArray(currentFinished) ? currentFinished : []), finishedDrawing],
        };
      }
    };

    const onCrosshairMove = (param: MouseEventParams) => {
      if (!activeTool || param.point === undefined) return;

      if (param.time === undefined) return;

      const price = series.coordinateToPrice(param.point.y);
      if (price === null) return;

      const movePoint: DrawingPoint = {
        time: param.time as Time,
        price: price,
      };

      crosshairTimeRef.current = movePoint.time;
      crosshairPriceRef.current = movePoint.price;

      if (drawingStateRef.current.phase === 'placing-p2') {
        drawingStateRef.current.preview.setPoints(
          drawingStateRef.current.p1,
          movePoint,
        );
        drawingStateRef.current.preview.updateAllViews();
      }
    };

    chart.subscribeClick(onChartClick);
    chart.subscribeCrosshairMove(onCrosshairMove);

    return () => {
      chart.unsubscribeClick(onChartClick);
      chart.unsubscribeCrosshairMove(onCrosshairMove);
    };
  }, [activeTool]);

  // Update candle data
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
