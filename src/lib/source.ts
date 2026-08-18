import { enDocs, meta } from 'collections/server';
import { zhDocs } from 'collections/dynamic';
import { type InferPageType, loader, type StaticSource } from 'fumadocs-core/source';
import { lucideIconsPlugin } from 'fumadocs-core/source/lucide-icons';
import { i18n } from '@/lib/i18n';

// English pages are compiled at build time (async chunks), Chinese pages are
// compiled at runtime (dynamic collection). Both are merged into a single
// source so the existing `source.getPage(slug, lang)` API keeps working.
type PageData = (typeof enDocs)[number] | (typeof zhDocs)[number];
type MetaData = (typeof meta)[number];

const files: StaticSource<{ pageData: PageData; metaData: MetaData }>['files'] = [
  ...enDocs.map((entry) => ({
    type: 'page' as const,
    path: entry.info.path,
    absolutePath: entry.info.fullPath,
    data: entry,
  })),
  ...zhDocs.map((entry) => ({
    type: 'page' as const,
    path: entry.info.path,
    absolutePath: entry.info.fullPath,
    data: entry,
  })),
  ...meta.map((entry) => ({
    type: 'meta' as const,
    path: entry.info.path,
    absolutePath: entry.info.fullPath,
    data: entry,
  })),
];

// See https://fumadocs.dev/docs/headless/source-api for more info
export const source = loader({
  baseUrl: '/docs',
  source: { files } as StaticSource<{ pageData: PageData; metaData: MetaData }>,
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
  await page.data.load();
  // Chinese pages are compiled at runtime without postprocessing, so
  // `processed` markdown is unavailable there — fall back to raw content.
  const text =
    page.locale === i18n.defaultLanguage
      ? await page.data.getText('processed')
      : await page.data.getText('raw');

  return `# ${page.data.title}

${text}`;
}
