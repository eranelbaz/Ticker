import { renderHook, act } from '@testing-library/react';
import { useLiveCandles } from './useLiveCandles';

class FakeEventSource {
  onmessage: ((event: MessageEvent) => void) | null = null;
  close(): void {
    this.onmessage = null;
  }
}

describe('useLiveCandles', () => {
  beforeEach(() => {
    (global as any).EventSource = jest.fn().mockImplementation(
      () => new FakeEventSource(),
    );
  });

  it('returns the latest candle', () => {
    const fakeSource = new FakeEventSource();
    (global as any).EventSource.mockImplementation(() => fakeSource);

    const { result } = renderHook(() => useLiveCandles('BTCUSD'));

    expect(result.current).toBeNull();

    act(() => {
      fakeSource.onmessage?.({
        data: JSON.stringify({
          time: 1,
          open: 100,
          high: 110,
          low: 95,
          close: 105,
          volume: 50,
        }),
      } as MessageEvent);
    });

    expect(result.current).toEqual({
      time: 1,
      open: 100,
      high: 110,
      low: 95,
      close: 105,
      volume: 50,
    });
  });

  it('unsubscribes on unmount', () => {
    let closeCalled = false;
    const fakeSource = {
      onmessage: null as ((event: MessageEvent) => void) | null,
      close() {
        closeCalled = true;
        this.onmessage = null;
      },
    };
    (global as any).EventSource.mockImplementation(() => fakeSource);

    const { unmount } = renderHook(() => useLiveCandles('BTCUSD'));
    expect(closeCalled).toBe(false);

    unmount();
    expect(closeCalled).toBe(true);
  });
});
