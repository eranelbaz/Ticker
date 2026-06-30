import {
  tradovateAccessTokenResponseSchema,
  tradovateChartEventSchema,
  tradovateGetChartResultSchema,
  tradovateResponseItemSchema,
  tradovateThrottleSchema,
} from './tradovate.schema';

describe('tradovate schemas', () => {
  it('parses an access token response', () => {
    const parsed = tradovateAccessTokenResponseSchema.parse({
      accessToken: 'a',
      mdAccessToken: 'md',
      expirationTime: '2026-06-29T00:00:00Z',
      userId: 1,
    });
    expect(parsed.mdAccessToken).toBe('md');
  });

  it('parses an access token error response', () => {
    const parsed = tradovateAccessTokenResponseSchema.parse({ errorText: 'bad creds' });
    expect(parsed.errorText).toBe('bad creds');
  });

  it('parses a time-penalty throttle response', () => {
    const parsed = tradovateAccessTokenResponseSchema.parse({
      'p-ticket': 'ticket-123',
      'p-time': 30,
      'p-captcha': false,
    });
    expect(parsed['p-ticket']).toBe('ticket-123');
    expect(parsed['p-time']).toBe(30);
  });

  it('accepts a response item and rejects a chart event as a response item', () => {
    expect(tradovateResponseItemSchema.safeParse({ i: 0, s: 200 }).success).toBe(true);
    expect(
      tradovateResponseItemSchema.safeParse({ e: 'chart', d: { charts: [] } }).success,
    ).toBe(false);
  });

  it('parses the getChart result', () => {
    const parsed = tradovateGetChartResultSchema.parse({ historicalId: 32, realtimeId: 31 });
    expect(parsed).toEqual({ historicalId: 32, realtimeId: 31 });
  });

  it('tolerates a getChart result that uses subscriptionId', () => {
    const parsed = tradovateGetChartResultSchema.parse({ subscriptionId: 31 });
    expect(parsed.subscriptionId).toBe(31);
  });

  it('parses a throttle response shape', () => {
    const parsed = tradovateThrottleSchema.parse({ 'p-ticket': 't', 'p-time': 30 });
    expect(parsed['p-ticket']).toBe('t');
  });

  it('parses a chart event with bars and an eoh packet', () => {
    const event = tradovateChartEventSchema.parse({
      e: 'chart',
      d: {
        charts: [
          {
            id: 9,
            td: 20170413,
            bars: [
              {
                timestamp: '2017-04-13T11:00:00.000Z',
                open: 2334.25,
                high: 2334.5,
                low: 2333,
                close: 2333.75,
                upVolume: 4712,
                downVolume: 201,
              },
            ],
          },
          { id: 9, eoh: true },
        ],
      },
    });
    expect(event.d.charts[0].bars).toHaveLength(1);
    expect(event.d.charts[1].eoh).toBe(true);
  });
});
