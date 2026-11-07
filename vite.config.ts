import { defineConfig } from 'vite';

// Relative Pfade, damit die App auch unter https://<user>.github.io/<repo>/ läuft.
export default defineConfig({
  base: './',
});
