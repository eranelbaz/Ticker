import { buildBarsUrl, mapBar, ALPACA_DATA_BASE_URL } from './alpaca';

describe('buildBarsUrl', () => {
  const now = new Date('2026-06-22T15:00:00.000Z');

  it('targets the single-symbol daily bars endpoint with the iex feed', () => {
    const url = new URL(buildBarsUrl('SPY', 300, now));
    expect(`${url.origin}${url.pathname}`).toBe(
      `${ALPACA_DATA_BASE_URL}/v2/stocks/SPY/bars`,
    );
    expect(url.searchParams.get('timeframe')).toBe('1Day');
    expect(url.searchParams.get('feed')).toBe('iex');
    expect(url.searchParams.get('sort')).toBe('desc');
    expect(url.searchParams.get('limit')).toBe('300');
    expect(url.searchParams.get('end')).toBe(now.toISOString());
  });

  it('sets start far enough back to cover count trading days', () => {
    const url = new URL(buildBarsUrl('SPY', 300, now));
    const start = new Date(url.searchParams.get('start') as string);
    const days = (now.getTime() - start.getTime()) / 86_400_000;
    expect(days).toBeGreaterThanOrEqual(300);
  });

  it('url-encodes the symbol', () => {
    const url = buildBarsUrl('BRK.B', 10, now);
    expect(url).toContain('/v2/stocks/BRK.B/bars');
  });

  it('defaults timeframe to 1Day', () => {
    const url = new URL(buildBarsUrl('SPY', 300, now));
    expect(url.searchParams.get('timeframe')).toBe('1Day');
  });

  it('uses the provided timeframe', () => {
    const url = new URL(buildBarsUrl('SPY', 300, now, '1Hour'));
    expect(url.searchParams.get('timeframe')).toBe('1Hour');
  });
});

describe('mapBar', () => {
  it('maps an Alpaca bar to a Candle with Unix-second time', () => {
    const candle = mapBar({
      t: '2026-06-19T04:00:00Z',
      o: 1,
      h: 4,
      l: 0.5,
      c: 3,
      v: 1234,
      n: 10,
      vw: 2.5,
    });
    expect(candle).toEqual({
      time: Math.floor(Date.parse('2026-06-19T04:00:00Z') / 1000),
      open: 1,
      high: 4,
      low: 0.5,
      close: 3,
      volume: 1234,
    });
  });
});
