import { render } from '@testing-library/react';

const mockSetData = jest.fn();
const mockFitContent = jest.fn();
const mockRemove = jest.fn();
const mockAddSeries = jest.fn(() => ({ setData: mockSetData }));
const mockCreateChart = jest.fn(() => ({
  addSeries: mockAddSeries,
  timeScale: () => ({ fitContent: mockFitContent }),
  remove: mockRemove,
}));

jest.mock('lightweight-charts', () => ({
  createChart: mockCreateChart,
  CandlestickSeries: Symbol('CandlestickSeries'),
}));

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
    render(<CandlestickChart candles={candles} />);
    expect(mockCreateChart).toHaveBeenCalledTimes(1);
    expect(mockAddSeries).toHaveBeenCalledTimes(1);
  });

  it('passes OHLC data to the series and fits the view', () => {
    render(<CandlestickChart candles={candles} />);
    expect(mockSetData).toHaveBeenCalledWith([
      { time: 1, open: 10, high: 12, low: 9, close: 11 },
      { time: 2, open: 11, high: 13, low: 10, close: 12 },
    ]);
    expect(mockFitContent).toHaveBeenCalled();
  });

  it('does not push data for an empty candle list', () => {
    render(<CandlestickChart candles={[]} />);
    expect(mockSetData).not.toHaveBeenCalled();
  });

  it('removes the chart on unmount', () => {
    const { unmount } = render(<CandlestickChart candles={candles} />);
    unmount();
    expect(mockRemove).toHaveBeenCalledTimes(1);
  });
});
