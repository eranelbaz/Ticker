import { Candle } from '../../../candles/candles.type';
import { timeframeToSeconds } from '@ticker/shared';

export const EMIT_INTERVAL_MS = 1000;

export function generateNextCandle(basePrice: number, time: number): { candle: Candle; nextBasePrice: number } {
  const volatility = basePrice * 0.002;
  const change = (Math.random() - 0.5) * volatility;
  const close = basePrice + change;
  const open = basePrice;
  const high = Math.max(open, close) + Math.random() * volatility * 0.5;
  const low = Math.min(open, close) - Math.random() * volatility * 0.5;
  const volume = Math.floor(Math.random() * 100000) + 1000;

  return {
    candle: {
      time,
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
      volume,
    },
    nextBasePrice: close,
  };
}

export function generateFakeCandles(count: number, timeframe: string = '1Day'): Candle[] {
  const intervalSeconds = timeframeToSeconds(timeframe);
  const nowSeconds = Math.floor(new Date().getTime() / 1000);
  const candles: Candle[] = [];
  let basePrice = 100;

  for (let i = count; i > 0; i--) {
    const { candle, nextBasePrice } = generateNextCandle(basePrice, nowSeconds - i * intervalSeconds);
    candles.push(candle);
    basePrice = nextBasePrice;
  }

  return candles.sort((a, b) => a.time - b.time);
}
