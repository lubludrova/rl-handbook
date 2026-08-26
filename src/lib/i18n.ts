import { defineI18n } from 'fumadocs-core/i18n';

export const i18n = defineI18n({
  defaultLanguage: 'en',
  languages: ['en', 'zh', 'ru'],
  parser: 'dot',
  // English is the default language and lives at the root (no prefix);
  // Translated files use locale suffixes (`index.zh.mdx`, `index.ru.mdx`)
  // and non-default locales are prefixed in the URL.
  // Hide the default locale from URLs.
  hideLocale: 'default-locale',
});
