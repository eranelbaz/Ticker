<<<<<<< HEAD
import { Injectable, Logger } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import { Candle } from '../candles/candle.interface';
import { buildAuthMessage, buildSubscribeMessage, mapStreamBar } from './alpaca-stream-messages';
import { IStreamService } from './stream-service';
=======
import { Injectable } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import { Candle } from '../candles/candle.type';
import { buildAuthMessage, buildSubscribeMessage, mapStreamBar } from './alpaca-stream-messages';
>>>>>>> origin/main

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
<<<<<<< HEAD
export class AlpacaStreamService implements IStreamService {
  private readonly logger = new Logger(AlpacaStreamService.name);
=======
export class AlpacaStreamService {
>>>>>>> origin/main
  private ws: WebSocketLike | null = null;
  private connected = false;
  private authenticated = false;
  private readonly symbols = new Set<string>();
  private readonly barSubjects = new Map<string, Subject<Candle>>();

  private readonly wsFactory: WebSocketFactory;

  constructor(wsFactory?: WebSocketFactory) {
<<<<<<< HEAD
    this.wsFactory = wsFactory ?? (() => new global.WebSocket(
      process.env.ALPACA_STREAM_URL || 'wss://stream.data.alpaca.markets/v2/iex',
    ));
=======
    this.wsFactory = wsFactory ?? (() => new global.WebSocket('wss://stream.data.alpaca.markets/v1beta1/stocks/bars'));
>>>>>>> origin/main
  }

  /**
   * Returns an Observable of 1-minute bars for the given symbol.
   * The WebSocket connection is lazily established on the first call.
   */
<<<<<<< HEAD
  minuteBars(symbol: string, timeframe?: string): Observable<Candle> {
=======
  minuteBars(symbol: string): Observable<Candle> {
>>>>>>> origin/main
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
<<<<<<< HEAD
      // Alpaca batches messages into a JSON array, e.g. [{"T":"b",...}].
      let messages: Array<{ T?: string; msg?: string; t?: string; S?: string; o?: number; h?: number; l?: number; c?: number; v?: number }>;
      try {
        const parsed = JSON.parse(event.data);
        messages = Array.isArray(parsed) ? parsed : [parsed];
=======
      let msg: { T?: string; status?: string; message?: string; t?: string; S?: string; o?: number; h?: number; l?: number; c?: number; v?: number };
      try {
        msg = JSON.parse(event.data);
>>>>>>> origin/main
      } catch {
        return;
      }

<<<<<<< HEAD
      for (const msg of messages) {
        // Handle authentication response
        if (msg.T === 'success' && msg.msg === 'authenticated') {
          this.authenticated = true;
          this.onAuthenticated();
          continue;
        }

        // Handle bar data
        if (msg.T === 'b' && msg.S && msg.o != null && msg.h != null && msg.l != null && msg.c != null && msg.v != null && msg.t) {
          const candle = mapStreamBar(msg as { T: string; S: string; o: number; h: number; l: number; c: number; v: number; t: string });
          const subject = this.barSubjects.get(msg.S);
          if (subject) {
            subject.next(candle);
          }
        }
      }
    });

    this.ws.addEventListener('error', (event: { message?: string }) => {
      this.logger.error(`Alpaca stream error: ${event?.message ?? 'unknown'}`);
    });

    this.ws.addEventListener('close', (event: { code?: number; reason?: string }) => {
      this.connected = false;
      this.authenticated = false;
      this.logger.warn(`Alpaca stream closed: code=${event?.code ?? '?'} reason=${event?.reason ?? ''}`);
    });
=======
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
>>>>>>> origin/main
  }

  private onAuthenticated(): void {
    // Subscribe to all collected symbols
    const symbols = Array.from(this.symbols);
    if (symbols.length > 0) {
      this.ws!.send(buildSubscribeMessage(symbols));
    }
  }
}
