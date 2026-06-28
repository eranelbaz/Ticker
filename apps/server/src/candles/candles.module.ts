import { Module } from '@nestjs/common';
import { DATA_PROVIDER, getProviderRegistry, ProviderName } from '../data-providers/providers';
import { DataProvider } from '../data-providers/providers/types';
import { CandlesController } from './candles.controller';
import { CandlesService } from './candles.service';

function getDataProvider(): DataProvider {
  const provider = process.env.MARKET_DATA_PROVIDER as ProviderName;
  if (!provider) {
    throw new Error('MARKET_DATA_PROVIDER environment variable is not set');
  }
  const ProviderClass = getProviderRegistry()[provider];
  if (!ProviderClass) {
    throw new Error(`Unknown market data provider: ${provider}`);
  }
  return new ProviderClass();
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
})
export class CandlesModule {}
