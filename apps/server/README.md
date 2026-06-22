# @ticker/server

NestJS API for Ticker. See the [root README](../../README.md) for development instructions.

## Market data

Candle data comes from the [Alpaca Market Data API](https://docs.alpaca.markets/)
(free Basic plan, IEX feed). The default symbol is `SPY` — the S&P 500 ETF.
The S&P 500 index itself (`SPX`) is licensed index data and is not available on
the free tier; swap the symbol once you have a paid indices subscription.

### Setup

1. Create API keys at https://app.alpaca.markets/ under **Home → API Keys**.
2. Copy `.env.example` to `.env` and fill in the values:

   ```bash
   cp .env.example .env
   ```

   | Variable                | Description                     |
   | ----------------------- | ------------------------------- |
   | `ALPACA_API_KEY_ID`     | Alpaca API key ID               |
   | `ALPACA_API_SECRET_KEY` | Alpaca API secret key           |

Without valid credentials the `/api/candles/:symbol` endpoint returns
`503 Service Unavailable`.
