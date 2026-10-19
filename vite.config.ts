import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Production is served from recivo://app (see electron/main.cjs); photos from recivo://foto.
const csp = [
  "default-src 'self'",
  "img-src 'self' recivo: blob: data:",
  "style-src 'self' 'unsafe-inline'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
].join('; ');

export default defineConfig({
  base: './',
  plugins: [
    react(),
    {
      name: 'recivo-csp',
      apply: 'build',
      transformIndexHtml: (html) =>
        html.replace('<head>', `<head>\n    <meta http-equiv="Content-Security-Policy" content="${csp}" />`),
    },
  ],
  server: { port: 5173, strictPort: true },
});
