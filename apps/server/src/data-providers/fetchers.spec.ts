// fetchers.alpaca tests live in candles.service.spec.ts — it mocks axios cleanly
// and tests the full fetcher path through the service.
// This file exists to verify the provider registry structure.

import { fetchers, ProviderName } from './fetchers';

describe('fetchers registry', () => {
  it('has alpaca as a registered provider', () => {
    expect(fetchers).toHaveProperty('alpaca');
    expect(typeof fetchers.alpaca).toBe('function');
  });

  it('ProviderName type includes alpaca', () => {
    const provider: ProviderName = 'alpaca';
    expect(provider).toBe('alpaca');
  });
});
