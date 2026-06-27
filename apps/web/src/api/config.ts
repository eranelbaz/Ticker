import type { AppConfig } from '@ticker/server';
import axios from 'axios';

export async function fetchConfig(): Promise<AppConfig> {
  const { data } = await axios.get<AppConfig>('/api/candles/config', { timeout: 10_000 });
  return data;
}
