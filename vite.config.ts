import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks: {
          // Split large vendors into their own chunks so the Login route's
          // initial download stays small on mobile.
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          motion: ['framer-motion'],
          charts: ['recharts'],
          router: ['react-router-dom'],
        },
      },
    },
  },
});
