import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { Observable, Subject } from 'rxjs';
import { Candle } from '../../../candles/candles.type';
import { DataProvider } from '../types';
import { AlpacaStreamBar } from './stream-bar.type';
import { buildAuthMessage, buildSubscribeMessage, mapStreamBar } from './alpaca-stream-messages';

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

export interface WebSocketLike {
  send(data: string): void;
  close(): void;
  readyState?: number;
  addEventListener(type: string, listener: (event: { data: string }) => void): void;
  removeEventListener(type: string, listener: (event: { data: string }) => void): void;
}

export type WebSocketFactory = () => WebSocketLike;

@Injectable()
export class AlpacaProvider implements DataProvider {
  private ws: WebSocketLike | null = null;
  private readonly symbols = new Set<string>();
  private readonly barSubjects = new Map<string, Subject<Candle>>();
  private readonly wsFactory: WebSocketFactory;

  constructor(wsFactory?: WebSocketFactory) {
    this.wsFactory = wsFactory ?? (() => new global.WebSocket('wss://stream.data.alpaca.markets/v1beta1/stocks/bars'));
  }

  async getHistoricalData(symbol: string, count: number, _timeframe: string): Promise<Candle[]> {
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
  }

  getStreamData(symbol: string): Observable<Candle> {
    const keyId = process.env.ALPACA_API_KEY_ID;
    const secretKey = process.env.ALPACA_API_SECRET_KEY;
    if (!keyId || !secretKey) {
      throw new Error('Alpaca API credentials are not configured');
    }

    if (this.barSubjects.has(symbol)) {
      return this.barSubjects.get(symbol)!.asObservable();
    }

    const subject = new Subject<Candle>();
    this.barSubjects.set(symbol, subject);
    this.symbols.add(symbol);

    if (!this.ws) {
      this.connect(keyId, secretKey);
    } else if (this.ws.readyState !== undefined && this.ws.readyState === 1) {
      this.ws.send(buildSubscribeMessage([symbol]));
    }

    return subject.asObservable();
  }

  private connect(keyId: string, secretKey: string): void {
    this.ws = this.wsFactory();

    this.ws.addEventListener('open', () => {
      this.ws!.send(buildAuthMessage(keyId, secretKey));
    });

    this.ws.addEventListener('message', (event: { data: string }) => {
      let msg: AlpacaStreamBar | Record<string, unknown>;
      try {
        msg = JSON.parse(event.data);
      } catch {
        return;
      }

      if ((msg as Record<string, unknown>).T === 'status' && (msg as Record<string, string>).status === 'authenticated') {
        this.onAuthenticated();
      }

      if (msg && typeof msg === 'object' && 'T' in msg && msg.T === 'b' && 'S' in msg && msg.S && 'o' in msg && 'h' in msg && 'l' in msg && 'c' in msg && 'v' in msg && 't' in msg) {
        const candle = mapStreamBar(msg as AlpacaStreamBar);
        const subject = this.barSubjects.get(msg.S as string);
        if (subject) {
          subject.next(candle);
        }
      }
    });
  }

  private onAuthenticated(): void {
    const symbols = Array.from(this.symbols);
    if (symbols.length > 0) {
      this.ws!.send(buildSubscribeMessage(symbols));
    }
  }
}
