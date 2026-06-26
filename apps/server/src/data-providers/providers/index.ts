export type ProviderName = 'alpaca' | 'alpaca-fake';

export { createAlpacaFetcher } from './alpaca';
export { createAlpacaFakeFetcher, AlpacaFakeStreamService } from './alpaca-fake';
