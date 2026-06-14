import { useEffect } from 'react';
import type { IChartApi, ISeriesApi, MouseEventParams, Time } from 'lightweight-charts';
import type { DrawingTool, DrawingPoint } from '../drawings/types';
import { LinePrimitive } from '../drawings/LinePrimitive';
import { RectanglePrimitive } from '../drawings/RectanglePrimitive';

type DrawingPrimitive = LinePrimitive | RectanglePrimitive;

export type DrawingState =
  | { phase: 'idle'; finished: DrawingPrimitive[] }
  | { phase: 'placing-p2'; p1: DrawingPoint; preview: DrawingPrimitive };

interface UseDrawingToolsProps {
  chart: IChartApi | null;
  series: ISeriesApi<'Candlestick'> | null;
  activeTool: DrawingTool | null;
  drawingStateRef: React.MutableRefObject<DrawingState>;
  crosshairTimeRef: React.MutableRefObject<Time | null>;
  crosshairPriceRef: React.MutableRefObject<number | null>;
}

export function useDrawingTools({
  chart,
  series,
  activeTool,
  drawingStateRef,
  crosshairTimeRef,
  crosshairPriceRef,
}: UseDrawingToolsProps) {
  useEffect(() => {
    const chartInstance = chart;
    const seriesInstance = series;
    if (!chartInstance || !seriesInstance) return;

    const onChartClick = (param: MouseEventParams) => {
      if (!activeTool || param.point === undefined) {
        return;
      }

      const price = seriesInstance.coordinateToPrice(param.point.y);
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
            ? new LinePrimitive(seriesInstance, clickPoint, clickPoint)
            : new RectanglePrimitive(seriesInstance, clickPoint, clickPoint),
        };
        chartInstance.panes()[0].attachPrimitive(drawingStateRef.current.preview);
        drawingStateRef.current.preview.updateAllViews();
      } else if (drawingStateRef.current.phase === 'placing-p2') {
        const finishedDrawing = activeTool === 'line'
          ? new LinePrimitive(seriesInstance, drawingStateRef.current.p1, clickPoint)
          : new RectanglePrimitive(seriesInstance, drawingStateRef.current.p1, clickPoint);

        chartInstance.panes()[0].detachPrimitive(drawingStateRef.current.preview);
        chartInstance.panes()[0].attachPrimitive(finishedDrawing);
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

      const price = seriesInstance.coordinateToPrice(param.point.y);
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

    chartInstance.subscribeClick(onChartClick);
    chartInstance.subscribeCrosshairMove(onCrosshairMove);

    return () => {
      chartInstance.unsubscribeClick(onChartClick);
      chartInstance.unsubscribeCrosshairMove(onCrosshairMove);
    };
  }, [chart, series, activeTool]);
}
