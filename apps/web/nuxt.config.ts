import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: [
    '@pinia/nuxt',
    '@nuxtjs/tailwindcss'
  ],
  css: ['~/assets/styles.css'],
  compatibilityDate: '2024-08-15',
  app: {
    head: {
      link: [
        { rel: 'manifest', href: '/manifest.webmanifest' },
        { rel: 'icon', href: '/icons/icon-192.png', sizes: '192x192' },
        { rel: 'icon', href: '/icons/icon-512.png', sizes: '512x512' }
      ],
      meta: [
        { name: 'theme-color', content: '#8b5cf6' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' }
      ]
    }
  },
  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL || '',
    chunkSize: process.env.CHUNK_SIZE ? Number(process.env.CHUNK_SIZE) : 128,
    public: {
      wsUrl: ''
    }
  },
  nitro: {
    experimental: { websocket: true }
  },
  tailwindcss: {
    viewer: false
  },
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {}
    }
  },
  typescript: {
    typeCheck: true,
    tsConfig: {
      compilerOptions: {
        strict: true
      }
    }
  }
})


