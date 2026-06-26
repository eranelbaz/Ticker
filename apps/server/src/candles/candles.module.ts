import { Module } from '@nestjs/common';
import { CandlesController } from './candles.controller';
import { CandlesService } from './candles.service';
import { LiveCandlesService } from './live-candles.service';
import { STREAM_SERVICE } from '../data-providers/stream-service';
import { ProviderName } from '../data-providers/providers';
import { AlpacaFakeStreamService } from '../data-providers/providers';

const DEFAULT_PROVIDER: ProviderName = 'alpaca';

function getStreamService() {
  const provider = (process.env.MARKET_DATA_PROVIDER as ProviderName) ?? DEFAULT_PROVIDER;
  if (provider === 'alpaca-fake') {
    return new AlpacaFakeStreamService();
  }
  throw new Error('Real-time streaming not implemented for alpaca provider');
}

@Module({
  controllers: [CandlesController],
  providers: [
    CandlesService,
    LiveCandlesService,
    {
      provide: STREAM_SERVICE,
      useValue: getStreamService(),
    },
  ],
  exports: [CandlesController, LiveCandlesService],
})
export class CandlesModule {}
