'use client';

import { useEffect, useState, useTransition, type ComponentProps } from 'react';
import { Check, Languages, LoaderCircle, Moon, Sun } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverTrigger,
} from 'fumadocs-ui/components/ui/popover';
import { useI18n } from 'fumadocs-ui/contexts/i18n';
import { useTheme } from '@/lib/theme';
import { getLangFromPath, t } from '@/lib/ui';
import { twMerge } from 'tailwind-merge';

// Compact square icon buttons matching fumadocs' ghost icon-button style so
// they blend into the docs layout and stay smaller than the sidebar padding.
const iconButton =
  'inline-flex items-center justify-center rounded-md p-1.5 text-sm font-medium ' +
  'transition-colors duration-100 text-fd-muted-foreground ' +
  'hover:bg-fd-accent hover:text-fd-accent-foreground ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring ' +
  '[&_svg]:size-4';

/**
 * Square language button with a dropdown menu. Shared between the desktop
 * sidebar top row and the mobile drawer top row.
 *
 * Navigates directly to the same page in the target language (the default
 * language has no URL prefix, so switching zh → en must NOT go through
 * `/en/...`, which would cost an extra middleware redirect round trip).
 * Shows a spinner while the navigation is in flight so users see that
 * something is happening.
 */
export function LanguageButton({ className }: { className?: string }) {
  const { locale, locales } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const lang = getLangFromPath(pathname);
  const [pending, startTransition] = useTransition();

  const switchTo = (next: string) => {
    if (next === locale) return;
    const stripped = pathname.replace(/^\/(?:zh|ru)(?=\/|$)/, '') || '/';
    const target = next === 'en' ? stripped : `/${next}${stripped}`;
    startTransition(() => {
      router.push(target);
    });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={twMerge(iconButton, className)}
          aria-label={t(lang, 'nav.chooseLanguage')}
          title={t(lang, 'nav.chooseLanguage')}
        >
          {pending ? (
            <LoaderCircle className="animate-spin" />
          ) : (
            <Languages />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="flex flex-col gap-0.5 p-1.5">
        {locales?.map((item) => (
          <PopoverClose asChild key={item.locale}>
            <button
              type="button"
              className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-start text-sm transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground"
              onClick={() => switchTo(item.locale)}
            >
              {item.name}
              {item.locale === locale && (
                <Check className="size-4 text-fd-primary" />
              )}
            </button>
          </PopoverClose>
        ))}
      </PopoverContent>
    </Popover>
  );
}

/**
 * Square light/dark toggle button. The icon is gated behind a `mounted` flag
 * so the server-rendered HTML (always the moon) matches the first client frame,
 * avoiding a React hydration mismatch caused by `resolvedTheme` being unknown
 * until mount.
 */
export function ThemeButton({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const pathname = usePathname();
  const lang = getLangFromPath(pathname);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === 'dark';

  return (
    <button
      type="button"
      className={twMerge(iconButton, className)}
      aria-label={t(lang, 'nav.toggleTheme')}
      title={t(lang, 'nav.toggleTheme')}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
    >
      {isDark ? <Moon /> : <Sun />}
    </button>
  );
}

/**
 * Row of the square language + theme toggles, used in the desktop sidebar top
 * row next to the title logo.
 */
export function ToggleBar({ className }: { className?: string }) {
  return (
    <div className={twMerge('flex items-center gap-0.5', className)}>
      <LanguageButton />
      <ThemeButton />
    </div>
  );
}

// Slot adapters so the same square buttons can be injected into the mobile
// drawer top row via `DocsLayout`'s `slots.languageSelect` / `slots.themeSwitch`.
export const languageSelectSlot = {
  root: (props: ComponentProps<'button'>) => (
    <LanguageButton className={props.className} />
  ),
  text: () => null,
};

export const themeSwitchSlot = (_props: ComponentProps<'div'>) => (
  // Ignore the `className` fumadocs passes (it injects `p-0` on the mobile
  // drawer top row), so the button keeps its square `p-1.5` hit area like the
  // other icon toggles.
  <ThemeButton />
);
