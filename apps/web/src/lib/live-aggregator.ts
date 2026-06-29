import type { Candle } from '@ticker/server';

export function aggregateLiveBar(
  current: Candle,
  bar: Candle,
  timeframeSeconds: number,
): Candle {
  if (bar.time < current.time + timeframeSeconds) {
    return {
      time: current.time,
      open: current.open,
      high: Math.max(current.high, bar.high),
      low: Math.min(current.low, bar.low),
      close: bar.close,
      volume: current.volume + bar.volume,
    };
  }

  const steps = Math.floor((bar.time - current.time) / timeframeSeconds);
  const newTime = current.time + steps * timeframeSeconds;
  return {
    time: newTime,
    open: bar.open,
    high: bar.high,
    low: bar.low,
    close: bar.close,
    volume: bar.volume,
  };
}
