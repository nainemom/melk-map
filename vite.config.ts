import { defineConfig } from 'vite'
import path from "path"
import react from '@vitejs/plugin-react'
import tailwindcss from "@tailwindcss/vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/melk-map',
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
    },
  },
})
