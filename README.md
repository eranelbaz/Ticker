# Ticker

Open-source alternative to TradingView.

## Stack

- **Backend:** NestJS (`apps/server`, port 3000)
- **Frontend:** React + Vite + Tailwind CSS (`apps/web`, port 5173) with [lightweight-charts](https://github.com/tradingview/lightweight-charts)
- **Monorepo:** pnpm workspaces

## Development

```bash
pnpm install
pnpm dev       # starts server (:3000) and web (:5173) in parallel
pnpm test      # runs all workspace tests
```

Open http://localhost:5173 to see the chart.

## Dev mode (24/7 mock data)

US market data is only live during market hours. To develop the live chart
any time, run against Alpaca's `FAKEPACA` test stream (synthetic data, 24/7):

1. Copy `apps/web/.env.development.local.example` to `apps/web/.env.development.local`
2. Set `MARKET_DATA_PROVIDER=mock-provider` in `apps/server/.env`
3. Run:

```bash
pnpm dev
```

The server uses the fake data provider (synthetic candles, no API calls).
The browser subscribes to `FAKEPACA` via the configured `VITE_SYMBOL` / `VITE_TIMEFRAME`.

Real `ALPACA_API_KEY_ID` / `ALPACA_API_SECRET_KEY` are still required in
`apps/server/.env` if you switch back to real data (`MARKET_DATA_PROVIDER=alpaca`).
