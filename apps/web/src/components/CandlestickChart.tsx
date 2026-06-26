import { forwardRef, useImperativeHandle, useEffect, useRef, useState } from 'react';
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
import type { Candle } from '@ticker/server';
import type { DrawingTool } from '../drawings/types';
import { chartTheme } from '../config/chartTheme';

type Props = {
  candles: Candle[];
  activeTool?: DrawingTool | null;
  onToolDeselect?: () => void;
  timeframe?: string;
};

export const CandlestickChart = forwardRef<{ updateCandle: (candle: Candle) => void }, Props>(
  function CandlestickChart({ candles, activeTool = null, onToolDeselect, timeframe }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [chart, setChart] = useState<IChartApi | null>(null);
    const [series, setSeries] = useState<ISeriesApi<'Candlestick'> | null>(null);
    const drawingStateRef = useRef<DrawingState>({ phase: 'idle', finished: [] });
    const crosshairTimeRef = useRef<UTCTimestamp | null>(null);
    const crosshairPriceRef = useRef<number | null>(null);
    const textPrimitivesRef = useRef<TextPrimitive[]>([]);

    useEffect(() => {
      if (!chart) return;
      // Daily/weekly/monthly → date labels; intraday → show time of day.
      const intraday = !/Day|Week|Month/i.test(timeframe ?? '');
      chart.applyOptions({
        timeScale: { timeVisible: intraday, secondsVisible: intraday },
      });
    }, [chart, timeframe]);

    useImperativeHandle(
      ref,
      () => ({
        updateCandle: (candle: Candle) => {
          series?.update({
            time: Math.floor(candle.time) as UTCTimestamp,
            open: candle.open,
            high: candle.high,
            low: candle.low,
            close: candle.close,
          });
        },
      }),
      [series],
    );

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
      chart?.timeScale().fitContent();
    }, [candles, series, chart]);

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
  },
);
