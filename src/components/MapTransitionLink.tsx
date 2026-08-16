'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { VIEW_H, VIEW_W } from './map/map-data';
import { MapMorphOverlay } from './MapMorphOverlay';

interface RestView {
  x: number;
  y: number;
  k: number;
}

export function MapTransitionLink() {
  const router = useRouter();
  const pathname = usePathname();
  const [morphing, setMorphing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [restView, setRestView] = useState<RestView>({ x: 0, y: 0, k: 1 });
  const navedRef = useRef(false);

  // Extract current language from pathname. Default language (en) has no
  // prefix in the URL; only `zh` is prefixed.
  const segments = pathname.split('/').filter(Boolean);
  const lang = segments[0] === 'zh' ? 'zh' : 'en';
  const mapUrl = lang === 'en' ? '/map' : '/zh/map';

  useEffect(() => {
    router.prefetch(mapUrl);
  }, [router, mapUrl]);

  const handleNavigate = useCallback(() => {
    if (navedRef.current) return;
    navedRef.current = true;
    router.push(`${mapUrl}?warp=1`);
  }, [router, mapUrl]);

  function openMap(event: React.MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    if (morphing) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      router.push(mapUrl);
      return;
    }

    // Match the map's resting framing so the morph lands exactly on it.
    const mobile = window.innerWidth < 768;
    setIsMobile(mobile);
    setRestView(
      mobile
        ? { x: VIEW_W / 2 - 800 * 1.9, y: VIEW_H / 2 - 480 * 1.9, k: 1.9 }
        : { x: 0, y: 0, k: 1 },
    );
    setMorphing(true);
  }

  return (
    <>
      <a
        href={mapUrl}
        onClick={openMap}
        aria-label="Explore the Map of RL"
        aria-disabled={morphing}
        className="icon-link font-heading text-xs uppercase underline underline-offset-4"
        style={{
          letterSpacing: '0.1em',
          color: 'var(--color-fd-muted-foreground)',
        }}
      >
        {morphing ? 'entering the map…' : 'or explore the Map of RL →'}
      </a>

      {morphing && (
        <MapMorphOverlay restView={restView} isMobile={isMobile} onNavigate={handleNavigate} />
      )}
    </>
  );
}
