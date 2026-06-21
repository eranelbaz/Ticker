import { renderHook } from '@testing-library/react';
import type { IChartApi, ISeriesApi } from 'lightweight-charts';
import { useDrawingTools, DRAWING_PHASES } from './useDrawingTools';

describe('useDrawingTools', () => {
  it('does not subscribe to clicks when the active tool is text', () => {
    const subscribeClick = jest.fn();
    const subscribeCrosshairMove = jest.fn();
    const chart = {
      subscribeClick,
      unsubscribeClick: jest.fn(),
      subscribeCrosshairMove,
      unsubscribeCrosshairMove: jest.fn(),
      panes: () => [{ attachPrimitive: jest.fn(), detachPrimitive: jest.fn() }],
    } as unknown as IChartApi;
    renderHook(() =>
      useDrawingTools({
        chart,
        series: { coordinateToPrice: jest.fn(() => 100) } as unknown as ISeriesApi<'Candlestick'>,
        activeTool: 'text',
        drawingStateRef: { current: { phase: DRAWING_PHASES.IDLE, finished: [] } },
        crosshairTimeRef: { current: null },
        crosshairPriceRef: { current: null },
      }),
    );

    expect(subscribeClick).not.toHaveBeenCalled();
  });
});
