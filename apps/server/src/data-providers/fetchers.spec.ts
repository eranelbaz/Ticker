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
