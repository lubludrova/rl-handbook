'use client';

import { usePathname } from 'next/navigation';
import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

export const gitConfig = {
  user: 'lubludrova',
  repo: 'rl-handbook',
  branch: 'main',
};

export function useBaseOptions(): BaseLayoutProps {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);
  // Default language (en) has no prefix in the URL; only `zh` is prefixed.
  const lang = segments[0] === 'zh' ? 'zh' : 'en';
  const prefix = lang === 'en' ? '' : `/${lang}`;

  return {
    nav: {
      title: 'RL Handbook',
    },
    links: [
      {
        text: 'Map',
        url: `${prefix}/map`,
        type: 'main',
      },
    ],
    githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
  };
}
