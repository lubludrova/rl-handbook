'use client';

import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { useBaseOptions } from '@/lib/layout.shared';
import { languageSelectSlot } from '@/components/ToggleBar';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <HomeLayout
      {...useBaseOptions()}
      // Keep the language switcher consistent with the home page (square
      // button, menu lists languages directly).
      slots={{ languageSelect: languageSelectSlot }}
    >
      {children}
    </HomeLayout>
  );
}
