import { Candle } from '../candles/candle.interface';
import { timeframeToSeconds } from '../candles/timeframe';

function generateFakeCandles(
  symbol: string,
  count: number,
  timeframe: string = '1Day',
): Candle[] {
  const now = new Date();
  const candles: Candle[] = [];

  const basePrice = 100;
  const intervalSeconds = timeframeToSeconds(timeframe);
  const nowSeconds = Math.floor(now.getTime() / 1000);

  for (let i = count; i > 0; i--) {
    const time = nowSeconds - i * intervalSeconds;
    const volatility = basePrice * 0.002;
    const change = (Math.random() - 0.5) * volatility;
    const close = basePrice + change;
    const open = basePrice;
    const high = Math.max(open, close) + Math.random() * volatility * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * 0.5;
    const volume = Math.floor(Math.random() * 100000) + 1000;

    candles.push({
      time,
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
      volume,
    });

    basePrice = close;
  }

  return candles.sort((a, b) => a.time - b.time);
}

export function createFakeFetcher() {
  return (
    symbol: string,
    count: number,
    timeframe?: string,
  ): Promise<Candle[]> => {
    return Promise.resolve(generateFakeCandles(symbol, count, timeframe));
  };
}
