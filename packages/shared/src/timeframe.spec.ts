import { timeframeToSeconds } from './timeframe';

describe('timeframeToSeconds', () => {
  it('converts 1Min to 60', () => {
    expect(timeframeToSeconds('1Min')).toBe(60);
  });

  it('converts 5Min to 300', () => {
    expect(timeframeToSeconds('5Min')).toBe(300);
  });

  it('converts 90Min to 5400', () => {
    expect(timeframeToSeconds('90Min')).toBe(5400);
  });

  it('converts 1Hour to 3600', () => {
    expect(timeframeToSeconds('1Hour')).toBe(3600);
  });

  it('converts 1Day to 86400', () => {
    expect(timeframeToSeconds('1Day')).toBe(86400);
  });

  it('throws for unrecognized input', () => {
    expect(() => timeframeToSeconds('banana')).toThrow('invalid timeframe: banana');
    expect(() => timeframeToSeconds('1D')).toThrow('invalid timeframe: 1D');
  });
});
