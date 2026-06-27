import { Injectable } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import { Candle } from '../candles/candle-type';
import { AlpacaStreamBar, buildAuthMessage, buildSubscribeMessage, mapStreamBar } from './alpaca-stream-messages';

export interface WebSocketLike {
  send(data: string): void;
  close(): void;
  readyState?: number;
  addEventListener(type: string, listener: (event: { data: string }) => void): void;
  removeEventListener(type: string, listener: (event: { data: string }) => void): void;
}

export type WebSocketFactory = () => WebSocketLike;

@Injectable()
export class AlpacaStreamService {
  private ws: WebSocketLike | null = null;
  private readonly symbols = new Set<string>();
  private readonly barSubjects = new Map<string, Subject<Candle>>();

  private readonly wsFactory: WebSocketFactory;

  constructor(wsFactory?: WebSocketFactory) {
    this.wsFactory = wsFactory ?? (() => new global.WebSocket('wss://stream.data.alpaca.markets/v1beta1/stocks/bars'));
  }

  stream(symbol: string, _timeframe: string): Observable<Candle> {
    return this.subscribeBars(symbol);
  }

  private subscribeBars(symbol: string): Observable<Candle> {
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
