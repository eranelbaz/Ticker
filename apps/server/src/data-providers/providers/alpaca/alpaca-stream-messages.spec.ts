import {
  buildAuthMessage,
  buildSubscribeMessage,
  mapStreamBar,
} from './alpaca-stream-messages';

describe('buildAuthMessage', () => {
  it('returns JSON with action auth and the provided credentials', () => {
    const msg = buildAuthMessage('key-123', 'secret-456');
    const parsed = JSON.parse(msg);
    expect(parsed).toEqual({
      action: 'auth',
      key: 'key-123',
      secret: 'secret-456',
    });
  });

  it('produces valid JSON string', () => {
    expect(() => JSON.parse(buildAuthMessage('k', 's'))).not.toThrow();
  });
});

describe('buildSubscribeMessage', () => {
  it('returns JSON with action subscribe and bars array of symbols', () => {
    const msg = buildSubscribeMessage(['SPY', 'AAPL']);
    const parsed = JSON.parse(msg);
    expect(parsed).toEqual({
      action: 'subscribe',
      bars: ['SPY', 'AAPL'],
    });
  });

  it('handles an empty symbols array', () => {
    const msg = buildSubscribeMessage([]);
    const parsed = JSON.parse(msg);
    expect(parsed).toEqual({
      action: 'subscribe',
      bars: [],
    });
  });

  it('produces valid JSON string', () => {
    expect(() => JSON.parse(buildSubscribeMessage(['X']))).not.toThrow();
  });
});

describe('mapStreamBar', () => {
  it('maps a stream bar to a Candle with Unix-second time', () => {
    const streamBar = {
      T: 'b' as const,
      S: 'SPY',
      o: 100,
      h: 105,
      l: 99,
      c: 103,
      v: 5000,
      t: '2026-06-19T04:00:00Z',
      n: 10,
      vw: 102.5,
    };
    const candle = mapStreamBar(streamBar);
    expect(candle).toEqual({
      time: Math.floor(Date.parse('2026-06-19T04:00:00Z') / 1000),
      open: 100,
      high: 105,
      low: 99,
      close: 103,
      volume: 5000,
    });
  });

  it('omits optional fields from the output Candle', () => {
    const streamBar = {
      T: 'b' as const,
      S: 'AAPL',
      o: 50,
      h: 52,
      l: 49,
      c: 51,
      v: 1000,
      t: '2026-01-01T00:00:00Z',
    };
    const candle = mapStreamBar(streamBar);
    expect(candle).not.toHaveProperty('S');
    expect(candle).not.toHaveProperty('T');
    expect(candle).not.toHaveProperty('n');
    expect(candle).not.toHaveProperty('vw');
  });

  it('handles bars without optional n and vw fields', () => {
    const streamBar = {
      T: 'b' as const,
      S: 'TSLA',
      o: 200,
      h: 210,
      l: 195,
      c: 205,
      v: 3000,
      t: '2026-03-15T20:00:00Z',
    };
    const candle = mapStreamBar(streamBar);
    expect(candle.open).toBe(200);
    expect(candle.volume).toBe(3000);
  });
});
