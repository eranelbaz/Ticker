import { timeframeToSeconds } from './timeframe';

describe('timeframeToSeconds', () => {
  it('parses minute, hour, and day timeframes', () => {
    expect(timeframeToSeconds('1Min')).toBe(60);
    expect(timeframeToSeconds('5Min')).toBe(300);
    expect(timeframeToSeconds('1Hour')).toBe(3600);
    expect(timeframeToSeconds('1Day')).toBe(86400);
  });

  it('throws for unrecognized input', () => {
    expect(() => timeframeToSeconds('banana')).toThrow('invalid timeframe: banana');
    expect(() => timeframeToSeconds('1D')).toThrow('invalid timeframe: 1D');
  });
});
