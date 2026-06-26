'use client';

import { getArticleFeedbackIssueUrl, githubRepoUrl } from '@/lib/feedback';
import { Star, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const STORAGE_KEY = 'rl-handbook:engaged-reader-prompt:v1';
const MIN_VISIBLE_MS = 5 * 60 * 1000;
const MAX_EXTRA_DELAY_MS = 2 * 60 * 1000;
const CHECK_INTERVAL_MS = 1000;
const MIN_SCROLL_PROGRESS = 0.2;
const SHOW_COOLDOWN_MS = 2 * 24 * 60 * 60 * 1000;
const ACTION_COOLDOWN_MS = 120 * 24 * 60 * 60 * 1000;
const AUTO_DISMISS_MS = 2 * 60 * 1000;

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

function getScrollProgress() {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  if (maxScroll <= 0) return 1;
  return window.scrollY / maxScroll;
}

function isInCooldown(now: number) {
  const state = readPromptState();
  const lastActedAt = state.lastActedAt ?? 0;
  const lastShownAt = state.lastShownAt ?? state.lastDismissedAt ?? 0;

  return (
    now - lastActedAt < ACTION_COOLDOWN_MS ||
    now - lastShownAt < SHOW_COOLDOWN_MS
  );
}

export function EngagedReaderPrompt({ url, title }: { url: string; title: string }) {
  const [isVisible, setIsVisible] = useState(false);
  const activeVisibleMsRef = useRef(0);
  const hasShownRef = useRef(false);
  const requiredDelayMsRef = useRef(MIN_VISIBLE_MS);

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
    if (activeVisibleMsRef.current < requiredDelayMsRef.current) return;
    if (getScrollProgress() < MIN_SCROLL_PROGRESS) return;

    hasShownRef.current = true;
    writePromptState({ lastShownAt: Date.now() });
    setIsVisible(true);
  }, []);

  useEffect(() => {
    if (isInCooldown(Date.now())) return;

    requiredDelayMsRef.current = MIN_VISIBLE_MS + Math.floor(Math.random() * MAX_EXTRA_DELAY_MS);

    let animationFrameId: number | null = null;
    const intervalId = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      activeVisibleMsRef.current += CHECK_INTERVAL_MS;
      maybeShowPrompt();
    }, CHECK_INTERVAL_MS);

    const handleScroll = () => {
      if (animationFrameId !== null) return;

      animationFrameId = window.requestAnimationFrame(() => {
        animationFrameId = null;
        maybeShowPrompt();
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('scroll', handleScroll);

      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId);
      }
    };
  }, [maybeShowPrompt]);

  useEffect(() => {
    if (!isVisible) return;

    const timeoutId = window.setTimeout(() => {
      writePromptState({ lastDismissedAt: Date.now() });
      setIsVisible(false);
    }, AUTO_DISMISS_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <aside
      aria-live="polite"
      aria-label="Feedback request"
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
        aria-label="Dismiss feedback request"
        className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-sm opacity-65 transition hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2"
        style={{ outlineColor: 'var(--color-fd-foreground)' }}
      >
        <X aria-hidden="true" size={16} strokeWidth={1.8} />
      </button>

      <div className="pr-8">
        <p className="font-heading text-sm font-semibold">
          Found this chapter useful?
        </p>
        <p
          className="mt-1 font-body text-sm leading-6"
          style={{ color: 'var(--color-fd-muted-foreground)' }}
        >
          A quick note or GitHub star helps improve this handbook.
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
          Send feedback
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
          Star
        </a>
      </div>
    </aside>
  );
}
