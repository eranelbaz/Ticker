import { useCallback, useEffect, useState } from 'react';
import type {
  IChartApi,
  ISeriesApi,
  MouseEventParams,
  UTCTimestamp,
} from 'lightweight-charts';
import type { DrawingTool, DrawingPoint } from '../drawings/types';
import { TextPrimitive } from '../drawings/TextPrimitive';

export type TextEditorState = {
  primitive: TextPrimitive;
  x: number;
  y: number;
  value: string;
  original: string;
  isNew: boolean;
};

type UseTextToolProps = {
  chart: IChartApi | null;
  series: ISeriesApi<'Candlestick'> | null;
  activeTool: DrawingTool | null;
  textPrimitivesRef: React.MutableRefObject<TextPrimitive[]>;
  onToolDeselect?: () => void;
};

export function useTextTool({
  chart,
  series,
  activeTool,
  textPrimitivesRef,
  onToolDeselect,
}: UseTextToolProps) {
  const [editor, setEditor] = useState<TextEditorState | null>(null);

  const removePrimitive = useCallback(
    (primitive: TextPrimitive) => {
      chart?.panes()[0].detachPrimitive(primitive);
      textPrimitivesRef.current = textPrimitivesRef.current.filter(
        (p) => p !== primitive,
      );
    },
    [chart, textPrimitivesRef],
  );

  useEffect(() => {
    const chartInstance = chart;
    const seriesInstance = series;
    if (!chartInstance || !seriesInstance) return;

    const onChartClick = (param: MouseEventParams) => {
      if (
        activeTool !== 'text' ||
        param.point === undefined ||
        param.time === undefined
      ) {
        return;
      }
      const price = seriesInstance.coordinateToPrice(param.point.y);
      if (price === null) return;

      const anchor: DrawingPoint = {
        time: param.time as UTCTimestamp,
        price,
      };
      const primitive = new TextPrimitive(seriesInstance, anchor, '');
      chartInstance.panes()[0].attachPrimitive(primitive);
      primitive.updateAllViews();
      textPrimitivesRef.current.push(primitive);

      primitive.setVisible(false);
      setEditor({
        primitive,
        x: param.point.x,
        y: param.point.y,
        value: '',
        original: '',
        isNew: true,
      });
      onToolDeselect?.();
    };

    const onChartDblClick = (param: MouseEventParams) => {
      if (param.point === undefined) return;
      const { x, y } = param.point;
      const hit = textPrimitivesRef.current.find((p) => p.containsPoint(x, y));
      if (!hit) return;

      const anchor = hit.getAnchor();
      const px = chartInstance.timeScale().timeToCoordinate(anchor.time);
      const py = seriesInstance.priceToCoordinate(anchor.price);
      if (px === null || py === null) return;

      hit.setVisible(false);
      setEditor({
        primitive: hit,
        x: px,
        y: py,
        value: hit.getText(),
        original: hit.getText(),
        isNew: false,
      });
    };

    chartInstance.subscribeClick(onChartClick);
    chartInstance.subscribeDblClick(onChartDblClick);

    return () => {
      chartInstance.unsubscribeClick(onChartClick);
      chartInstance.unsubscribeDblClick(onChartDblClick);
    };
  }, [chart, series, activeTool]);

  const updateText = (value: string) => {
    setEditor((prev) => {
      if (!prev) return prev;
      prev.primitive.setText(value);
      prev.primitive.updateAllViews();
      return { ...prev, value };
    });
  };

  const commit = () => {
    setEditor((prev) => {
      if (!prev) return null;
      if (prev.value.trim() === '') {
        removePrimitive(prev.primitive);
      } else {
        prev.primitive.setVisible(true);
      }
      return null;
    });
  };

  const cancel = () => {
    setEditor((prev) => {
      if (!prev) return null;
      if (prev.isNew) {
        removePrimitive(prev.primitive);
      } else {
        prev.primitive.setText(prev.original);
        prev.primitive.setVisible(true);
        prev.primitive.updateAllViews();
      }
      return null;
    });
  };

  return { editor, updateText, commit, cancel };
}
