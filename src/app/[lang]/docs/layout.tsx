'use client';

import { use } from 'react';
import { source } from '@/lib/source';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { useBaseOptions } from '@/lib/layout.shared';
import { ReadingProgress } from '@/components/ReadingProgress';
import {
  languageSelectSlot,
  themeSwitchSlot,
  ToggleBar,
} from '@/components/ToggleBar';

export default function Layout({ children, params: paramsPromise }: { children: React.ReactNode; params: Promise<{ lang: string }> }) {
  const params = use(paramsPromise);
  const lang = params.lang;
  const base = useBaseOptions();
  return (
    <DocsLayout
      tree={source.getPageTree(lang)}
      {...base}
      // Inject the custom square language/theme toggles (same look on desktop
      // and mobile):
      //  - Desktop: next to the title logo in the sidebar top row via
      //    `nav.children` (shown at `md+`, `hidden` below so it doesn't sit in
      //    the mobile top nav).
      //  - Mobile: in the mobile drawer's top row, injected through the
      //    `slots` (so the drawer uses the same square buttons instead of the
      //    default sliding/text style).
      // The desktop sidebar bottom row still renders these slots but is hidden
      // via CSS (see `global.css`) so it doesn't repeat. The home page is not
      // affected (shared `nav.children` is kept empty).
      nav={{ ...base.nav, children: <ToggleBar className="hidden md:flex" /> }}
      slots={{
        languageSelect: languageSelectSlot,
        themeSwitch: themeSwitchSlot,
      }}
      // Remove the GitHub icon link so nothing is left at the sidebar bottom.
      githubUrl={undefined}
    >
      <ReadingProgress />
      {children}
    </DocsLayout>
  );
}
