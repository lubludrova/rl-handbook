'use client';

import { I18nProvider as FumadocsI18nProvider } from 'fumadocs-ui/contexts/i18n';
import { usePathname, useRouter } from 'next/navigation';

const locales = [
  { name: 'English', locale: 'en' },
  { name: '中文', locale: 'zh' },
];

export function I18nProvider({ lang, children }: { lang: string; children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  function onLocaleChange(value: string) {
    const segments = pathname.split('/').filter(Boolean);
    // Strip any existing locale prefix (only `zh` is prefixed; `en` is the
    // default and has no prefix in the URL).
    if (segments[0] === 'en' || segments[0] === 'zh') {
      segments.shift();
    }
    // Prepend the target locale only when it's not the default language.
    if (value !== 'en') {
      segments.unshift(value);
    }
    router.push(`/${segments.join('/')}`);
  }

  return (
    <FumadocsI18nProvider locale={lang} locales={locales} onLocaleChange={onLocaleChange}>
      {children}
    </FumadocsI18nProvider>
  );
}
