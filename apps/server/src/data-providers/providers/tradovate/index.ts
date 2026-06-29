import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { Observable, Subject } from 'rxjs';
import { Candle } from '../../../candles/candles.type';
import { DataProvider } from '../types';
import type {
  TradovateChartPacket,
  TradovateCredentials,
  TradovateEnv,
  WebSocketFactory,
  WebSocketLike,
} from './tradovate.types';
import {
  tradovateAccessTokenResponseSchema,
  tradovateChartEventSchema,
  tradovateGetChartResultSchema,
  tradovateResponseItemSchema,
  tradovateThrottleSchema,
} from './tradovate.schema';
import {
  TRADOVATE_MD_WS_URL,
  authBaseUrl,
  buildAuthFrame,
  buildGetChartBody,
  buildRequestFrame,
  mapChartBar,
  prepareFrame,
  throttleError,
} from './tradovate.utils';

const HEARTBEAT_INTERVAL_MS = 2_500;
const CONNECT_TIMEOUT_MS = 10_000;
const REQUEST_TIMEOUT_MS = 10_000;
const HISTORY_TIMEOUT_MS = 15_000;
const STREAM_TIMEFRAME = '1Min';

type PendingRequest = {
  resolve: (data: unknown) => void;
  reject: (err: Error) => void;
};

type ChartSubscription = {
  ids: number[];
  handleBar: (candle: Candle) => void;
  handleEoh?: () => void;
};

@Injectable()
export class TradovateProvider implements DataProvider {
  private ws: WebSocketLike | null = null;
  private ready: Promise<void> | null = null;
  private requestId = 1;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;

  private readonly pending = new Map<number, PendingRequest>();
  private readonly chartHandlers = new Map<number, ChartSubscription>();
  private readonly barSubjects = new Map<string, Subject<Candle>>();
  private readonly barObservables = new Map<string, Observable<Candle>>();

  private readonly creds: TradovateCredentials;
  private readonly env: TradovateEnv;
  private readonly wsFactory: WebSocketFactory;

  constructor(wsFactory?: WebSocketFactory) {
    const name = process.env.TRADOVATE_USERNAME;
    const password = process.env.TRADOVATE_PASSWORD;
    const cid = process.env.TRADOVATE_CID;
    const sec = process.env.TRADOVATE_SECRET;
    if (!name || !password || !cid || !sec) {
      throw new Error('Tradovate API credentials are not configured');
    }
    this.creds = {
      name,
      password,
      cid: Number(cid),
      sec,
      deviceId: process.env.TRADOVATE_DEVICE_ID,
      appId: process.env.TRADOVATE_APP_ID || 'Ticker',
      appVersion: process.env.TRADOVATE_APP_VERSION || '1.0',
    };
    this.env = process.env.TRADOVATE_ENV === 'live' ? 'live' : 'demo';
    this.wsFactory =
      wsFactory ?? (() => new global.WebSocket(TRADOVATE_MD_WS_URL));
  }

