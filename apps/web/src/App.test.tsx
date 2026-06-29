import { act, render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from './test/server';
import { Candle } from '@ticker/server';

class FakeEventSource {
  url: string;
  closed = false;
  onmessage: ((ev: MessageEvent) => void) | null = null;
  onerror: (() => void) | null = null;

  static lastInstance: FakeEventSource | null = null;

  constructor(url: string) {
    this.url = url;
    FakeEventSource.lastInstance = this;
  }

  emit(data: Candle) {
    if (!this.closed && this.onmessage) {
      this.onmessage({ data: JSON.stringify(data) } as MessageEvent);
    }
  }

  close() {
    this.closed = true;
  }
}

let updateCandleCalls: Candle[] = [];
let capturedOnCandle: ((candle: Candle) => void) | null = null;

jest.mock('./api/liveCandles', () => ({
  subscribeLiveCandles: jest.fn().mockImplementation((_symbol: string, onCandle: (candle: Candle) => void) => {
    capturedOnCandle = (candle: Candle) => {
      updateCandleCalls.push(candle);
      onCandle(candle);
    };
    return () => {};
  }),
}));

beforeEach(() => {
  updateCandleCalls = [];
  capturedOnCandle = null;
  (global as any).EventSource = jest.fn().mockImplementation(
    () => new FakeEventSource('/api/mock'),
  );
});

type DrawingTool = 'line' | 'rectangle';

jest.mock('./components/CandlestickChart', () => ({
  CandlestickChart: ({
    candles,
  }: {
    candles: unknown[];
    liveCandle?: Candle | null;
  }) => {
    return <div data-testid="chart">candles: {candles.length}</div>;
  },
}));

jest.mock('./components/DrawingToolbar', () => ({
  DrawingToolbar: ({
    onToolSelect,
  }: {
    activeTool: DrawingTool | null;
    onToolSelect: (tool: DrawingTool | null) => void;
  }) => (
    <div>
      <button data-testid="line-btn" onClick={() => onToolSelect('line')}>
        Line
      </button>{' '}
      <button
        data-testid="rectangle-btn"
        onClick={() => onToolSelect('rectangle')}
      >
        Rectangle
      </button>
    </div>
  ),
}));

jest.mock('./components/TopBar', () => ({
  TopBar: ({ symbol, quote, isLive }: { symbol: string; quote?: { price?: number; change?: number; changePercent?: number } | null; isLive?: boolean }) => (
    <div data-testid="top-bar">
      <span>{symbol}</span>
      {quote && (
        <>
          <span data-testid="price">${(quote.price ?? 0).toFixed(2)}</span>
          <span data-testid="change">{(quote.change ?? 0).toFixed(2)} ({(quote.changePercent ?? 0).toFixed(2)}%)</span>
        </>
      )}
      <span data-testid="badge">{isLive ? 'LIVE' : 'OFFLINE'}</span>
    </div>
  ),
}));

import App from './App';

describe('App', () => {
  it('fetches candles and renders the chart', async () => {
    server.use(
      http.get('*/api/candles/config', () =>
        HttpResponse.json({ defaultSymbol: 'SPY', defaultTimeframe: '1Min' }),
      ),
      http.get('*/api/candles/:symbol/history', () =>
        HttpResponse.json([
          { time: 1, open: 1, high: 2, low: 0.5, close: 1.5, volume: 10 },
        ]),
      ),
    );

    render(<App />);

    expect(await screen.findByText(/candles: 1/)).toBeInTheDocument();
  });

  it('shows an error message when the request fails', async () => {
    server.use(
      http.get('*/api/candles/config', () =>
        HttpResponse.json({ defaultSymbol: 'SPY', defaultTimeframe: '1Min' }),
      ),
      http.get('*/api/candles/:symbol/history', () =>
        HttpResponse.json(null, { status: 500 }),
      ),
    );

    render(<App />);

    expect(
      await screen.findByText(/Failed to load candles/),
    ).toBeInTheDocument();
  });

  it('merges live bars into the last historical candle instead of appending', async () => {
    updateCandleCalls = [];

    server.use(
      http.get('*/api/candles/config', () =>
        HttpResponse.json({ defaultSymbol: 'SPY', defaultTimeframe: '1Min' }),
      ),
      http.get('*/api/candles/:symbol/history', () =>
        HttpResponse.json([
          { time: 1000, open: 10, high: 12, low: 9, close: 11, volume: 100 },
        ]),
      ),
    );

    await act(async () => {
      render(<App />);
    });

    await waitFor(() => {
      expect(screen.getByTestId('chart')).toBeInTheDocument();
    });

    // Emit two in-bucket stream bars (within 1Min timeframe = 60s, bucket [1000,1060))
    await act(async () => {
      capturedOnCandle!({ time: 1000, open: 10.5, high: 11, low: 10, close: 10.8, volume: 50 });
      capturedOnCandle!({ time: 1000, open: 10.8, high: 12, low: 10.5, close: 11.2, volume: 30 });
    });

    expect(updateCandleCalls).toHaveLength(2);

    expect(updateCandleCalls.every((c) => c.time === 1000)).toBe(true);
  });

  it('shows the configured symbol in the top bar', async () => {
    server.use(
      http.get('*/api/candles/config', () =>
        HttpResponse.json({ defaultSymbol: 'SPY', defaultTimeframe: '1Min' }),
      ),
      http.get('*/api/candles/:symbol/history', () =>
        HttpResponse.json([
          { time: 1, open: 1, high: 2, low: 0.5, close: 1.5, volume: 10 },
        ]),
      ),
    );

    render(<App />);
    expect(await screen.findByTestId('top-bar')).toBeInTheDocument();
    expect(await screen.findByText('SPY')).toBeInTheDocument();
  });

  it('computes price and change from historical candles', async () => {
    server.use(
      http.get('*/api/candles/config', () =>
        HttpResponse.json({ defaultSymbol: 'SPY', defaultTimeframe: '1Min' }),
      ),
      http.get('*/api/candles/:symbol/history', () =>
        HttpResponse.json([
          { time: 1, open: 100, high: 110, low: 90, close: 105, volume: 10 },
          { time: 2, open: 105, high: 120, low: 104, close: 120, volume: 20 },
        ]),
      ),
    );

    render(<App />);
    expect(await screen.findByTestId('price')).toHaveTextContent('$120.00');
    expect(screen.getByTestId('change')).toHaveTextContent('20.00 (20.00%)');
  });

  it('updates price when a live candle arrives', async () => {
    server.use(
      http.get('*/api/candles/config', () =>
        HttpResponse.json({ defaultSymbol: 'SPY', defaultTimeframe: '1Min' }),
      ),
      http.get('*/api/candles/:symbol/history', () =>
        HttpResponse.json([
          { time: 1000, open: 200, high: 210, low: 195, close: 210, volume: 10 },
        ]),
      ),
    );

    await act(async () => {
      render(<App />);
    });
    await waitFor(() => expect(screen.getByTestId('chart')).toBeInTheDocument());

    await act(async () => {
      capturedOnCandle!({ time: 1000, open: 210, high: 250, low: 209, close: 250, volume: 30 });
    });

    expect(screen.getByTestId('price')).toHaveTextContent('$250.00');
    expect(screen.getByTestId('change')).toHaveTextContent('50.00 (25.00%)');
    expect(screen.getByTestId('badge')).toHaveTextContent('LIVE');
  });

  it('shows OFFLINE badge before live data arrives', async () => {
    server.use(
      http.get('*/api/candles/config', () =>
        HttpResponse.json({ defaultSymbol: 'SPY', defaultTimeframe: '1Min' }),
      ),
      http.get('*/api/candles/:symbol/history', () =>
        HttpResponse.json([
          { time: 1, open: 10, high: 12, low: 9, close: 11, volume: 100 },
        ]),
      ),
    );

    render(<App />);
    await waitFor(() => expect(screen.getByTestId('chart')).toBeInTheDocument());
    expect(screen.getByTestId('badge')).toHaveTextContent('OFFLINE');
  });
});
