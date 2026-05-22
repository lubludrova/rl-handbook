'use client';

import { gitConfig } from '@/lib/layout.shared';
import { useState } from 'react';

export function ArticleFeedback({ url, title }: { url: string; title: string }) {
  const [clicked, setClicked] = useState(false);

  const issueBody = [
    `Page: ${url}`,
    `Chapter: ${title}`,
    '',
    'What should be improved?',
    '',
    '',
    'Suggested correction:',
    '',
  ].join('\n');

  const params = new URLSearchParams({
    title: `Feedback: ${title}`,
    body: issueBody,
    labels: 'feedback',
  });

  const issueUrl = `https://github.com/${gitConfig.user}/${gitConfig.repo}/issues/new?${params.toString()}`;

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
      aria-label="Send feedback about this page"
    >
      {clicked ? 'Opening...' : 'Feedback'}
    </a>
  );
}
