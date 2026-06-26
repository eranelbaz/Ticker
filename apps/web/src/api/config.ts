export interface AppConfig {
  defaultSymbol: string;
  defaultTimeframe: string;
}

export async function fetchConfig(): Promise<AppConfig> {
  const res = await fetch('/api/candles/config');
  return res.json();
}
