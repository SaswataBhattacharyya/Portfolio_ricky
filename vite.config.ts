import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 8090,
    proxy: {
      "/api": "http://127.0.0.1:8000",
      "/media/": "http://127.0.0.1:8000",
    },
    hmr: {
      overlay: false,
    },
    watch: {
      ignored: ["**/sol_rasa/**", "**/solrasa_v1/**", "**/craft-boutique-online/**"],
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
