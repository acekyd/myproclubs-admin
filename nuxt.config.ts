// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@pinia/nuxt',
  ],



  devtools: {
    enabled: true,
  },

  css: ['~/assets/css/main.css'],

  colorMode: {
    preference: 'dark',
  },

  runtimeConfig: {
    public: {
      // Overridden by NUXT_PUBLIC_API_BASE
      apiBase: 'http://localhost:8000/api/v1/',
      appName: 'ProClubs Control Room',
    },
  },


  app: {
    head: {
      title: 'ProClubs · Control Room',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'robots', content: 'noindex, nofollow' },
      ],
      link: [
        { rel: 'icon', href: '/favicon.ico' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Syne:wght@500;600;700;800&display=swap',
        },
      ],
      htmlAttrs: { lang: 'en', class: 'dark' },
    },
  },

  compatibilityDate: '2025-01-15',

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs',
      },
    },
  },
})
