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