  async getHistoricalData(
    symbol: string,
    count: number,
    timeframe: string,
  ): Promise<Candle[]> {
    await this.ensureReady();
    const { ids, realtimeId } = await this.requestChart(
      symbol,
      count,
      timeframe,
    );
    const bars: Candle[] = [];
    try {
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => {
          this.unregisterChart(ids);
          reject(new Error(`Timed out fetching history for symbol ${symbol}`));
        }, HISTORY_TIMEOUT_MS);
        timer.unref?.();
        this.registerChart({
          ids,
          handleBar: (candle) => bars.push(candle),
          handleEoh: () => {
            clearTimeout(timer);
            this.unregisterChart(ids);
            resolve();
          },
        });
      });
    } finally {
      void this.send('md/cancelChart', { subscriptionId: realtimeId }).catch(
        () => undefined,
      );
    }
    if (bars.length === 0) {
      throw new Error(`No market data returned for symbol ${symbol}`);
    }
    return bars.sort((a, b) => a.time - b.time);
  }

  private async requestChart(
    symbol: string,
    count: number,
    timeframe: string,
  ): Promise<{ ids: number[]; realtimeId: number }> {
    const raw = await this.send(
      'md/getChart',
      buildGetChartBody({ symbol, count, timeframe }),
    );
    const throttle = tradovateThrottleSchema.safeParse(raw);
    if (throttle.success) {
      const err = throttleError(throttle.data, 'md/getChart');
      if (err) {
        throw err;
      }
    }
    const parsed = tradovateGetChartResultSchema.safeParse(raw);
    const realtimeId = parsed.success
      ? (parsed.data.realtimeId ?? parsed.data.subscriptionId)
      : undefined;
    if (!parsed.success || realtimeId === undefined) {
      throw new Error(
        `Tradovate md/getChart returned an unexpected response: ${JSON.stringify(raw)}`,
      );
    }
    const ids = [parsed.data.historicalId, realtimeId].filter(
      (id): id is number => id !== undefined,
    );
    return { ids, realtimeId };
  }

  getStreamData(symbol: string): Observable<Candle> {
    const existing = this.barObservables.get(symbol);
    if (existing) {
      return existing;
    }
    const subject = new Subject<Candle>();
    this.barSubjects.set(symbol, subject);
    const observable = subject.asObservable();
    this.barObservables.set(symbol, observable);
    void this.startStream(symbol, subject).catch((err) => {
      subject.error(err as Error);
      this.barSubjects.delete(symbol);
      this.barObservables.delete(symbol);
    });
    return observable;
  }

  private async startStream(
    symbol: string,
    subject: Subject<Candle>,
  ): Promise<void> {
    await this.ensureReady();
    const { ids } = await this.requestChart(symbol, 1, STREAM_TIMEFRAME);
    this.registerChart({
      ids,
      handleBar: (candle) => subject.next(candle),
    });
  }

  private ensureReady(): Promise<void> {
    if (!this.ready) {
      this.ready = this.connect();
      this.ready.catch(() => {
        this.ready = null;
        this.stopHeartbeat();
      });
    }
    return this.ready;
  }

  private async connect(): Promise<void> {
    const token = await this.getToken();
    return new Promise<void>((resolve, reject) => {
      const timer = setTimeout(
        () =>
          reject(
            new Error('Tradovate connection timed out before authorization'),
          ),
        CONNECT_TIMEOUT_MS,
      );
      timer.unref?.();
      const onReady = () => {
        clearTimeout(timer);
        resolve();
      };
      const onError = (err: Error) => {
        clearTimeout(timer);
        reject(err);
      };
      this.ws = this.wsFactory();
      this.ws.addEventListener('message', (event: { data: string }) => {
        this.handleFrame(event.data, token, onReady, onError);
      });
      this.ws.addEventListener('close', () => this.stopHeartbeat());
      this.ws.addEventListener('error', () =>
        onError(new Error('Tradovate socket error')),
      );
    });
  }

  private async getToken(): Promise<string> {
    const response = await axios.post(
      `${authBaseUrl(this.env)}/auth/accesstokenrequest`,
      {
        name: this.creds.name,
        password: this.creds.password,
        appId: this.creds.appId,
        appVersion: this.creds.appVersion,
        cid: this.creds.cid,
        sec: this.creds.sec,
        ...(this.creds.deviceId ? { deviceId: this.creds.deviceId } : {}),
      },
      { timeout: 10_000 },
    );
    const data = tradovateAccessTokenResponseSchema.parse(response.data);
    const throttle = throttleError(data, 'authentication');
    if (throttle) {
      throw throttle;
    }
    if (data.errorText) {
      throw new Error(`Tradovate authentication failed: ${data.errorText}`);
    }
    const value = data.mdAccessToken ?? data.accessToken;
    if (!value) {
      throw new Error(
        'Tradovate authentication failed: no access token returned',
      );
    }
    return value;
  }

  private handleFrame(
    raw: string,
    token: string,
    onReady: () => void,
    onReadyError: (err: Error) => void,
  ): void {
    const [type, items] = prepareFrame(raw);
    if (type === 'o') {
      this.ws!.send(buildAuthFrame(token));
      this.startHeartbeat();
      return;
    }
    if (type === 'c') {
      this.stopHeartbeat();
      return;
    }
    if (type !== 'a') {
      return;
    }
    for (const item of items) {
      const response = tradovateResponseItemSchema.safeParse(item);
      if (response.success) {
        const { i, s, d } = response.data;
        if (i === 0) {
          if (s === 200) {
            onReady();
          } else {
            onReadyError(new Error('Tradovate authorization failed'));
          }
          continue;
        }
        const pending = this.pending.get(i);
        if (pending) {
          this.pending.delete(i);
          if (s === 200) {
            pending.resolve(d);
          } else {
            pending.reject(
              new Error(`Tradovate request ${i} failed with status ${s}`),
            );
          }
        }
        continue;
      }
      const chart = tradovateChartEventSchema.safeParse(item);
      if (chart.success) {
        this.handleChart(chart.data.d.charts);
      }
    }
  }

  private handleChart(charts: TradovateChartPacket[]): void {
    for (const packet of charts) {
      const sub = this.chartHandlers.get(packet.id);
      if (!sub) {
        continue;
      }
      if (packet.bars) {
        for (const raw of packet.bars) {
          sub.handleBar(mapChartBar(raw));
        }
      }
      if (packet.eoh) {
        sub.handleEoh?.();
      }
    }
  }

  private registerChart(sub: ChartSubscription): void {
    for (const id of sub.ids) {
      this.chartHandlers.set(id, sub);
    }
  }

  private unregisterChart(ids: number[]): void {
    for (const id of ids) {
      this.chartHandlers.delete(id);
    }
  }

  private send(endpoint: string, body: unknown): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const id = this.requestId++;
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`Tradovate request ${id} (${endpoint}) timed out`));
      }, REQUEST_TIMEOUT_MS);
      timer.unref?.();
      this.pending.set(id, {
        resolve: (data) => {
          clearTimeout(timer);
          resolve(data);
        },
        reject: (err) => {
          clearTimeout(timer);
          reject(err);
        },
      });
      this.ws!.send(buildRequestFrame(endpoint, id, body));
    });
  }

  private startHeartbeat(): void {
    if (this.heartbeatTimer) {
      return;
    }
    this.heartbeatTimer = setInterval(() => {
      this.ws?.send('[]');
    }, HEARTBEAT_INTERVAL_MS);
    this.heartbeatTimer.unref?.();
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }
}
