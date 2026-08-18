'use client';

import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { useBaseOptions } from '@/lib/layout.shared';
import { languageSelectSlot } from '@/components/ToggleBar';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <HomeLayout
      {...useBaseOptions()}
      // Replace the default language dropdown (which shows a "Choose a
      // language" heading) with the square button whose menu lists the
      // languages directly.
      slots={{ languageSelect: languageSelectSlot }}
    >
      {children}
    </HomeLayout>
  );
}
