import { classNameMerge } from '../utils/classNameMerge';
import type { Quote } from '../utils/compute-quote';

const priceFormat = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

const signedFormat = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  signDisplay: 'always',
});

type Props = {
  symbol: string;
  quote: Quote | null;
  isLive: boolean;
};

export function TopBar({ symbol, quote, isLive }: Props) {
  const up = (quote?.change ?? 0) >= 0;

  return (
    <header
      role="banner"
      className={classNameMerge(
        'flex items-center gap-4 px-4 h-12 shrink-0',
        'bg-chart-toolbar/80 backdrop-blur border-b border-chart-grid',
        'text-chart-text',
      )}
    >
      <span className="text-lg font-semibold tracking-wide">{symbol}</span>

      {quote && (
        <>
          <span className="text-lg tabular-nums">
            {priceFormat.format(quote.price)}
          </span>
          <span
            className={classNameMerge(
              'text-sm tabular-nums',
              up ? 'text-green-400' : 'text-red-400',
            )}
          >
            {up ? '\u25b2' : '\u25bc'} {signedFormat.format(quote.change)} (
            {signedFormat.format(quote.changePercent)}%)
          </span>
        </>
      )}

      <span className="ml-auto flex items-center gap-2 text-xs font-medium">
        <span
          className={classNameMerge(
            'h-2 w-2 rounded-full',
            isLive ? 'bg-green-400' : 'bg-chart-text/40',
          )}
          aria-hidden
        />
        {isLive ? (
          <span className="text-green-400">LIVE</span>
        ) : (
          <span className="text-chart-text/50">OFFLINE</span>
        )}
      </span>
    </header>
  );
}
