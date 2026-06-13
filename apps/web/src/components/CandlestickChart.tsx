import { useEffect, useRef } from 'react';
import {
  CandlestickSeries,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from 'lightweight-charts';
import type { Candle } from '@ticker/server';

export function CandlestickChart({ candles }: { candles: Candle[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const css = getComputedStyle(document.documentElement);
    const chart = createChart(containerRef.current, {
      autoSize: true,
      layout: {
        background: { color: css.getPropertyValue('--color-chart-bg').trim() },
        textColor: css.getPropertyValue('--color-chart-text').trim(),
      },
      grid: {
        vertLines: { color: css.getPropertyValue('--color-chart-grid').trim() },
        horzLines: { color: css.getPropertyValue('--color-chart-grid').trim() },
      },
    });
    chartRef.current = chart;
    seriesRef.current = chart.addSeries(CandlestickSeries);

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
        time: c.time as UTCTimestamp,
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
