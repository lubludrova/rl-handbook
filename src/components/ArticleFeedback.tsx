'use client';

import { getArticleFeedbackIssueUrl } from '@/lib/feedback';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { getLangFromPath, t } from '@/lib/ui';

export function ArticleFeedback({ url, title }: { url: string; title: string }) {
  const [clicked, setClicked] = useState(false);
  const issueUrl = getArticleFeedbackIssueUrl({ url, title });
  const lang = getLangFromPath(usePathname());

  return (
    <a
      href={issueUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => {
        setClicked(true);
        window.setTimeout(() => setClicked(false), 1200);
      }}
      className="copy-btn inline-flex h-9 items-center gap-2 rounded-sm px-3 font-heading text-xs font-medium cursor-pointer"
      style={{
        color: clicked ? 'var(--color-fd-foreground)' : 'var(--color-fd-muted-foreground)',
        border: '1px solid var(--color-fd-border)',
        background: clicked ? 'var(--color-fd-accent)' : 'transparent',
      }}
      aria-label={t(lang, 'article.feedbackAria')}
    >
      {clicked ? t(lang, 'article.feedbackOpening') : t(lang, 'article.feedback')}
    </a>
  );
}
