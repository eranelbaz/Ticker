import { z } from 'zod';
import { alpacaBarSchema, alpacaStreamBarSchema } from './alpaca.schema';

export type AlpacaBar = z.infer<typeof alpacaBarSchema>;
export type AlpacaStreamBar = z.infer<typeof alpacaStreamBarSchema>;

export type AlpacaBarsResponse = {
  bars: AlpacaBar[] | null;
  symbol?: string;
  next_page_token: string | null;
};

export type { WebSocketLike, WebSocketFactory } from '../websocket.types';
