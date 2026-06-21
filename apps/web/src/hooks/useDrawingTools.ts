import { useEffect } from 'react';
import type {
  IChartApi,
  ISeriesApi,
  MouseEventParams,
  UTCTimestamp,
} from 'lightweight-charts';
import type { DrawingTool, DrawingPoint } from '../drawings/types';
import { LinePrimitive } from '../drawings/LinePrimitive';
import { RectanglePrimitive } from '../drawings/RectanglePrimitive';

type DrawingPrimitive = LinePrimitive | RectanglePrimitive;

export const DRAWING_PHASES = {
  IDLE: 'idle',
  PLACING_P2: 'placing-p2',
} as const;

export type DrawingState =
  | { phase: typeof DRAWING_PHASES.IDLE; finished: DrawingPrimitive[] }
  | {
      phase: typeof DRAWING_PHASES.PLACING_P2;
      p1: DrawingPoint;
      preview: DrawingPrimitive;
    };

type UseDrawingToolsProps = {
  chart: IChartApi | null;
  series: ISeriesApi<'Candlestick'> | null;
  activeTool: DrawingTool | null;
  drawingStateRef: React.MutableRefObject<DrawingState>;
  crosshairTimeRef: React.MutableRefObject<UTCTimestamp | null>;
  crosshairPriceRef: React.MutableRefObject<number | null>;
  onToolDeselect?: () => void;
};

export function useDrawingTools({
  chart,
  series,
  activeTool,
  drawingStateRef,
  crosshairTimeRef,
  crosshairPriceRef,
  onToolDeselect,
}: UseDrawingToolsProps) {
  useEffect(() => {
    const chartInstance = chart;
    const seriesInstance = series;
    if (!chartInstance || !seriesInstance || !activeTool) return;
    if (activeTool !== 'line' && activeTool !== 'rectangle') return;

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
        time: param.time as UTCTimestamp,
        price: price,
      };

      if (drawingStateRef.current.phase === DRAWING_PHASES.IDLE) {
        drawingStateRef.current = {
          phase: DRAWING_PHASES.PLACING_P2,
          p1: clickPoint,
          preview:
            activeTool === 'line'
              ? new LinePrimitive(seriesInstance, clickPoint, clickPoint)
              : new RectanglePrimitive(seriesInstance, clickPoint, clickPoint),
        };
        chartInstance
          .panes()[0]
          .attachPrimitive(drawingStateRef.current.preview);
        drawingStateRef.current.preview.updateAllViews();
      } else if (drawingStateRef.current.phase === DRAWING_PHASES.PLACING_P2) {
        const finishedDrawing =
          activeTool === 'line'
            ? new LinePrimitive(
                seriesInstance,
                drawingStateRef.current.p1,
                clickPoint,
              )
            : new RectanglePrimitive(
                seriesInstance,
                drawingStateRef.current.p1,
                clickPoint,
              );

        chartInstance
          .panes()[0]
          .detachPrimitive(drawingStateRef.current.preview);
        chartInstance.panes()[0].attachPrimitive(finishedDrawing);
        finishedDrawing.updateAllViews();

        drawingStateRef.current = {
          phase: DRAWING_PHASES.IDLE,
          finished: [finishedDrawing],
        };

        onToolDeselect?.();
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || !activeTool) return;
      if (drawingStateRef.current.phase === DRAWING_PHASES.PLACING_P2) {
        chartInstance
          .panes()[0]
          .detachPrimitive(drawingStateRef.current.preview);
        drawingStateRef.current = { phase: DRAWING_PHASES.IDLE, finished: [] };
      }
      onToolDeselect?.();
    };

    const onCrosshairMove = (param: MouseEventParams) => {
      if (!activeTool || param.point === undefined) return;
      if (param.time === undefined) return;

      const price = seriesInstance.coordinateToPrice(param.point.y);
      if (price === null) return;

      const movePoint: DrawingPoint = {
        time: param.time as UTCTimestamp,
        price: price,
      };

      crosshairTimeRef.current = movePoint.time;
      crosshairPriceRef.current = movePoint.price;

      if (drawingStateRef.current.phase === DRAWING_PHASES.PLACING_P2) {
        drawingStateRef.current.preview.setPoints(
          drawingStateRef.current.p1,
          movePoint,
        );
        drawingStateRef.current.preview.updateAllViews();
      }
    };

    chartInstance.subscribeClick(onChartClick);
    chartInstance.subscribeCrosshairMove(onCrosshairMove);
    window.addEventListener('keydown', onKeyDown);

    return () => {
      chartInstance.unsubscribeClick(onChartClick);
      chartInstance.unsubscribeCrosshairMove(onCrosshairMove);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [chart, series, activeTool]);
}
