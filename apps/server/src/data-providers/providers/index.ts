export type { DataProvider } from './types';
export { DATA_PROVIDER } from './types';

export { AlpacaProvider } from './alpaca/index';
export { MockProvider } from './mock-provider/index';
export { TradovateProvider } from './tradovate/index';

export type ProviderName = 'alpaca' | 'mock-provider' | 'tradovate';

import { AlpacaProvider } from './alpaca/index';
import { MockProvider } from './mock-provider/index';
import { TradovateProvider } from './tradovate/index';
import type { DataProvider } from './types';

export function getProviderRegistry(): Record<ProviderName, new () => DataProvider> {
  return {
    'alpaca': AlpacaProvider,
    'mock-provider': MockProvider,
    'tradovate': TradovateProvider,
  };
}
