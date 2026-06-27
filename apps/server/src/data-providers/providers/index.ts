export type { DataProvider } from './types';
export { DATA_PROVIDER } from './types';

export { AlpacaProvider } from './alpaca';
export { MockProvider } from './mock-provider';

export type ProviderName = 'alpaca' | 'mock-provider';

export function getProviderRegistry(): Record<ProviderName, new () => DataProvider> {
  return {
    'alpaca': AlpacaProvider,
    'mock-provider': MockProvider,
  };
}
