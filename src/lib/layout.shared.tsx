'use client';

import { usePathname } from 'next/navigation';
import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { getLangFromPath, t } from '@/lib/ui';

export const gitConfig = {
  user: 'lubludrova',
  repo: 'rl-handbook',
  branch: 'main',
};

export function useBaseOptions(): BaseLayoutProps {
  const pathname = usePathname();
  // Default language (en) has no prefix in the URL; every other language is
  // prefixed (`/zh`, `/ru`, …).
  const lang = getLangFromPath(pathname);
  const prefix = lang === 'en' ? '' : `/${lang}`;

  return {
    nav: {
      title: 'RL Handbook',
      url: prefix || '/',
    },
    links: [
      {
        text: t(lang, 'nav.map'),
        url: `${prefix}/map`,
        type: 'main',
      },
    ],
    githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
  };
}
