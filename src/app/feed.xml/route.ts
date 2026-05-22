import { source } from '@/lib/source';

const siteUrl = 'https://rl-handbook.com';

export async function GET() {
  const pages = source.getPages();

  const items = pages
    .map((page) => {
      const url = `${siteUrl}${page.url.startsWith('/') ? page.url : `/${page.url}`}`;
      return `
    <item>
      <title>${escapeXml(page.data.title)}</title>
      <link>${url}</link>
      <description>${escapeXml(page.data.description ?? '')}</description>
      <guid>${url}</guid>
    </item>`;
    })
    .join('');

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>RL Handbook</title>
    <link>${siteUrl}</link>
    <description>A comprehensive guide to Reinforcement Learning</description>
    <language>en</language>
    <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml" />
    ${items}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
