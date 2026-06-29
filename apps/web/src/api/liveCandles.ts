import type { Candle } from '@ticker/server';

export function subscribeLiveCandles(
  symbol: string,
  onCandle: (candle: Candle) => void,
): () => void {
  const url = `/api/candles/${encodeURIComponent(symbol)}/stream`;
  const source = new EventSource(url);

  source.onmessage = (event: MessageEvent) => {
    const candle: Candle = JSON.parse(event.data);
    onCandle(candle);
  };

  return () => {
    source.close();
  };
}
