import { Injectable } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import { Candle } from '../candles/candle-type';
import { buildAuthMessage, buildSubscribeMessage, mapStreamBar } from './alpaca-stream-messages';

/**
 * Minimal WebSocket contract for dependency injection.
 */
export interface WebSocketLike {
  send(data: string): void;
  close(): void;
  addEventListener(type: string, listener: (...args: any[]) => void): void;
  removeEventListener(type: string, listener: (...args: any[]) => void): void;
}

export type WebSocketFactory = () => WebSocketLike;

@Injectable()
export class AlpacaStreamService {
  private ws: WebSocketLike | null = null;
  private connected = false;
  private authenticated = false;
  private readonly symbols = new Set<string>();
  private readonly barSubjects = new Map<string, Subject<Candle>>();

  private readonly wsFactory: WebSocketFactory;

  constructor(wsFactory?: WebSocketFactory) {
    this.wsFactory = wsFactory ?? (() => new global.WebSocket('wss://stream.data.alpaca.markets/v1beta1/stocks/bars'));
  }

  /**
   * Returns an Observable of 1-minute bars for the given symbol.
   * The WebSocket connection is lazily established on the first call.
   */
  minuteBars(symbol: string): Observable<Candle> {
    const keyId = process.env.ALPACA_API_KEY_ID;
    const secretKey = process.env.ALPACA_API_SECRET_KEY;
    if (!keyId || !secretKey) {
      throw new Error('Alpaca API credentials are not configured');
    }

    // Return existing subject if already subscribed
    if (this.barSubjects.has(symbol)) {
      return this.barSubjects.get(symbol)!.asObservable();
    }

    const subject = new Subject<Candle>();
    this.barSubjects.set(symbol, subject);
    this.symbols.add(symbol);

    if (!this.ws) {
      this.connect(keyId, secretKey);
    }

    return subject.asObservable();
  }

  private connect(keyId: string, secretKey: string): void {
    this.ws = this.wsFactory();

    this.ws.addEventListener('open', () => {
      this.connected = true;
      // Send auth
      this.ws!.send(buildAuthMessage(keyId, secretKey));
    });

    this.ws.addEventListener('message', (event: { data: string }) => {
      let msg: { T?: string; status?: string; message?: string; t?: string; S?: string; o?: number; h?: number; l?: number; c?: number; v?: number };
      try {
        msg = JSON.parse(event.data);
      } catch {
        return;
      }

      // Handle authentication response
      if (msg.T === 'status' && msg.status === 'authenticated') {
        this.authenticated = true;
        this.onAuthenticated();
      }

      // Handle bar data
      if (msg.T === 'b' && msg.S && msg.o != null && msg.h != null && msg.l != null && msg.c != null && msg.v != null && msg.t) {
        const candle = mapStreamBar(msg as any);
        const subject = this.barSubjects.get(msg.S);
        if (subject) {
          subject.next(candle);
        }
      }
    });
  }

  private onAuthenticated(): void {
    // Subscribe to all collected symbols
    const symbols = Array.from(this.symbols);
    if (symbols.length > 0) {
      this.ws!.send(buildSubscribeMessage(symbols));
    }
  }
}
