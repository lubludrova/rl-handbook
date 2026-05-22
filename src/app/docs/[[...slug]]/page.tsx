import { getPageImage, source } from '@/lib/source';
import { JsonLd } from '@/components/JsonLd';
import { ArticleFeedback } from '@/components/ArticleFeedback';
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
  MarkdownCopyButton,
} from 'fumadocs-ui/layouts/docs/page';
import { notFound, redirect } from 'next/navigation';
import { getMDXComponents } from '@/components/mdx';
import type { Metadata } from 'next';
import { createRelativeLink } from 'fumadocs-ui/mdx';

const siteUrl = 'https://rl-handbook.com';

export default async function Page(props: PageProps<'/docs/[[...slug]]'>) {
  const params = await props.params;
  if (!params.slug || params.slug.length === 0) {
    redirect('/docs/00-introduction/what-is-reinforcement-learning');
  }
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const MDX = page.data.body;
  const pageUrl = `${siteUrl}${page.url.startsWith('/') ? page.url : `/${page.url}`}`;
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: page.data.title,
    description: page.data.description,
    url: pageUrl,
    author: {
      '@type': 'Person',
      name: 'Ruslan Ageev',
    },
    datePublished: '2026',
    publisher: {
      '@type': 'Organization',
      name: 'RL Handbook',
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': pageUrl,
    },
  } satisfies Record<string, unknown>;

  return (
    <DocsPage
      toc={page.data.toc}
      full={page.data.full}
      breadcrumb={{ enabled: true, includePage: true }}
    >
      <div className="relative">
        <DocsTitle>{page.data.title}</DocsTitle>
        <DocsDescription className="mb-0">{page.data.description}</DocsDescription>
        <div
          className="absolute top-0 right-0 hidden items-center gap-2 sm:flex"
          style={{ transform: 'translateY(-2px)' }}
        >
          <MarkdownCopyButton
            markdownUrl={`${page.url}.mdx`}
            className="copy-btn inline-flex h-9 items-center gap-2 rounded-sm px-3 font-heading text-xs font-medium cursor-pointer"
            style={{
              color: 'var(--color-fd-muted-foreground)',
              border: '1px solid var(--color-fd-border)',
              background: 'transparent',
            }}
          />
          <ArticleFeedback url={pageUrl} title={page.data.title} />
        </div>
      </div>
      <DocsBody>
        <MDX
          components={getMDXComponents({
            a: createRelativeLink(source, page),
          })}
        />
      </DocsBody>
      <JsonLd id={`article-json-ld-${params.slug.join('-')}`} data={articleSchema} />
    </DocsPage>
  );
}

export async function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(props: PageProps<'/docs/[[...slug]]'>): Promise<Metadata> {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const canonicalPath = page.url.startsWith('/') ? page.url : `/${page.url}`;
  const keywords = [
    page.data.title,
    `${page.data.title} reinforcement learning`,
    `${page.data.title} RL`,
    'RL Handbook',
    'reinforcement learning',
  ];

  return {
    title: page.data.title,
    description: page.data.description,
    keywords,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title: page.data.title,
      description: page.data.description,
      url: `${siteUrl}${canonicalPath}`,
      images: getPageImage(page).url,
    },
    twitter: {
      card: 'summary_large_image',
      title: page.data.title,
      description: page.data.description,
      images: [getPageImage(page).url],
    },
  };
}
