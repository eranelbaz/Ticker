import { render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from './test/server';
import { Candle } from '@ticker/server';
import { useEffect } from 'react';

// FakeEventSource that can emit messages
class FakeEventSource {
  url: string;
  closed = false;
  onmessage: ((ev: MessageEvent) => void) | null = null;
  onerror: (() => void) | null = null;

  constructor(url: string) {
    this.url = url;
    (global as any)._fakeEventSourceCallback = ((data: Candle) => {
      if (this.onmessage) {
        this.onmessage({ data: JSON.stringify(data) } as MessageEvent);
      }
    });
  }

  emit(data: Candle) {
    const cb = (global as any)._fakeEventSourceCallback;
    if (cb && !this.closed) {
      cb(data);
    }
  }

  close() {
    this.closed = true;
  }
}
// Capture updateCandle calls
let updateCandleCalls: Candle[] = [];

beforeEach(() => {
  (global as any).EventSource = jest.fn().mockImplementation(
    () => new FakeEventSource('/api/mock'),
  );
});

class FakeEventSource {
  onmessage: ((event: MessageEvent) => void) | null = null;
  close(): void {
    this.onmessage = null;
  }
}

beforeEach(() => {
  (global as any).EventSource = jest.fn().mockImplementation(
    () => new FakeEventSource(),
  );
});

type DrawingTool = 'line' | 'rectangle';

jest.mock('./components/CandlestickChart', () => ({
  CandlestickChart: ({
    ref,
    candles,
  }: {
    candles: unknown[];
    ref?: { current: { updateCandle: (c: Candle) => void } | null };
  }) => {
    useEffect(() => {
      if (ref) {
        ref.current = {
          updateCandle: (c: Candle) => {
            updateCandleCalls.push(c);
          },
        };
      }
    }, [ref]);
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

import App from './App';

describe('App', () => {
  it('fetches candles and renders the chart', async () => {
    server.use(
      http.get('*/api/candles/config', () =>
        HttpResponse.json({ defaultSymbol: 'SPY', defaultTimeframe: '1Min' }),
      ),
      http.get('*/api/candles/:symbol', () =>
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
      http.get('*/api/candles/:symbol', () =>
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
      http.get('*/api/candles/:symbol', () =>
        HttpResponse.json([
          { time: 1000, open: 10, high: 12, low: 9, close: 11, volume: 100 },
        ]),
      ),
    );

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('chart')).toBeInTheDocument();
    });

    // Emit two in-bucket stream bars (within 1Min timeframe = 60s, bucket [1000,1060))
    const emit = (global as any)._fakeEventSourceCallback;
    emit({ time: 1030, open: 10.5, high: 11, low: 10, close: 10.8, volume: 50 });
    emit({ time: 1050, open: 10.8, high: 12, low: 10.5, close: 11.2, volume: 30 });

    await waitFor(() => {
      expect(updateCandleCalls.length).toBe(2);
    });

    expect(updateCandleCalls.every((c) => c.time === 1000)).toBe(true);
  });
});
