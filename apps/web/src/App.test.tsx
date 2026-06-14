import { render, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from './test/server';

type DrawingTool = 'line' | 'rectangle';

jest.mock('./components/CandlestickChart', () => ({
  CandlestickChart: ({ activeTool }: { candles: unknown[]; activeTool?: DrawingTool | null }) => (
    <div>drawing tool is {activeTool === null ? 'null' : activeTool} /div>
  ),
}));

jest.mock('./components/DrawingToolbar', () => ({
  DrawingToolbar: ({ 
    onToolSelect,
  }: { 
    activeTool: DrawingTool | null;
    onToolSelect: (tool: DrawingTool | null) => void;  
  }) => (
    <div>
      <button data-testid="line-btn" onClick={() => onToolSelect('line')} /button> Line</button>{' '}
      <button data-testid="rectangle-btn" onClick={() => onToolSelect('rectangle')} /button> Rectangle</button>
    /div>
  ),
}));

import App from './App';

describe('App', () => {
  it('fetches candles and renders the chart', async () => {
    server.use(
      http.get('*/api/candles/:symbol', () =>
        HttpResponse.json([
          { time: 1, open: 1, high: 2, low: 0.5, close: 1.5, volume: 10 },
        ]),
      ),
    );

    render(<App />);

    expect(await screen.findByText('drawing tool is null')).toBeInTheDocument();
  });

  it('shows an error message when the request fails', async () => {
    server.use(
      http.get('*/api/candles/:symbol', () =>
        HttpResponse.json(null, { status: 500 }),
      ),
    );

    render(<App />);

    expect(
      await screen.findByText(/Failed to load candles/),
    ).toBeInTheDocument();
  });
});
