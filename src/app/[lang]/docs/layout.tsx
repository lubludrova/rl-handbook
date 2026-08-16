'use client';

import { use } from 'react';
import { source } from '@/lib/source';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { useBaseOptions } from '@/lib/layout.shared';
import { ReadingProgress } from '@/components/ReadingProgress';

export default function Layout({ children, params: paramsPromise }: { children: React.ReactNode; params: Promise<{ lang: string }> }) {
  const params = use(paramsPromise);
  const lang = params.lang;
  return (
    <DocsLayout
      tree={source.getPageTree(lang)}
      {...useBaseOptions()}
    >
      <ReadingProgress />
      {children}
    </DocsLayout>
  );
}
