'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useRef, useState } from 'react';
import { VIEW_H, VIEW_W } from './map/map-data';
import { MapMorphOverlay } from './MapMorphOverlay';
import { getLangFromPath, t } from '@/lib/ui';

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

  // Resolve the active language from the pathname. Default language (en) has
  // no prefix in the URL; every other language is prefixed (`/zh`).
  const lang = getLangFromPath(pathname);
  const mapUrl = lang === 'en' ? '/map' : `/${lang}/map`;

  const handleNavigate = useCallback(() => {
    if (navedRef.current) return;
    navedRef.current = true;
    router.push(mapUrl);
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
      <Link
        href={mapUrl}
        prefetch={true}
        onClick={openMap}
        aria-label={t(lang, 'map.aria')}
        aria-disabled={morphing}
        className="icon-link font-heading text-xs uppercase underline underline-offset-4"
        style={{
          letterSpacing: '0.1em',
          color: 'var(--color-fd-muted-foreground)',
        }}
      >
        {morphing ? t(lang, 'map.entering') : t(lang, 'map.orExplore')}
      </Link>

      {morphing && (
        <MapMorphOverlay restView={restView} isMobile={isMobile} onNavigate={handleNavigate} />
      )}
    </>
  );
}
