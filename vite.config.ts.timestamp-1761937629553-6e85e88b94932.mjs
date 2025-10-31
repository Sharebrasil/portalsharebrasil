// vite.config.ts
import { defineConfig } from "file:///home/project/node_modules/vite/dist/node/index.js";
import react from "file:///home/project/node_modules/@vitejs/plugin-react-swc/index.mjs";
import path from "path";
import { componentTagger } from "file:///home/project/node_modules/lovable-tagger/dist/index.js";
var __vite_injected_original_dirname = "/home/project";
var vite_config_default = defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      // Disable Vite's dev overlay which can fail when serializing certain DOM nodes
      overlay: false
    }
  },
  plugins: [
    react(),
    mode === "development" && componentTagger()
  ].filter(Boolean),
  optimizeDeps: {
    // prevent Vite from pre-bundling server-only/node-only packages that break in the browser
    exclude: [
      "jsonwebtoken",
      "jws",
      "safe-buffer",
      "@neondatabase/serverless",
      "@vercel/node"
    ]
  },
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src"),
      // Shim server-only modules to prevent them from being bundled into browser code
      "jsonwebtoken": path.resolve(__vite_injected_original_dirname, "src/shims/jwt-browser.ts"),
      "jws": path.resolve(__vite_injected_original_dirname, "src/shims/jws.ts"),
      "safe-buffer": path.resolve(__vite_injected_original_dirname, "src/shims/safe-buffer.ts")
    }
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2NcIjtcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgeyBjb21wb25lbnRUYWdnZXIgfSBmcm9tIFwibG92YWJsZS10YWdnZXJcIjtcblxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoeyBtb2RlIH0pID0+ICh7XG4gIHNlcnZlcjoge1xuICAgIGhvc3Q6IFwiOjpcIixcbiAgICBwb3J0OiA4MDgwLFxuICAgIGhtcjoge1xuICAgICAgLy8gRGlzYWJsZSBWaXRlJ3MgZGV2IG92ZXJsYXkgd2hpY2ggY2FuIGZhaWwgd2hlbiBzZXJpYWxpemluZyBjZXJ0YWluIERPTSBub2Rlc1xuICAgICAgb3ZlcmxheTogZmFsc2UsXG4gICAgfSxcbiAgfSxcbiAgcGx1Z2luczogW1xuICAgIHJlYWN0KCksXG4gICAgbW9kZSA9PT0gJ2RldmVsb3BtZW50JyAmJlxuICAgIGNvbXBvbmVudFRhZ2dlcigpLFxuICBdLmZpbHRlcihCb29sZWFuKSxcbiAgb3B0aW1pemVEZXBzOiB7XG4gICAgLy8gcHJldmVudCBWaXRlIGZyb20gcHJlLWJ1bmRsaW5nIHNlcnZlci1vbmx5L25vZGUtb25seSBwYWNrYWdlcyB0aGF0IGJyZWFrIGluIHRoZSBicm93c2VyXG4gICAgZXhjbHVkZTogW1xuICAgICAgJ2pzb253ZWJ0b2tlbicsXG4gICAgICAnandzJyxcbiAgICAgICdzYWZlLWJ1ZmZlcicsXG4gICAgICAnQG5lb25kYXRhYmFzZS9zZXJ2ZXJsZXNzJyxcbiAgICAgICdAdmVyY2VsL25vZGUnXG4gICAgXVxuICB9LFxuICByZXNvbHZlOiB7XG4gICAgYWxpYXM6IHtcbiAgICAgIFwiQFwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vc3JjXCIpLFxuICAgICAgLy8gU2hpbSBzZXJ2ZXItb25seSBtb2R1bGVzIHRvIHByZXZlbnQgdGhlbSBmcm9tIGJlaW5nIGJ1bmRsZWQgaW50byBicm93c2VyIGNvZGVcbiAgICAgICdqc29ud2VidG9rZW4nOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnc3JjL3NoaW1zL2p3dC1icm93c2VyLnRzJyksXG4gICAgICAnandzJzogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJ3NyYy9zaGltcy9qd3MudHMnKSxcbiAgICAgICdzYWZlLWJ1ZmZlcic6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICdzcmMvc2hpbXMvc2FmZS1idWZmZXIudHMnKVxuICAgIH0sXG4gIH0sXG59KSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXlOLFNBQVMsb0JBQW9CO0FBQ3RQLE9BQU8sV0FBVztBQUNsQixPQUFPLFVBQVU7QUFDakIsU0FBUyx1QkFBdUI7QUFIaEMsSUFBTSxtQ0FBbUM7QUFNekMsSUFBTyxzQkFBUSxhQUFhLENBQUMsRUFBRSxLQUFLLE9BQU87QUFBQSxFQUN6QyxRQUFRO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixLQUFLO0FBQUE7QUFBQSxNQUVILFNBQVM7QUFBQSxJQUNYO0FBQUEsRUFDRjtBQUFBLEVBQ0EsU0FBUztBQUFBLElBQ1AsTUFBTTtBQUFBLElBQ04sU0FBUyxpQkFDVCxnQkFBZ0I7QUFBQSxFQUNsQixFQUFFLE9BQU8sT0FBTztBQUFBLEVBQ2hCLGNBQWM7QUFBQTtBQUFBLElBRVosU0FBUztBQUFBLE1BQ1A7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNMLEtBQUssS0FBSyxRQUFRLGtDQUFXLE9BQU87QUFBQTtBQUFBLE1BRXBDLGdCQUFnQixLQUFLLFFBQVEsa0NBQVcsMEJBQTBCO0FBQUEsTUFDbEUsT0FBTyxLQUFLLFFBQVEsa0NBQVcsa0JBQWtCO0FBQUEsTUFDakQsZUFBZSxLQUFLLFFBQVEsa0NBQVcsMEJBQTBCO0FBQUEsSUFDbkU7QUFBQSxFQUNGO0FBQ0YsRUFBRTsiLAogICJuYW1lcyI6IFtdCn0K
