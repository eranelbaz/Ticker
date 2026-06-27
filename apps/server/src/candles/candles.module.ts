import { Module } from '@nestjs/common';
import { DATA_PROVIDER, getProviderRegistry, ProviderName } from '../data-providers/providers';
import { DataProvider } from '../data-providers/providers/types';
import { AlpacaStreamService } from '../data-providers/alpaca-stream-service';
import { CandlesController, LIVE_CANDLES_SERVICE, LiveCandlesService } from './candles.controller';
import { CandlesService } from './candles.service';
import { MockLiveCandlesService } from '../data-providers/mock-live-candles-service';

function getDataProvider(): DataProvider {
  const DEFAULT_PROVIDER: ProviderName = 'alpaca';
  const provider = (process.env.MARKET_DATA_PROVIDER as ProviderName) ?? DEFAULT_PROVIDER;
  const Ctor = getProviderRegistry()[provider];
  return new Ctor();
}

function getLiveCandlesProvider(): LiveCandlesService {
  const provider = (process.env.MARKET_DATA_PROVIDER as ProviderName) ?? 'alpaca';
  if (provider === 'mock-provider') {
    return new MockLiveCandlesService();
  }
  return new AlpacaStreamService();
}

@Module({
  controllers: [CandlesController],
  providers: [
    CandlesService,
    {
      provide: DATA_PROVIDER,
      useValue: getDataProvider(),
    },
    {
      provide: LIVE_CANDLES_SERVICE,
      useValue: getLiveCandlesProvider(),
    },
  ],
  exports: [CandlesController],
})
export class CandlesModule {}
