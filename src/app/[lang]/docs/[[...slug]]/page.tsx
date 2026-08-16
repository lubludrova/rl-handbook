import { getPageImage, source } from '@/lib/source';
import { JsonLd } from '@/components/JsonLd';
import { ArticleFeedback } from '@/components/ArticleFeedback';
import { EngagedReaderPrompt } from '@/components/EngagedReaderPrompt';
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

// `createRelativeLink` only rewrites links that start with "./" (relative to the
// source file path). Absolute `/docs/...` links — the form we use in content —
// are passed through untouched, so they would always point at the default
// (English, unprefixed) locale. Wrap it so that any `/docs`-rooted link gets
// the active locale prefix (e.g. `/zh/docs/...` in Chinese).
function createLocalizedLink(
  source: typeof import('@/lib/source').source,
  page: { locale?: string },
) {
  const RelativeLink = createRelativeLink(source, page as never);
  const prefix = page.locale && page.locale !== 'en' ? `/${page.locale}` : '';
  const LocalizedLink: typeof RelativeLink = async ({ href, ...props }) => {
    const localized =
      href && href.startsWith('/docs') ? `${prefix}${href}` : href;
    return <RelativeLink href={localized ?? undefined} {...props} />;
  };
  return LocalizedLink;
}


const siteUrl = 'https://rl-handbook.com';

// The default language (en) has no prefix in the URL; only `zh` is prefixed.
function localePrefix(lang: string): string {
  return lang === 'en' ? '' : `/${lang}`;
}

export default async function Page(props: PageProps<'/[lang]/docs/[[...slug]]'>) {
  const params = await props.params;
  const lang = params.lang as string;
  const prefix = localePrefix(lang);

  if (!params.slug || params.slug.length === 0) {
    redirect(`${prefix}/docs/00-introduction/introduction`);
  }
  const page = source.getPage(params.slug, lang);
  if (!page) notFound();

  const MDX = page.data.body;
  // `page.url` already includes the locale prefix for non-default languages.
  const pageUrl = `${siteUrl}${page.url}`;
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
            a: createLocalizedLink(source, page),
          })}
        />
      </DocsBody>
      <EngagedReaderPrompt url={pageUrl} title={page.data.title} />
      <JsonLd id={`article-json-ld-${params.slug.join('-')}`} data={articleSchema} />
    </DocsPage>
  );
}

export async function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(props: PageProps<'/[lang]/docs/[[...slug]]'>): Promise<Metadata> {
  const params = await props.params;
  const lang = params.lang as string;
  const page = source.getPage(params.slug, lang);
  if (!page) notFound();

  const canonicalPath = page.url;
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
