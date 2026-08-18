import { createI18nMiddleware } from 'fumadocs-core/i18n/middleware';

export const i18nMiddleware = createI18nMiddleware({
  defaultLanguage: 'en',
  languages: ['en', 'zh'],
  hideLocale: 'default-locale',
});
