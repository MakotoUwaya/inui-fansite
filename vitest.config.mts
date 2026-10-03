import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
  resolve: {
    alias: [
      { find: /^components\/(.*)/, replacement: path.resolve(import.meta.dirname, 'components/$1') },
      { find: /^hooks\/(.*)/, replacement: path.resolve(import.meta.dirname, 'hooks/$1') },
      { find: /^utils\/(.*)/, replacement: path.resolve(import.meta.dirname, 'utils/$1') },
      { find: /^types\/(.*)/, replacement: path.resolve(import.meta.dirname, 'types/$1') },
      { find: /^types$/, replacement: path.resolve(import.meta.dirname, 'types/index') },
      { find: /^styles\/(.*)/, replacement: path.resolve(import.meta.dirname, 'styles/$1') },
    ],
  },
});
