'use client';

import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { useBaseOptions } from '@/lib/layout.shared';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <HomeLayout {...useBaseOptions()}>{children}</HomeLayout>;
}
