import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => {
  return {
    build: {
      outDir: 'build',
      chunkSizeWarningLimit: 800,
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            // Split large canvas/export libraries into separate chunks
            if (id.includes('jspdf')) return 'jspdf';
            if (id.includes('html2canvas')) return 'html2canvas';
            if (id.includes('canvas2svg')) return 'canvas2svg';
            
            // Keep React/ReactDOM together in vendor chunk
            if (id.includes('node_modules')) {
              // Split Monday.com SDKs
              if (id.includes('monday-sdk-js') || id.includes('@mondaycom/apps-sdk')) {
                return 'monday-vendor';
              }
              
              // Split Vibe UI components
              if (id.includes('@vibe/core') || id.includes('@vibe/icons')) {
                return 'vibe';
              }
              
              // Everything else (including React) goes to vendor
              return 'vendor';
            }
          }
        }
      }
    },
    plugins: [react()],
    server: {
      port: 8301,
      allowedHosts: ['.apps-tunnel.monday.app']
    },
    // Suppress Node.js module warnings from Monday SDK dependencies
    logLevel: 'warn',
  };
});