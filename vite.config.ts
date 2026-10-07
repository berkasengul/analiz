import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2020',
    // three tek başına ~700 KB; ayrı chunk'larda tutuluyor ve sahne tembel yükleniyor
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('preload-helper') || id.includes('commonjsHelpers')) return 'vendor';
          if (!id.includes('node_modules')) return;
          if (/node_modules\/(react|react-dom|scheduler|zustand|framer-motion|motion-dom|motion-utils|lenis|use-sync-external-store)\//.test(id)) return 'vendor';
          if (/node_modules\/three\//.test(id)) return 'three';
          if (/node_modules\/(@react-three|postprocessing|three-stdlib|maath|troika|@monogrid|three-mesh-bvh|camera-controls|meshline|stats-gl)/.test(id)) return 'r3f';
        },
      },
    },
  },
});
