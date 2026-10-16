import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { host: true },
  // assetsInlineLimit is left at Vite's 4096B default deliberately: CLAUDE.md:105
  // documents that behaviour, and the dev/build divergence it causes is something
  // to verify against, not configure away.
});
