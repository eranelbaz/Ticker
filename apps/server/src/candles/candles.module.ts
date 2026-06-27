import { Module } from '@nestjs/common';
import { DataProvider } from '../data-providers/providers/types';
import { CandlesController } from './candles.controller';
import { CandlesService } from './candles.service';
import { DATA_PROVIDER } from '../data-providers/providers';
import { ProviderName, getProviderRegistry } from '../data-providers/providers';

const DEFAULT_PROVIDER: ProviderName = 'alpaca';

function getDataProvider(): DataProvider {
  const provider = (process.env.MARKET_DATA_PROVIDER as ProviderName) ?? DEFAULT_PROVIDER;
  const Ctor = getProviderRegistry()[provider];
  return new Ctor();
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
