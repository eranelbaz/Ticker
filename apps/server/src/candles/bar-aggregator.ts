import { Candle } from './candle.type';

export class BarAggregator {
  private bucketTime: number | null = null;
  private open = 0;
  private high = -Infinity;
  private low = Infinity;
  private close = 0;
  private volume = 0;

  constructor(private readonly timeframeSeconds: number) {}

  fold(minute: Candle): Candle {
    const bucketTime = Math.floor(minute.time / this.timeframeSeconds) * this.timeframeSeconds;

    if (this.bucketTime === null || bucketTime !== this.bucketTime) {
      this.bucketTime = bucketTime;
      this.open = minute.open;
      this.high = minute.high;
      this.low = minute.low;
      this.close = minute.close;
      this.volume = minute.volume;
    } else {
      if (minute.high > this.high) this.high = minute.high;
      if (minute.low < this.low) this.low = minute.low;
      this.close = minute.close;
      this.volume += minute.volume;
    }

    return {
      time: this.bucketTime,
      open: this.open,
      high: this.high,
      low: this.low,
      close: this.close,
      volume: this.volume,
    };
  }
}
