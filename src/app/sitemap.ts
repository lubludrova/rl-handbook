import type { MetadataRoute } from 'next';
import { source } from '@/lib/source';

const siteUrl = 'https://rl-handbook.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const entries: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      // English is the default language and lives at the root (no prefix).
      url: `${siteUrl}/`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${siteUrl}/zh`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${siteUrl}/map`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/zh/map`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
  ];

  // Add docs pages for both languages. `page.url` already includes the locale
  // prefix for non-default languages (e.g. /zh/docs/...), so just append it.
  const enPages = source.getPages('en');
  const zhPages = source.getPages('zh');

  for (const page of enPages) {
    entries.push({
      url: `${siteUrl}${page.url}`,
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    });
  }

  for (const page of zhPages) {
    entries.push({
      url: `${siteUrl}${page.url}`,
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    });
  }

  return entries;
}
