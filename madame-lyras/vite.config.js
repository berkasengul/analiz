import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const root = __dirname;
// kökteki her .html dosyası ayrı bir sayfa
const pages = Object.fromEntries(
  readdirSync(root).filter((f) => f.endsWith('.html')).map((f) => [f.replace(/\.html$/, ''), resolve(root, f)])
);

// <!-- @include header --> → src/partials/header.html (tüm sayfalarda ortak üst ve alt bilgi)
function includes() {
  return {
    name: 'html-includes',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        return html.replace(/<!--\s*@include\s+([\w-]+)\s*-->/g, (_, name) =>
          readFileSync(resolve(root, 'src/partials', `${name}.html`), 'utf8'));
      },
    },
  };
}

export default defineConfig({
  plugins: [includes(), react()],
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      input: pages,
      output: {
        manualChunks: {
          three: ['three'],
          r3f: ['react', 'react-dom', '@react-three/fiber', '@react-three/drei'],
        },
      },
    },
  },
});
