import { render, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from './test/server';

jest.mock('./components/CandlestickChart', () => ({
  CandlestickChart: ({ candles }: { candles: unknown[] }) => (
    <div>{candles.length} candles loaded</div>
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

    expect(await screen.findByText('1 candles loaded')).toBeInTheDocument();
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
