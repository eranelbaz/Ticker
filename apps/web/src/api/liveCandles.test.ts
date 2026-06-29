import { subscribeLiveCandles } from './liveCandles';

class FakeEventSource {
  onmessage: ((event: MessageEvent) => void) | null = null;
  url: string;

  constructor(url: string) {
    this.url = url;
  }

  close(): void {
    this.onmessage = null;
  }
}

describe('subscribeLiveCandles', () => {
  beforeEach(() => {
    (global as any).EventSource = jest.fn().mockImplementation(
      (url: string) => new FakeEventSource(url),
    );
  });

  it('opens EventSource to the correct URL', () => {
    subscribeLiveCandles('BTCUSD', () => {});

    expect((global as any).EventSource).toHaveBeenCalledWith(
      '/api/candles/BTCUSD/stream',
    );
  });

  it('parses JSON messages and calls onCandle', () => {
    const mockMessages = [
      { time: 1, open: 100, high: 110, low: 95, close: 105, volume: 50 },
      { time: 2, open: 105, high: 115, low: 100, close: 110, volume: 60 },
    ];
    let fakeSource: FakeEventSource | null = null;
    (global as any).EventSource.mockImplementation(
      (url: string) => {
        fakeSource = new FakeEventSource(url);
        return fakeSource;
      },
    );

    const candles: any[] = [];
    subscribeLiveCandles('BTCUSD', (candle) => {
      candles.push(candle);
    });

    expect(candles).toHaveLength(0);

    for (const msg of mockMessages) {
      fakeSource!.onmessage?.({ data: JSON.stringify(msg) } as MessageEvent);
    }

    expect(candles).toHaveLength(2);
    expect(candles[0]).toEqual(mockMessages[0]);
    expect(candles[1]).toEqual(mockMessages[1]);
  });

  it('returns an unsubscribe function that closes the connection', () => {
    let closeCalled = false;
    (global as any).EventSource.mockImplementation(() => ({
      onmessage: null,
      close() {
        closeCalled = true;
      },
    }));

    const unsubscribe = subscribeLiveCandles('BTCUSD', () => {});
    expect(closeCalled).toBe(false);

    unsubscribe();
    expect(closeCalled).toBe(true);
  });
});
