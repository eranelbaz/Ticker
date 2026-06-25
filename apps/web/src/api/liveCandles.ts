import type { Candle } from '@ticker/server';

export function subscribeLiveCandles(
  symbol: string,
  timeframe: string,
  onCandle: (candle: Candle) => void,
): () => void {
  const url = `/api/candles/${encodeURIComponent(symbol)}/stream?timeframe=${encodeURIComponent(timeframe)}`;
  const source = new EventSource(url);

  source.onmessage = (event: MessageEvent) => {
    const candle: Candle = JSON.parse(event.data);
    onCandle(candle);
  };

  return () => {
    source.close();
  };
}
