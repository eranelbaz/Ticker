import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import axios from 'axios';
import { Candle } from './candle.interface';
import { AlpacaBarsResponse, buildBarsUrl, mapBar } from '../data-providers/alpaca';

@Injectable()
export class CandlesService {
  async getCandles(symbol: string, count: number): Promise<Candle[]> {
    const keyId = process.env.ALPACA_API_KEY_ID;
    const secretKey = process.env.ALPACA_API_SECRET_KEY;
    if (!keyId || !secretKey) {
      throw new HttpException(
        'Alpaca API credentials are not configured',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    let body: AlpacaBarsResponse;
    try {
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
      body = response.data;
    } catch {
      // Covers network errors and non-2xx responses (axios throws on both).
      throw new HttpException(
        'Failed to fetch data from the Alpaca market data API',
        HttpStatus.BAD_GATEWAY,
      );
    }

    if (!body.bars || body.bars.length === 0) {
      throw new HttpException(
        `No market data returned for symbol ${symbol}`,
        HttpStatus.BAD_GATEWAY,
      );
    }

    return body.bars.map(mapBar).sort((a, b) => a.time - b.time);
  }
}
