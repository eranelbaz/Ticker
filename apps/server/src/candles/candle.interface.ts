export interface Candle {
  /** Unix timestamp in seconds (UTC) — matches lightweight-charts' time format */
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}
