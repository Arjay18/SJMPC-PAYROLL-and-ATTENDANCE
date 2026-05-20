import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    extensions: ['.mjs', '.js', '.jsx', '.ts', '.tsx', '.json']
  },
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.(js|jsx)$/
  },
  server: {
    port: 5173
  }
})


