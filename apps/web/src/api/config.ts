export interface AppConfig {
  defaultSymbol: string;
  defaultTimeframe: string;
}

import axios from 'axios';

export async function fetchConfig(): Promise<AppConfig> {
  const { data } = await axios.get<AppConfig>('/api/candles/config', { timeout: 10_000 });
  return data;
}
