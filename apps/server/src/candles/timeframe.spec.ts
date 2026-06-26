import { DEFAULT_TIMEFRAME, timeframeToSeconds } from './timeframe';

describe('timeframeToSeconds', () => {
  it('exports DEFAULT_TIMEFRAME as 1Min', () => {
    expect(DEFAULT_TIMEFRAME).toBe('1Min');
  });

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

  it('rejects sub-minute Sec values', () => {
    expect(() => timeframeToSeconds('30Sec')).toThrow(/sub-minute/i);
  });

  it('rejects unknown timeframe strings', () => {
    expect(() => timeframeToSeconds('2Weeks')).toThrow(/invalid timeframe/i);
  });

  it('rejects invalid formats with a regex error', () => {
    expect(() => timeframeToSeconds('abc')).toThrow(/invalid timeframe/i);
  });
});
