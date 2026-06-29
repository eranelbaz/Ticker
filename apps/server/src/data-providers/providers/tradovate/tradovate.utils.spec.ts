import {
  TRADOVATE_MD_WS_URL,
  authBaseUrl,
  buildAuthFrame,
  buildGetChartBody,
  buildRequestFrame,
  mapChartBar,
  prepareFrame,
  throttleError,
  timeframeToChartDescription,
} from './tradovate.utils';

describe('authBaseUrl', () => {
  it('returns the live base URL for live', () => {
    expect(authBaseUrl('live')).toBe('https://live.tradovateapi.com/v1');
  });

  it('returns the demo base URL for demo', () => {
    expect(authBaseUrl('demo')).toBe('https://demo.tradovateapi.com/v1');
  });
});

describe('buildAuthFrame', () => {
  it('formats the authorize frame with id 0 and the JSON-quoted token', () => {
    expect(buildAuthFrame('tok-123')).toBe('authorize\n0\n\n"tok-123"');
  });
});

describe('buildRequestFrame', () => {
  it('formats an endpoint frame with id and JSON body', () => {
    expect(buildRequestFrame('md/getChart', 7, { symbol: 'MESU6' })).toBe(
      'md/getChart\n7\n\n{"symbol":"MESU6"}',
    );
  });

  it('formats a frame with an empty body when none is provided', () => {
    expect(buildRequestFrame('md/cancelChart', 3)).toBe(
      'md/cancelChart\n3\n\n',
    );
  });
});

describe('prepareFrame', () => {
  it('parses an open frame with no payload', () => {
    expect(prepareFrame('o')).toEqual(['o', []]);
  });

  it('parses an "a" data frame into its array of items', () => {
    expect(prepareFrame('a[{"i":0,"s":200}]')).toEqual([
      'a',
      [{ i: 0, s: 200 }],
    ]);
  });

  it('wraps a non-array payload in an array', () => {
    expect(prepareFrame('a{"e":"chart"}')).toEqual(['a', [{ e: 'chart' }]]);
  });
});

describe('timeframeToChartDescription', () => {
  it('maps 1Min to a 1-unit MinuteBar', () => {
    expect(timeframeToChartDescription('1Min')).toEqual({
      underlyingType: 'MinuteBar',
      elementSize: 1,
      elementSizeUnit: 'UnderlyingUnits',
    });
  });

  it('maps 5Min to a 5-unit MinuteBar', () => {
    expect(timeframeToChartDescription('5Min').elementSize).toBe(5);
  });

  it('maps 1Hour to a 60-unit MinuteBar', () => {
    expect(timeframeToChartDescription('1Hour')).toEqual({
      underlyingType: 'MinuteBar',
      elementSize: 60,
      elementSizeUnit: 'UnderlyingUnits',
    });
  });

  it('maps 1Day to a 1-unit DailyBar', () => {
    expect(timeframeToChartDescription('1Day')).toEqual({
      underlyingType: 'DailyBar',
      elementSize: 1,
      elementSizeUnit: 'UnderlyingUnits',
    });
  });

  it('throws on an unsupported timeframe', () => {
    expect(() => timeframeToChartDescription('1Sec')).toThrow(
      'Unsupported Tradovate timeframe: 1Sec',
    );
  });
});

describe('buildGetChartBody', () => {
  it('builds a getChart body with chartDescription and timeRange', () => {
    expect(
      buildGetChartBody({ symbol: 'MESU6', count: 300, timeframe: '1Min' }),
    ).toEqual({
      symbol: 'MESU6',
      chartDescription: {
        underlyingType: 'MinuteBar',
        elementSize: 1,
        elementSizeUnit: 'UnderlyingUnits',
      },
      timeRange: { asMuchAsElements: 300 },
    });
  });
});

describe('mapChartBar', () => {
  it('maps a chart bar to a Candle with Unix-second time and summed volume', () => {
    const candle = mapChartBar({
      timestamp: '2017-04-13T11:00:00.000Z',
      open: 2334.25,
      high: 2334.5,
      low: 2333,
      close: 2333.75,
      upVolume: 4712,
      downVolume: 201,
    });
    expect(candle).toEqual({
      time: Math.floor(Date.parse('2017-04-13T11:00:00.000Z') / 1000),
      open: 2334.25,
      high: 2334.5,
      low: 2333,
      close: 2333.75,
      volume: 4913,
    });
  });

  it('treats missing volumes as zero', () => {
    const candle = mapChartBar({
      timestamp: '2017-04-13T11:00:00.000Z',
      open: 1,
      high: 2,
      low: 0.5,
      close: 1.5,
    });
    expect(candle.volume).toBe(0);
  });
});

describe('TRADOVATE_MD_WS_URL', () => {
  it('is the shared market-data websocket URL', () => {
    expect(TRADOVATE_MD_WS_URL).toBe('wss://md.tradovateapi.com/v1/websocket');
  });
});

describe('throttleError', () => {
  it('returns null when no p-ticket is present', () => {
    expect(throttleError({}, 'authentication')).toBeNull();
  });

  it('returns an actionable error mentioning the wait time when throttled', () => {
    const err = throttleError({ 'p-ticket': 't', 'p-time': 30 }, 'md/getChart');
    expect(err?.message).toContain('throttled');
    expect(err?.message).toContain('30s');
  });
});
