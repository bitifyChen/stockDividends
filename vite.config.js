import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import AutoImports from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { dirResolver, DirResolverHelper } from 'vite-auto-import-resolvers'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import { VantResolver } from '@vant/auto-import-resolver'
import vue from '@vitejs/plugin-vue'
import Pages from 'vite-plugin-pages'
import Layouts from 'vite-plugin-vue-layouts'
import { VitePWA } from 'vite-plugin-pwa'
import axios from 'axios'

export default defineConfig({
  base: '/',
  plugins: [
    twse(),
    vue(),
    Pages(),
    Layouts(),
    DirResolverHelper(),
    AutoImports({
      imports: ['vue'],
      resolvers: [dirResolver(), ElementPlusResolver(), VantResolver()]
    }),
    Components({
      resolvers: [ElementPlusResolver(), VantResolver()]
    }),
    VitePWA({
      registerType: 'prompt',
      devOptions: {
        enabled: false
      },
      manifest: {
        name: '股票小幫手',
        short_name: '股票小幫手',
        description: '股票與 ETF 持股資料檢視工具',
        theme_color: '#3E56D5',
        icons: [
          {
            src: '192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 4000000,
        clientsClaim: true
      }
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    host: '0.0.0.0'
  }
})

function twse() {
  return {
    name: 'twse-proxy',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.originalUrl.includes('/twse')) {
          next()
          return
        }

        const targetUrl = `https://mis.twse.com.tw${req.originalUrl.replace('/twse', '')}`
        axios({
          method: 'get',
          url: targetUrl
        })
          .then((resp) => {
            const msgArray = resp.data.msgArray
            if (!Array.isArray(msgArray) || !msgArray.length) {
              throw new Error('API is empty or response is not an array')
            }

            const item = msgArray[0]
            const getPriceByList = (list = null) => (list ? list.split('_')[0] : null)
            const result = {
              id: item.c,
              name: item.n,
              fullName: item.nf,
              price: item.z === '-' ? getPriceByList(item.b) ?? getPriceByList(item.a) : item.z,
              buy: item.b.split('_'),
              sell: item.a.split('_')
            }
            res.writeHead(200, { 'content-type': 'application/json' })
            res.end(JSON.stringify(result))
          })
          .catch((err) => {
            res.writeHead(404, { 'content-type': 'text/html;charset=utf8' })
            res.end(err?.message || 'err', 'utf8')
          })
      })
    }
  }
}
