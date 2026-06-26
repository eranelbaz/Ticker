import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const DEFAULT_SYMBOL = env.VITE_SYMBOL ?? 'SPY';
  const DEFAULT_TIMEFRAME = env.VITE_TIMEFRAME ?? '1Day';

  return {
    plugins: [react(), tailwindcss()],
    define: {
      __DEFAULT_SYMBOL__: JSON.stringify(DEFAULT_SYMBOL),
      __DEFAULT_TIMEFRAME__: JSON.stringify(DEFAULT_TIMEFRAME),
    },
    server: {
      host: true,
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:3000',
          changeOrigin: true,
        },
      },
    },
  };
});
