import { Candle } from '../candles/candle.interface';

export const ALPACA_DATA_BASE_URL = 'https://data.alpaca.markets';

const DAY_MS = 86_400_000;

export type AlpacaBar = {
  t: string; // RFC3339 timestamp
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
  n?: number;
  vw?: number;
};

export type AlpacaBarsResponse = {
  bars: AlpacaBar[] | null;
  symbol?: string;
  next_page_token: string | null;
};

export function buildBarsUrl(
  symbol: string,
  count: number,
  now: Date = new Date(),
): string {
  // sort=desc + limit=count returns the most recent `count` daily bars.
  // start just needs to reach back far enough to contain that many trading
  // days; count*2 calendar days comfortably covers weekends and holidays.
  const start = new Date(now.getTime() - (count * 2 + 5) * DAY_MS);
  const params = new URLSearchParams({
    timeframe: '1Day',
    feed: 'iex',
    sort: 'desc',
    limit: String(count),
    start: start.toISOString(),
    end: now.toISOString(),
  });
  return `${ALPACA_DATA_BASE_URL}/v2/stocks/${symbol}/bars?${params.toString()}`;
}

export function mapBar(bar: AlpacaBar): Candle {
  return {
    time: Math.floor(Date.parse(bar.t) / 1000),
    open: bar.o,
    high: bar.h,
    low: bar.l,
    close: bar.c,
    volume: bar.v,
  };
}
