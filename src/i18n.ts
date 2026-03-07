import { createI18n } from 'vue-i18n'
import en from './locales/en'
import ptBR from './locales/pt-BR'

export const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: 'pt-BR',
  fallbackLocale: 'en',
  messages: {
    en,
    'pt-BR': ptBR,
  },
})
