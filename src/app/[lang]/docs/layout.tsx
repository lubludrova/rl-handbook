import { source } from '@/lib/source';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { ReadingProgress } from '@/components/ReadingProgress';
import {
  languageSelectSlot,
  themeSwitchSlot,
  ToggleBar,
} from '@/components/ToggleBar';
import { t, type UILang } from '@/lib/ui';

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const prefix = lang === 'en' ? '' : `/${lang}`;
  const tree = source.getPageTree(lang);
  return (
    <DocsLayout
      tree={tree}
      nav={{
        title: 'RL Handbook',
        url: prefix || '/',
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
        children: <ToggleBar className="hidden md:flex" />,
      }}
      links={[
        {
          text: t(lang as UILang, 'nav.map'),
          url: `${prefix}/map`,
          type: 'main',
        },
      ]}
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
