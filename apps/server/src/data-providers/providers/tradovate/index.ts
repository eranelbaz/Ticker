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
    this.wsFactory = wsFactory ?? (() => new global.WebSocket(TRADOVATE_MD_WS_URL));
  }

  getHistoricalData(symbol: string, count: number, timeframe: string): Promise<Candle[]> {
    throw new Error('not implemented');
  }

  getStreamData(symbol: string): Observable<Candle> {
    throw new Error('not implemented');
  }
}
