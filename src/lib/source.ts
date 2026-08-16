import { docs } from 'collections/server';
import { type InferPageType, loader } from 'fumadocs-core/source';
import { lucideIconsPlugin } from 'fumadocs-core/source/lucide-icons';
import { createI18nMiddleware } from 'fumadocs-core/i18n/middleware';
import { i18n } from '@/lib/i18n';

// See https://fumadocs.dev/docs/headless/source-api for more info
export const source = loader({
  baseUrl: '/docs',
  source: docs.toFumadocsSource(),
  i18n,
  plugins: [lucideIconsPlugin()],
  pageTree: {
    transformers: [
      {
        // Chapters are folders containing only index.mdx (plus colocated assets
        // like example.py and figures/). Without this, Fumadocs renders them
        // with an expand chevron as if they had nested pages.
        folder(node) {
          if (node.children.length === 0 && node.index) {
            node.collapsible = false;
          }
          return node;
        },
      },
    ],
  },
});

export const i18nMiddleware = createI18nMiddleware({
  defaultLanguage: 'en',
  languages: ['en', 'zh'],
  hideLocale: 'default-locale',
});

export function getPageImage(page: InferPageType<typeof source>) {
  // Include the locale as the first segment so OG image URLs distinguish
  // between languages (e.g. /og/docs/en/... vs /og/docs/zh/...).
  // `next/og.js` (used by the OG route) renders PNG, hence the .png extension.
  const segments = [page.locale, ...page.slugs, 'image.png'];

  return {
    segments,
    url: `/og/docs/${segments.join('/')}`,
  };
}

export async function getLLMText(page: InferPageType<typeof source>) {
  const processed = await page.data.getText('processed');

  return `# ${page.data.title}

${processed}`;
}
