import type { Config } from 'tailwindcss'
import daisyui from 'daisyui'

export default {
  content: [
    './app.vue',
    './components/**/*.{vue,js,ts}',
    './pages/**/*.{vue,js,ts}',
    './layouts/**/*.{vue,js,ts}',
    './composables/**/*.{js,ts}',
    './plugins/**/*.{js,ts}'
  ],
  theme: {
    extend: {}
  },
  plugins: [daisyui],
  daisyui: {
    themes: [
      {
        candy: {
          primary: '#f472b6',
          secondary: '#60a5fa',
          accent: '#fbbf24',
          neutral: '#1f2937',
          'base-100': '#111827'
        }
      },
      {
        neon: {
          primary: '#22d3ee',
          secondary: '#a78bfa',
          accent: '#f43f5e',
          neutral: '#0f172a',
          'base-100': '#020617'
        }
      },
      'lofi',
      'business'
    ]
  }
} satisfies Config


