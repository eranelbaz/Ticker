import { Candle } from '../candles/candle.interface';
import axios from 'axios';

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

export function createFetcher(): (
  symbol: string,
  count: number,
) => Promise<Candle[]> {
  return async (symbol: string, count: number): Promise<Candle[]> => {
    const keyId = process.env.ALPACA_API_KEY_ID;
    const secretKey = process.env.ALPACA_API_SECRET_KEY;
    if (!keyId || !secretKey) {
      throw new Error('Alpaca API credentials are not configured');
    }

    const response = await axios.get<AlpacaBarsResponse>(
      buildBarsUrl(symbol, count),
      {
        headers: {
          'APCA-API-KEY-ID': keyId,
          'APCA-API-SECRET-KEY': secretKey,
        },
        timeout: 10_000,
      },
    );
    const body: AlpacaBarsResponse = response.data;

    if (!body.bars || body.bars.length === 0) {
      throw new Error(`No market data returned for symbol ${symbol}`);
    }

    const bars = body.bars;
    return bars.map(mapBar).sort((a, b) => a.time - b.time);
  };
}
