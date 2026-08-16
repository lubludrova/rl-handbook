import { defineI18n } from 'fumadocs-core/i18n';

export const i18n = defineI18n({
  defaultLanguage: 'en',
  languages: ['en', 'zh'],
  parser: 'dot',
  // English is the default language and lives at the root (no prefix);
  // Chinese files use the `index.zh.mdx` suffix and are prefixed with /zh.
  // Hide the default locale from URLs.
  hideLocale: 'default-locale',
});
