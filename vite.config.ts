import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      // Disable Vite's dev overlay which can fail when serializing certain DOM nodes
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  optimizeDeps: {
    // prevent Vite from pre-bundling server-only/node-only packages that break in the browser
    exclude: [
      'jsonwebtoken',
      'jws',
      'safe-buffer',
      '@neondatabase/serverless',
      '@vercel/node'
    ]
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Shim server-only modules to prevent them from being bundled into browser code
      'jsonwebtoken': path.resolve(__dirname, 'src/shims/jwt-browser.ts'),
      'jws': path.resolve(__dirname, 'src/shims/jws.ts'),
      'safe-buffer': path.resolve(__dirname, 'src/shims/safe-buffer.ts')
    },
  },
}));
