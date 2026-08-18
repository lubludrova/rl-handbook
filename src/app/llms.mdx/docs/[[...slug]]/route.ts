import { getLLMText, source } from '@/lib/source';
import { i18n } from '@/lib/i18n';
import { notFound } from 'next/navigation';

// This route must be dynamic: locale-prefixed markdown requests
// (e.g. /zh/docs/dqn.mdx) are rewritten to /llms.mdx/docs/zh/dqn and the
// locale is passed through the path, so the route cannot be statically
// prerendered per parameter combination.
export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: RouteContext<'/llms.mdx/docs/[[...slug]]'>) {
  const { slug } = await params;
  let lang: string | undefined;
  let pageSlug: string[] = slug ?? [];
  if (pageSlug.length > 0 && i18n.languages.includes(pageSlug[0] as never)) {
    lang = pageSlug[0];
    pageSlug = pageSlug.slice(1);
  }

  const page = source.getPage(pageSlug, lang);
  if (!page) notFound();

  return new Response(await getLLMText(page), {
    headers: {
      'Content-Type': 'text/markdown',
    },
  });
}
