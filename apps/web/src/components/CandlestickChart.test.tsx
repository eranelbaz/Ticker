import { render, fireEvent } from '@testing-library/react';

const mockSetData = jest.fn();
const mockFitContent = jest.fn();
const mockRemove = jest.fn();
const mockSubscribeClick = jest.fn();
const mockUnsubscribeClick = jest.fn();
const mockSubscribeDblClick = jest.fn();
const mockUnsubscribeDblClick = jest.fn();
const mockSubscribeCrosshairMove = jest.fn();
const mockUnsubscribeCrosshairMove = jest.fn();
const mockCoordinateToPrice = jest.fn(() => 50);

const mockSeries = {
  setData: mockSetData,
  coordinateToPrice: mockCoordinateToPrice,
};

const paneMock = {
  attachPrimitive: jest.fn(),
  detachPrimitive: jest.fn(),
};

const mockChart = {
  addSeries: jest.fn(() => mockSeries),
  applyOptions: jest.fn(),
  timeScale: () => ({ fitContent: mockFitContent }),
  remove: mockRemove,
  subscribeClick: mockSubscribeClick,
  unsubscribeClick: mockUnsubscribeClick,
  subscribeDblClick: mockSubscribeDblClick,
  unsubscribeDblClick: mockUnsubscribeDblClick,
  subscribeCrosshairMove: mockSubscribeCrosshairMove,
  unsubscribeCrosshairMove: mockUnsubscribeCrosshairMove,
  panes: () => [paneMock],
};

const mockCreateChart = jest.fn(() => mockChart);

jest.mock('lightweight-charts', () => ({
  createChart: mockCreateChart,
  CandlestickSeries: Symbol('CandlestickSeries'),
}));

jest.mock('../drawings/LinePrimitive', () => ({
  LinePrimitive: jest.fn().mockImplementation(() => ({
    setPoints: jest.fn(),
    updateAllViews: jest.fn(),
  })),
}));
jest.mock('../drawings/RectanglePrimitive', () => ({
  RectanglePrimitive: jest.fn().mockImplementation(() => ({
    setPoints: jest.fn(),
    updateAllViews: jest.fn(),
  })),
}));
jest.mock('../drawings/TextPrimitive', () => ({
  TextPrimitive: jest.fn().mockImplementation(() => ({
    setText: jest.fn(),
    getText: jest.fn(() => ''),
    getAnchor: jest.fn(() => ({ time: 1700000000, price: 50 })),
    containsPoint: jest.fn(() => false),
    updateAllViews: jest.fn(),
    attached: jest.fn(),
    detached: jest.fn(),
    paneViews: jest.fn(() => []),
  })),
}));

import { LinePrimitive } from '../drawings/LinePrimitive';
import { RectanglePrimitive } from '../drawings/RectanglePrimitive';
import type { Candle } from '@ticker/server';
import { CandlestickChart } from './CandlestickChart';

const candles: Candle[] = [
  { time: 1, open: 10, high: 12, low: 9, close: 11, volume: 100 },
  { time: 2, open: 11, high: 13, low: 10, close: 12, volume: 150 },
];

