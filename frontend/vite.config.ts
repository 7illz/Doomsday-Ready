import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const environment = loadEnv(mode, '..', '');

  return {
    envDir: '..',
    plugins: [react(), tailwindcss()],
    server: {
      port: Number(environment.VITE_FRONTEND_PORT ?? 5173),
    },
    test: {
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts',
    },
  };
});
