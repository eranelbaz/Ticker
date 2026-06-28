export type AlpacaBar = {
  t: string;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
  n?: number;
  vw?: number;
};

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
