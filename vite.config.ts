import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  css: {
    preprocessorOptions: {
      less: {
        additionalData: `@import './src/styles/variables.less';`,
      },
    },
  },
  server: {
    port: 3000,
    open: true,
    proxy: {
      // 在开发时将 /github 前缀代理到 GitHub API，避免浏览器 CORS 问题
      '/github': {
        target: 'https://api.github.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/github/, '')
      }
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
