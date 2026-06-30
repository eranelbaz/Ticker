import { timeframeToSeconds } from '@ticker/shared';
import { Candle } from '../../../candles/candles.type';
import { TradovateChartBar, TradovateEnv } from './tradovate.types';

export const TRADOVATE_MD_WS_URL = 'wss://md.tradovateapi.com/v1/websocket';

export function authBaseUrl(env: TradovateEnv): string {
  return env === 'live'
    ? 'https://live.tradovateapi.com/v1'
    : 'https://demo.tradovateapi.com/v1';
}

export function buildAuthFrame(token: string): string {
  return `authorize\n0\n\n${JSON.stringify(token)}`;
}

export function buildRequestFrame(endpoint: string, id: number, body?: unknown): string {
  return `${endpoint}\n${id}\n\n${body ? JSON.stringify(body) : ''}`;
}

export function prepareFrame(raw: string): [string, unknown[]] {
  const type = raw.slice(0, 1);
  if (raw.length <= 1) {
    return [type, []];
  }
  const parsed: unknown = JSON.parse(raw.slice(1));
  return [type, Array.isArray(parsed) ? parsed : [parsed]];
}

type ChartDescription = {
  underlyingType: 'MinuteBar' | 'DailyBar';
  elementSize: number;
  elementSizeUnit: 'UnderlyingUnits';
};

export function timeframeToChartDescription(timeframe: string): ChartDescription {
  const seconds = timeframeToSeconds(timeframe);
  if (seconds % 86400 === 0) {
    return { underlyingType: 'DailyBar', elementSize: seconds / 86400, elementSizeUnit: 'UnderlyingUnits' };
  }
  if (seconds % 60 === 0) {
    return { underlyingType: 'MinuteBar', elementSize: seconds / 60, elementSizeUnit: 'UnderlyingUnits' };
  }
  throw new Error(`Unsupported Tradovate timeframe: ${timeframe}`);
}

type BuildGetChartBodyParams = {
  symbol: string;
  count: number;
  timeframe: string;
};

export function buildGetChartBody({ symbol, count, timeframe }: BuildGetChartBodyParams) {
  return {
    symbol,
    chartDescription: timeframeToChartDescription(timeframe),
    timeRange: { asMuchAsElements: count },
  };
}

export function mapChartBar(bar: TradovateChartBar): Candle {
  return {
    time: Math.floor(Date.parse(bar.timestamp) / 1000),
    open: bar.open,
    high: bar.high,
    low: bar.low,
    close: bar.close,
    volume: (bar.upVolume ?? 0) + (bar.downVolume ?? 0),
  };
}

type ThrottleFields = {
  'p-ticket'?: string;
  'p-time'?: number;
  'p-captcha'?: boolean;
};

export function throttleError(data: ThrottleFields, context: string): Error | null {
  if (!data['p-ticket']) {
    return null;
  }
  const wait = data['p-time'] ? `${data['p-time']}s` : 'a short time';
  const captcha = data['p-captcha']
    ? ' A captcha is required — log in via the Tradovate app first.'
    : '';
  return new Error(`Tradovate ${context} is throttled; retry in ${wait}.${captcha}`);
}
