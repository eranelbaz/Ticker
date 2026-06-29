import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { Observable, Subject } from 'rxjs';
import { Candle } from '../../../candles/candles.type';
import { DataProvider } from '../types';
import type { AlpacaBarsResponse, WebSocketFactory, WebSocketLike } from './alpaca.types';
import { alpacaAuthenticatedSchema, alpacaStreamBarSchema } from './alpaca.schema';
import { buildAuthMessage, buildBarsUrl, buildSubscribeMessage, mapBar, mapStreamBar } from './alpaca.utils';

@Injectable()
export class AlpacaProvider implements DataProvider {
  private ws: WebSocketLike | null = null;
  private readonly symbols = new Set<string>();
  private readonly barSubjects = new Map<string, Subject<Candle>>();
  private readonly wsFactory: WebSocketFactory;
  private readonly keyId: string;
  private readonly secretKey: string;

  constructor(wsFactory?: WebSocketFactory) {
    const keyId = process.env.ALPACA_API_KEY_ID;
    const secretKey = process.env.ALPACA_API_SECRET_KEY;
    if (!keyId || !secretKey) {
      throw new Error('Alpaca API credentials are not configured');
    }
    this.keyId = keyId;
    this.secretKey = secretKey;
    this.wsFactory = wsFactory ?? (() => new global.WebSocket('wss://stream.data.alpaca.markets/v2/iex'));
  }

  async getHistoricalData(symbol: string, count: number, timeframe: string): Promise<Candle[]> {
    const response = await axios.get<AlpacaBarsResponse>(
      buildBarsUrl(symbol, count, timeframe),
      {
        headers: {
          'APCA-API-KEY-ID': this.keyId,
          'APCA-API-SECRET-KEY': this.secretKey,
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
    if (this.barSubjects.has(symbol)) {
      return this.barSubjects.get(symbol)!.asObservable();
    }

    const subject = new Subject<Candle>();
    this.barSubjects.set(symbol, subject);
    this.symbols.add(symbol);

    if (!this.ws) {
      this.connect(this.keyId, this.secretKey);
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
      let raw: unknown;
      try {
        raw = JSON.parse(event.data);
      } catch {
        return;
      }

      const messages = Array.isArray(raw) ? raw : [raw];
      for (const message of messages) {
        if (alpacaAuthenticatedSchema.safeParse(message).success) {
          this.onAuthenticated();
          continue;
        }

        const result = alpacaStreamBarSchema.safeParse(message);
        if (result.success) {
          this.barSubjects.get(result.data.S)?.next(mapStreamBar(result.data));
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
