import axios from 'axios';
import { Candle } from '../candles/candle.interface';
import { AlpacaBarsResponse, buildBarsUrl, mapBar } from './alpaca';

export type ProviderName = 'alpaca';

export const fetchers: Record<
  ProviderName,
  (symbol: string, count: number) => Promise<Candle[]>
> = {
  alpaca: async (symbol: string, count: number): Promise<Candle[]> => {
    const keyId = process.env.ALPACA_API_KEY_ID;
    const secretKey = process.env.ALPACA_API_SECRET_KEY;
    if (!keyId || !secretKey) {
      throw new Error('Alpaca API credentials are not configured');
    }

    const response = await axios.get<AlpacaBarsResponse>(
      buildBarsUrl(symbol, count),
      {
        headers: {
          'APCA-API-KEY-ID': keyId,
          'APCA-API-SECRET-KEY': secretKey,
        },
        timeout: 10_000,
      },
    );
    const body = response.data;

    if (!body.bars || body.bars.length === 0) {
      throw new Error(`No market data returned for symbol ${symbol}`);
    }

    return body.bars.map(mapBar).sort((a, b) => a.time - b.time);
  },
};
