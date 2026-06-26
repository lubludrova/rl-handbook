import type { MetadataRoute } from 'next';
import { source } from '@/lib/source';

const siteUrl = 'https://rl-handbook.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const docsPages = source.getPages().map((page) => ({
    url: `${siteUrl}${page.url}`,
    lastModified,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  return [
    {
      url: siteUrl,
      lastModified,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${siteUrl}/docs`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/map`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    ...docsPages,
  ];
}
