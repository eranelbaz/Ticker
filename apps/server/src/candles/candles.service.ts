import { Injectable } from '@nestjs/common';
import { Candle } from './candle.interface';

const DAY_SECONDS = 86_400;

@Injectable()
export class CandlesService {
  getCandles(_symbol: string, count: number): Candle[] {
    const candles: Candle[] = [];
    const nowSec = Math.floor(Date.now() / 1000);
    const end = Math.floor(nowSec / DAY_SECONDS) * DAY_SECONDS;
    let lastClose = 100;

    for (let i = count - 1; i >= 0; i--) {
      const open = lastClose;
      const close = Math.max(1, open + (Math.random() - 0.5) * 4);
      const high = Math.max(open, close) + Math.random() * 2;
      const low = Math.max(0.5, Math.min(open, close) - Math.random() * 2);

      candles.push({
        time: end - i * DAY_SECONDS,
        open,
        high,
        low,
        close,
        volume: Math.round(1_000 + Math.random() * 9_000),
      });
      lastClose = close;
    }

    return candles;
  }
}
