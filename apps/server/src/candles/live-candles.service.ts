import { Inject, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Candle } from './candle.interface';
import type { StreamService } from '../data-providers/stream-service';
import { STREAM_SERVICE } from '../data-providers/stream-service';

@Injectable()
export class LiveCandlesService {
  constructor(
    @Inject(STREAM_SERVICE) private readonly streamService: StreamService,
  ) {}

  stream(symbol: string, timeframe: string = '1Min'): Observable<Candle> {
    return this.streamService.minuteBars(symbol, timeframe);
  }
}
