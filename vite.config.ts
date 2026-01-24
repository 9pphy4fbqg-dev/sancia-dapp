import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // GitHub Pages部署使用相对路径
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  },
  envPrefix: ['REACT_APP_', 'VITE_'], // 支持REACT_APP_和VITE_前缀的环境变量
  resolve: {
    // 将@livekit/components-react和@livekit/components-core别名指向本地修改后的组件目录
    alias: {
      '@livekit/components-react': path.resolve(__dirname, './components-js/packages/react/src'),
      '@livekit/components-core': path.resolve(__dirname, './components-js/packages/core/src')
    }
  }
})