describe('CandlestickChart', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a chart with a candlestick series on mount', () => {
    render(<CandlestickChart candles={candles} activeTool={null} />);
    expect(mockCreateChart).toHaveBeenCalledTimes(1);
    expect(mockChart.addSeries).toHaveBeenCalledTimes(1);
  });

  it('passes OHLC data to the series and fits the view', () => {
    render(<CandlestickChart candles={candles} activeTool={null} />);
    expect(mockSetData).toHaveBeenCalledWith([
      { time: 1, open: 10, high: 12, low: 9, close: 11 },
      { time: 2, open: 11, high: 13, low: 10, close: 12 },
    ]);
    expect(mockFitContent).toHaveBeenCalled();
  });

  it('does not push data for an empty candle list', () => {
    render(<CandlestickChart candles={[]} activeTool={null} />);
    expect(mockSetData).not.toHaveBeenCalled();
  });

  it('removes the chart on unmount', () => {
    const { unmount } = render(
      <CandlestickChart candles={candles} activeTool={null} />,
    );
    unmount();
    expect(mockRemove).toHaveBeenCalledTimes(1);
  });

  it('subscribes to click and crosshair events when a tool is active', () => {
    render(<CandlestickChart candles={candles} activeTool="line" />);
    expect(mockSubscribeClick).toHaveBeenCalledTimes(2);
    expect(mockSubscribeCrosshairMove).toHaveBeenCalledTimes(1);
  });

  it('does not subscribe to chart events when no tool is active', () => {
    render(<CandlestickChart candles={candles} />);
    expect(mockSubscribeClick).toHaveBeenCalledTimes(1);
    expect(mockSubscribeCrosshairMove).not.toHaveBeenCalled();
  });

  it('creates a LinePrimitive and attaches it on second click when line tool is active', () => {
    render(<CandlestickChart candles={candles} activeTool="line" />);

    const clickHandler = mockSubscribeClick.mock.calls[0][0] as (
      param: unknown,
    ) => void;

    const makeClickParam = (time: number) => ({
      time,
      point: { x: 100, y: 200 },
    });

    clickHandler(makeClickParam(1700000000));
    expect(paneMock.attachPrimitive).toHaveBeenCalledTimes(1);
    expect(LinePrimitive).toHaveBeenCalledTimes(1);

    clickHandler(makeClickParam(1700003600));
    expect(paneMock.detachPrimitive).toHaveBeenCalledTimes(1);
    expect(paneMock.attachPrimitive).toHaveBeenCalledTimes(2);
  });

  it('creates a RectanglePrimitive when rectangle tool is active', () => {
    render(<CandlestickChart candles={candles} activeTool="rectangle" />);

    const clickHandler = mockSubscribeClick.mock.calls[0][0] as (
      param: unknown,
    ) => void;
    clickHandler({ time: 1700000000, point: { x: 100, y: 200 } });

    expect(RectanglePrimitive).toHaveBeenCalledTimes(1);
    expect(paneMock.attachPrimitive).toHaveBeenCalledTimes(1);
  });

  it('unsubscribes from events when tool is deactivated', () => {
    const { rerender } = render(
      <CandlestickChart candles={candles} activeTool="line" />,
    );
    rerender(<CandlestickChart candles={candles} activeTool={null} />);
    expect(mockUnsubscribeClick).toHaveBeenCalledTimes(2);
    expect(mockUnsubscribeCrosshairMove).toHaveBeenCalledTimes(1);
  });

  it('calls onToolDeselect after the second click completes a drawing', () => {
    const onToolDeselect = jest.fn();
    render(
      <CandlestickChart
        candles={candles}
        activeTool="line"
        onToolDeselect={onToolDeselect}
      />,
    );

    const clickHandler = mockSubscribeClick.mock.calls[0][0] as (
      param: unknown,
    ) => void;
    const makeClickParam = (time: number) => ({
      time,
      point: { x: 100, y: 200 },
    });

    clickHandler(makeClickParam(1700000000));
    expect(onToolDeselect).not.toHaveBeenCalled();

    clickHandler(makeClickParam(1700003600));
    expect(onToolDeselect).toHaveBeenCalledTimes(1);
  });

  it('calls onToolDeselect when Escape is pressed with no drawing in progress', () => {
    const onToolDeselect = jest.fn();
    render(
      <CandlestickChart
        candles={candles}
        activeTool="line"
        onToolDeselect={onToolDeselect}
      />,
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onToolDeselect).toHaveBeenCalledTimes(1);
  });

  it('cancels mid-drawing and calls onToolDeselect when Escape is pressed during placement', () => {
    const onToolDeselect = jest.fn();
    render(
      <CandlestickChart
        candles={candles}
        activeTool="line"
        onToolDeselect={onToolDeselect}
      />,
    );

    const clickHandler = mockSubscribeClick.mock.calls[0][0] as (
      param: unknown,
    ) => void;
    clickHandler({ time: 1700000000, point: { x: 100, y: 200 } });
    expect(paneMock.attachPrimitive).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(paneMock.detachPrimitive).toHaveBeenCalledTimes(1);
    expect(onToolDeselect).toHaveBeenCalledTimes(1);
  });
});
