import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Forward tất cả request /api/... → Spring Boot localhost:8080
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      // Forward /uploads nếu có ảnh lưu trên BE
      '/uploads': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      }
    }
  }
})