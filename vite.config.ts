import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    open: true,
    proxy: {
      '/api/stats-events': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        ws: false,
        secure: false,
      },
      '/api/notifications-events': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        ws: false,
        secure: false,
      },
      '/api/notifications-events': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        ws: false,
        secure: false,
      },
    },
  },
  resolve: {
    alias: {
      // fix loading all icon chunks in dev mode
      // https://github.com/tabler/tabler-icons/issues/1233
      '@tabler/icons-react': '@tabler/icons-react/dist/esm/icons/index.mjs',
    },
  },
});
