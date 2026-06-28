import { z } from 'zod';
import { alpacaBarSchema, alpacaStreamBarSchema } from './alpaca.schema';

export type AlpacaBar = z.infer<typeof alpacaBarSchema>;
export type AlpacaStreamBar = z.infer<typeof alpacaStreamBarSchema>;

export type AlpacaBarsResponse = {
  bars: AlpacaBar[] | null;
  symbol?: string;
  next_page_token: string | null;
};

export interface WebSocketLike {
  send(data: string): void;
  close(): void;
  readyState?: number;
  addEventListener(type: string, listener: (event: { data: string }) => void): void;
  removeEventListener(type: string, listener: (event: { data: string }) => void): void;
}

export type WebSocketFactory = () => WebSocketLike;
