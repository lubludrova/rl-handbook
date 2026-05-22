'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
}

const MOBILE_BREAKPOINT = 768;

type RenderMode = 'pending' | 'static' | 'canvas';

/** Static SVG dot pattern shown on mobile instead of the animated canvas */
function StaticNodePattern() {
  return (
    <svg
      className="absolute inset-0 z-0 opacity-45"
      width="100%"
      height="100%"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <pattern
          id="node-dots"
          x="0"
          y="0"
          width="40"
          height="40"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="20" cy="20" r="1.5" fill="currentColor" opacity="0.35" />
        </pattern>
        <pattern
          id="node-dots-large"
          x="10"
          y="10"
          width="120"
          height="120"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="60" cy="60" r="2.5" fill="currentColor" opacity="0.2" />
          <line
            x1="0"
            y1="60"
            x2="120"
            y2="60"
            stroke="currentColor"
            strokeWidth="0.5"
            opacity="0.08"
          />
          <line
            x1="60"
            y1="0"
            x2="60"
            y2="120"
            stroke="currentColor"
            strokeWidth="0.5"
            opacity="0.08"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#node-dots)" />
      <rect width="100%" height="100%" fill="url(#node-dots-large)" />
    </svg>
  );
}

export function HeroCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number | null>(null);
  const resizeTimeoutRef = useRef<number | null>(null);
  const dimensionsRef = useRef({ w: 0, h: 0 });
  const nodesRef = useRef<Node[]>([]);
  const mouseRef = useRef({ x: -9999, y: -9999, speed: 0 });
  const [renderMode, setRenderMode] = useState<RenderMode>('pending');

  const pad = 10;
  const mouseRadius = 120;
  const mouseForce = 0.02;
  const maxDist = 160;
  const maxDistSq = maxDist * maxDist;
  const nodeCount = 90;
  const resizeDebounceMs = 120;

  const cancelFrame = useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
  }, []);

  const getFgColor = useCallback((): string => {
    const canvas = canvasRef.current;
    const el = canvas?.parentElement;
    if (!el) return '0, 0, 0';
    const fg = getComputedStyle(el).getPropertyValue('color');
    const match = fg.match(/(\d+),\s*(\d+),\s*(\d+)/);
    if (match) return `${match[1]}, ${match[2]}, ${match[3]}`;
    return '0, 0, 0';
  }, []);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return false;

    const rect = parent.getBoundingClientRect();
    const nextWidth = rect.width;
    const nextHeight = rect.height;

    dimensionsRef.current = { w: nextWidth, h: nextHeight };
    canvas.width = nextWidth;
    canvas.height = nextHeight;

    return nextWidth > pad * 2 && nextHeight > pad * 2;
  }, [pad]);

  const initNodes = useCallback(() => {
    const { w, h } = dimensionsRef.current;
    const nodes: Node[] = [];

    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: pad + Math.random() * (w - pad * 2),
        y: pad + Math.random() * (h - pad * 2),
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 2.5 + 1.5,
      });
    }

    nodesRef.current = nodes;
  }, [nodeCount, pad]);

  const onMouseMove = useCallback((e: MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const newX = e.clientX - rect.left;
    const newY = e.clientY - rect.top;
    const mouse = mouseRef.current;
    const dx = newX - mouse.x;
    const dy = newY - mouse.y;

    mouse.speed = Math.sqrt(dx * dx + dy * dy);
    mouse.x = newX;
    mouse.y = newY;
  }, []);

  const onMouseLeave = useCallback(() => {
    mouseRef.current.x = -9999;
    mouseRef.current.y = -9999;
    mouseRef.current.speed = 0;
  }, []);

  const drawFrame = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');

    if (!canvas || !ctx) {
      frameRef.current = null;
      return;
    }

    const { w, h } = dimensionsRef.current;
    const nodes = nodesRef.current;
    const mouse = mouseRef.current;

    ctx.clearRect(0, 0, w, h);
    const fg = getFgColor();

    mouse.speed *= 0.92;

    for (const n of nodes) {
      const mdx = n.x - mouse.x;
      const mdy = n.y - mouse.y;
      const mDist = Math.sqrt(mdx * mdx + mdy * mdy);

      if (mDist < mouseRadius && mDist > 0) {
        const speedMult = Math.min(mouse.speed / 3, 8);
        const force = (1 - mDist / mouseRadius) * mouseForce * speedMult;
        n.vx += (mdx / mDist) * force;
        n.vy += (mdy / mDist) * force;
      }

      n.vx *= 0.99;
      n.vy *= 0.99;

      const speed = Math.sqrt(n.vx * n.vx + n.vy * n.vy);
      if (speed < 0.15) {
        n.vx += (Math.random() - 0.5) * 0.04;
        n.vy += (Math.random() - 0.5) * 0.04;
      }

      n.x += n.vx;
      n.y += n.vy;

      if (n.x < pad || n.x > w - pad) n.vx *= -1;
      if (n.y < pad || n.y > h - pad) n.vy *= -1;

      n.x = Math.max(pad, Math.min(w - pad, n.x));
      n.y = Math.max(pad, Math.min(h - pad, n.y));
    }

    ctx.strokeStyle = `rgba(${fg}, 0.3)`;
    ctx.lineWidth = 0.8;

    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];

      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const dx = a.x - b.x;
        if (Math.abs(dx) >= maxDist) continue;

        const dy = a.y - b.y;
        if (Math.abs(dy) >= maxDist) continue;

        const distSq = dx * dx + dy * dy;
        if (distSq >= maxDistSq) continue;

        const dist = Math.sqrt(distSq);
        ctx.globalAlpha = 1 - dist / maxDist;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }

    ctx.globalAlpha = 1;
    ctx.fillStyle = `rgba(${fg}, 0.45)`;

    for (const n of nodes) {
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fill();
    }

    frameRef.current = requestAnimationFrame(drawFrame);
  }, [getFgColor, maxDist, maxDistSq, mouseForce, mouseRadius, pad]);

  const updateRenderMode = useCallback(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.innerWidth < MOBILE_BREAKPOINT;
    setRenderMode(prefersReducedMotion || isMobile ? 'static' : 'canvas');
  }, []);

  useEffect(() => {
    updateRenderMode();

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleViewportChange = () => {
      if (resizeTimeoutRef.current !== null) {
        window.clearTimeout(resizeTimeoutRef.current);
      }

      resizeTimeoutRef.current = window.setTimeout(() => {
        resizeTimeoutRef.current = null;
        updateRenderMode();
      }, resizeDebounceMs);
    };

    const handleMotionChange = () => {
      updateRenderMode();
    };

    window.addEventListener('resize', handleViewportChange);
    mediaQuery.addEventListener('change', handleMotionChange);

    return () => {
      window.removeEventListener('resize', handleViewportChange);
      mediaQuery.removeEventListener('change', handleMotionChange);

      if (resizeTimeoutRef.current !== null) {
        window.clearTimeout(resizeTimeoutRef.current);
        resizeTimeoutRef.current = null;
      }
    };
  }, [updateRenderMode]);

  useEffect(() => {
    if (renderMode !== 'canvas') {
      cancelFrame();
      return;
    }

    if (!resizeCanvas()) {
      return;
    }

    initNodes();
    drawFrame();

    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;

    const handleResize = () => {
      if (resizeTimeoutRef.current !== null) {
        window.clearTimeout(resizeTimeoutRef.current);
      }

      resizeTimeoutRef.current = window.setTimeout(() => {
        resizeTimeoutRef.current = null;

        if (!resizeCanvas()) {
          cancelFrame();
          return;
        }

        initNodes();
      }, resizeDebounceMs);
    };

    parent?.addEventListener('mousemove', onMouseMove);
    parent?.addEventListener('mouseleave', onMouseLeave);
    window.addEventListener('resize', handleResize);

    return () => {
      cancelFrame();
      parent?.removeEventListener('mousemove', onMouseMove);
      parent?.removeEventListener('mouseleave', onMouseLeave);
      window.removeEventListener('resize', handleResize);

      if (resizeTimeoutRef.current !== null) {
        window.clearTimeout(resizeTimeoutRef.current);
        resizeTimeoutRef.current = null;
      }
    };
  }, [cancelFrame, drawFrame, initNodes, onMouseLeave, onMouseMove, renderMode, resizeCanvas]);

  if (renderMode === 'pending') return null;

  if (renderMode === 'static') return <StaticNodePattern />;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-0 opacity-45 will-change-transform"
    />
  );
}
