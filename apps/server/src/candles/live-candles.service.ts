import { Inject, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Candle } from './candle.interface';
import { DataProvider, DATA_PROVIDER } from '../data-providers/providers';

@Injectable()
export class LiveCandlesService {
  constructor(
    @Inject(DATA_PROVIDER) private readonly provider: DataProvider,
  ) {}

  stream(symbol: string): Observable<Candle> {
    return this.provider.getStreamData(symbol);
  }
}
