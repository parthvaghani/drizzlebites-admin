import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
    }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@tabler/icons-react': '@tabler/icons-react/dist/esm/icons/index.mjs',
    },
  },
  server: {
    host: '0.0.0.0',  // Add this line
    port: 5173,        // Optional: explicitly set port
    allowedHosts: [
      'http://192.168.10.46:5173/', // Allows a specific host
    ],
    proxy: {
      '/api': {
        target: 'http://localhost:3000/v1',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});