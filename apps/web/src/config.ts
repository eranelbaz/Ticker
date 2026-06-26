/**
 * Build-time configuration injected by Vite's `define` plugin.
 * Override at build time with `DEFAULT_SYMBOL` and `DEFAULT_TIMEFRAME` env vars.
 */
export const DEFAULT_SYMBOL: string = typeof __DEFAULT_SYMBOL__ !== 'undefined'
  ? __DEFAULT_SYMBOL__
  : 'SPY';

export const DEFAULT_TIMEFRAME: string = typeof __DEFAULT_TIMEFRAME__ !== 'undefined'
  ? __DEFAULT_TIMEFRAME__
  : '1Day';
