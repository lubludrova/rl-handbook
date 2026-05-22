'use client';

import { useEffect, useRef } from 'react';

export function ReadingProgress() {
  const barRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const updateProgress = () => {
      frameRef.current = null;

      const { documentElement } = document;
      const scrollTop = documentElement.scrollTop;
      const scrollHeight = documentElement.scrollHeight;
      const clientHeight = documentElement.clientHeight;
      const maxScroll = scrollHeight - clientHeight;
      const progress = maxScroll > 0 ? scrollTop / maxScroll : 0;

      if (barRef.current) {
        barRef.current.style.transform = `scaleX(${Math.min(1, Math.max(0, progress))})`;
      }
    };

    const onScroll = () => {
      if (frameRef.current !== null) return;
      frameRef.current = requestAnimationFrame(updateProgress);
    };

    updateProgress();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);

      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={barRef}
      aria-hidden="true"
      className="reading-progress pointer-events-none fixed top-0 left-0 z-[9999] h-0.5 w-full origin-left bg-[var(--color-fd-foreground)] will-change-transform"
      style={{ transform: 'scaleX(0)' }}
    />
  );
}
