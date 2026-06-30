import { z } from 'zod';
import {
  tradovateAccessTokenResponseSchema,
  tradovateChartBarSchema,
  tradovateChartEventSchema,
  tradovateChartPacketSchema,
  tradovateGetChartResultSchema,
  tradovateResponseItemSchema,
} from './tradovate.schema';

export type { WebSocketLike, WebSocketFactory } from '../websocket.types';

export type TradovateAccessTokenResponse = z.infer<typeof tradovateAccessTokenResponseSchema>;
export type TradovateResponseItem = z.infer<typeof tradovateResponseItemSchema>;
export type TradovateChartBar = z.infer<typeof tradovateChartBarSchema>;
export type TradovateChartPacket = z.infer<typeof tradovateChartPacketSchema>;
export type TradovateChartEvent = z.infer<typeof tradovateChartEventSchema>;
export type TradovateGetChartResult = z.infer<typeof tradovateGetChartResultSchema>;

export type TradovateEnv = 'demo' | 'live';

export type TradovateCredentials = {
  name: string;
  password: string;
  cid?: number;
  sec?: string;
  deviceId?: string;
  appId: string;
  appVersion: string;
};
