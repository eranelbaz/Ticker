import { Module } from '@nestjs/common';
import { CandlesController } from './candles.controller';
import { CandlesService } from './candles.service';
import { LiveCandlesService } from './live-candles.service';
import { AlpacaStreamService } from '../data-providers/alpaca-stream.service';
import { FakeStreamService } from '../data-providers/fake-stream.service';
import { STREAM_SERVICE } from '../data-providers/stream-service';

function createStreamService() {
  const provider = process.env.MARKET_DATA_PROVIDER || 'alpaca';
  if (provider === 'alpaca-fake') {
    return new FakeStreamService();
  }
  return new AlpacaStreamService();
}

@Module({
  controllers: [CandlesController],
  providers: [
    CandlesService,
    LiveCandlesService,
    {
      provide: STREAM_SERVICE,
      useFactory: () => createStreamService(),
    },
  ],
})
export class CandlesModule {}
