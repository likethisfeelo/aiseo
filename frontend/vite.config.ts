import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // base is '/' — CloudFront subdomain-router adds /site/ prefix for site.dev.aiseo.tips
  server: {
    port: 5173,
  },
});
