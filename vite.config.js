import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import AutoImports from 'unplugin-auto-import/vite'
import { dirResolver, DirResolverHelper } from 'vite-auto-import-resolvers'
import vue from '@vitejs/plugin-vue'
import Pages from 'vite-plugin-pages'
import Layouts from 'vite-plugin-vue-layouts'

// https://vitejs.dev/config/

export default defineConfig({
  base: '/stockDividends/',
  plugins: [
    vue(),
    // 该辅助插件也是必需的 👇
    Pages(),
    Layouts(),
    DirResolverHelper(),
    AutoImports({
      imports: ['vue'],
      resolvers: [dirResolver()]
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
