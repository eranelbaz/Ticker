import { Module } from '@nestjs/common';
import { CandlesController } from './candles.controller';
import { CandlesService } from './candles.service';
import { DATA_PROVIDER } from '../data-providers/providers';
import { ProviderName } from '../data-providers/providers';
import { AlpacaProvider, MockProvider } from '../data-providers/providers';

const DEFAULT_PROVIDER: ProviderName = 'alpaca';

function getDataProvider(): DataProvider {
  const provider = (process.env.MARKET_DATA_PROVIDER as ProviderName) ?? DEFAULT_PROVIDER;
  if (provider === 'mock-provider') {
    return new MockProvider();
  }
  return new AlpacaProvider();
}

@Module({
  controllers: [CandlesController],
  providers: [
    CandlesService,
    {
      provide: DATA_PROVIDER,
      useValue: getDataProvider(),
    },
  ],
  exports: [CandlesController],
})
export class CandlesModule {}
