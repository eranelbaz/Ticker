import { http, HttpResponse } from 'msw';
import { server } from '../test/server';
import { fetchCandles } from './candles';

const candles = [
  { time: 1, open: 1, high: 2, low: 0.5, close: 1.5, volume: 10 },
];

describe('fetchCandles', () => {
  it('requests the symbol and count and returns the candles', async () => {
    let requestedUrl = '';
    server.use(
      http.get('*/api/candles/:symbol', ({ request }) => {
        requestedUrl = request.url;
        return HttpResponse.json(candles);
      }),
    );

    await expect(fetchCandles('BTCUSD', 300)).resolves.toEqual(candles);

    const url = new URL(requestedUrl);
    expect(url.pathname).toBe('/api/candles/BTCUSD');
    expect(url.searchParams.get('count')).toBe('300');
  });

  it('throws on a non-OK response', async () => {
    server.use(
      http.get('*/api/candles/:symbol', () =>
        HttpResponse.json({ message: 'boom' }, { status: 500 }),
      ),
    );

    await expect(fetchCandles('BTCUSD', 300)).rejects.toThrow('500');
  });
});
