'use client';

import { getArticleFeedbackIssueUrl, githubRepoUrl } from '@/lib/feedback';
import { Star, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { getLangFromPath, t } from '@/lib/ui';

const STORAGE_KEY = 'rl-handbook:engaged-reader-prompt:v1';
const MIN_VISIBLE_MS = 3 * 60 * 1000;
const CHECK_INTERVAL_MS = 1000;
const SHOW_COOLDOWN_MS = 5 * 24 * 60 * 60 * 1000;
const ACTION_COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000;

interface PromptState {
  lastShownAt?: number;
  lastDismissedAt?: number;
  lastActedAt?: number;
}

function readPromptState(): PromptState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) as PromptState : {};
  } catch {
    return {};
  }
}

function writePromptState(nextState: PromptState) {
  try {
    const current = readPromptState();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...nextState }));
  } catch {
    // localStorage can be unavailable in private or restricted browser contexts.
  }
}

function isInCooldown(now: number) {
  const state = readPromptState();
  const lastActedAt = state.lastActedAt ?? 0;
  const lastShownAt = Math.max(state.lastShownAt ?? 0, state.lastDismissedAt ?? 0);

  return (
    now - lastActedAt < ACTION_COOLDOWN_MS ||
    now - lastShownAt < SHOW_COOLDOWN_MS
  );
}

export function EngagedReaderPrompt({ url, title }: { url: string; title: string }) {
  const pathname = usePathname();
  const lang = getLangFromPath(pathname);
  const [isVisible, setIsVisible] = useState(false);
  const activeVisibleMsRef = useRef(0);
  const hasShownRef = useRef(false);

  const issueUrl = useMemo(() => getArticleFeedbackIssueUrl({ url, title }), [title, url]);

  const dismiss = useCallback(() => {
    writePromptState({ lastDismissedAt: Date.now() });
    setIsVisible(false);
  }, []);

  const recordAction = useCallback(() => {
    writePromptState({ lastActedAt: Date.now() });
    setIsVisible(false);
  }, []);

  const maybeShowPrompt = useCallback(() => {
    if (hasShownRef.current || document.visibilityState !== 'visible') return;
    if (activeVisibleMsRef.current < MIN_VISIBLE_MS) return;

    hasShownRef.current = true;
    writePromptState({ lastShownAt: Date.now() });
    setIsVisible(true);
  }, []);

  useEffect(() => {
    if (isInCooldown(Date.now())) return;

    const intervalId = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      activeVisibleMsRef.current += CHECK_INTERVAL_MS;
      maybeShowPrompt();
    }, CHECK_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [maybeShowPrompt]);

  if (!isVisible) return null;

  return (
    <aside
      aria-live="polite"
      aria-label={t(lang, 'reader.aria')}
      className="fixed bottom-4 left-4 right-4 z-50 rounded-sm p-4 shadow-lg sm:left-auto sm:right-5 sm:max-w-sm"
      style={{
        border: '1px solid var(--color-fd-border)',
        background: 'var(--color-fd-background)',
        color: 'var(--color-fd-foreground)',
      }}
    >
      <button
        type="button"
        onClick={dismiss}
        aria-label={t(lang, 'reader.dismiss')}
        className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-sm opacity-65 transition hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2"
        style={{ outlineColor: 'var(--color-fd-foreground)' }}
      >
        <X aria-hidden="true" size={16} strokeWidth={1.8} />
      </button>

      <div className="pr-8">
        <p className="font-heading text-sm font-semibold">
          {t(lang, 'reader.title')}
        </p>
        <p
          className="mt-1 font-body text-sm leading-6"
          style={{ color: 'var(--color-fd-muted-foreground)' }}
        >
          {t(lang, 'reader.body')}
        </p>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <a
          href={issueUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={recordAction}
          className="inline-flex min-h-10 items-center rounded-sm px-3 font-heading text-xs font-semibold uppercase"
          style={{
            letterSpacing: '0.08em',
            background: 'var(--color-fd-primary)',
            color: 'var(--color-fd-primary-foreground)',
          }}
        >
          {t(lang, 'reader.feedback')}
        </a>
        <a
          href={githubRepoUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={recordAction}
          className="inline-flex min-h-10 items-center gap-1.5 rounded-sm px-3 font-heading text-xs font-medium uppercase"
          style={{
            letterSpacing: '0.08em',
            color: 'var(--color-fd-muted-foreground)',
            border: '1px solid var(--color-fd-border)',
          }}
        >
          <Star aria-hidden="true" size={14} strokeWidth={1.8} />
          {t(lang, 'reader.star')}
        </a>
      </div>
    </aside>
  );
}
