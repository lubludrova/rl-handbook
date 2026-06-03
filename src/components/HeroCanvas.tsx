'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  phase: number;
}

const MOBILE_BREAKPOINT = 768;

type RenderMode = 'pending' | 'static' | 'canvas';

interface AnimationConfig {
  nodeCount: number;
  maxDist: number;
  pointerRadius: number;
  pointerForce: number;
  friction: number;
  minSpeed: number;
  jitter: number;
  lineAlpha: number;
  lineWidth: number;
  nodeAlpha: number;
  pulseScale: number;
  traceAlpha: number;
}

const DESKTOP_CONFIG: AnimationConfig = {
  nodeCount: 90,
  maxDist: 160,
  pointerRadius: 120,
  pointerForce: 0.02,
  friction: 0.99,
  minSpeed: 0.15,
  jitter: 0.04,
  lineAlpha: 0.3,
  lineWidth: 0.8,
  nodeAlpha: 0.45,
  pulseScale: 0,
  traceAlpha: 0,
};

const MOBILE_CONFIG: AnimationConfig = {
  nodeCount: 42,
  maxDist: 118,
  pointerRadius: 96,
  pointerForce: 0.006,
  friction: 0.985,
  minSpeed: 0.08,
  jitter: 0.018,
  lineAlpha: 0.36,
  lineWidth: 0.75,
  nodeAlpha: 0.5,
  pulseScale: 0.8,
  traceAlpha: 0.18,
};

/** Static SVG dot pattern shown for reduced-motion users */
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
  const modeResizeTimeoutRef = useRef<number | null>(null);
  const canvasResizeTimeoutRef = useRef<number | null>(null);
  const dimensionsRef = useRef({ w: 0, h: 0 });
  const nodesRef = useRef<Node[]>([]);
  const pointerRef = useRef({ x: -9999, y: -9999, speed: 0 });
  const [renderMode, setRenderMode] = useState<RenderMode>('pending');

  const pad = 10;
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

  const getAnimationConfig = useCallback((width: number): AnimationConfig => {
    return width < MOBILE_BREAKPOINT ? MOBILE_CONFIG : DESKTOP_CONFIG;
  }, []);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return false;

    const rect = parent.getBoundingClientRect();
    const nextWidth = rect.width;
    const nextHeight = rect.height;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    dimensionsRef.current = { w: nextWidth, h: nextHeight };
    canvas.width = Math.round(nextWidth * dpr);
    canvas.height = Math.round(nextHeight * dpr);

    return nextWidth > pad * 2 && nextHeight > pad * 2;
  }, [pad]);

  const initNodes = useCallback(() => {
    const { w, h } = dimensionsRef.current;
    const config = getAnimationConfig(w);
    const nodes: Node[] = [];

    for (let i = 0; i < config.nodeCount; i++) {
      nodes.push({
        x: pad + Math.random() * (w - pad * 2),
        y: pad + Math.random() * (h - pad * 2),
        vx: (Math.random() - 0.5) * (w < MOBILE_BREAKPOINT ? 0.16 : 0.3),
        vy: (Math.random() - 0.5) * (w < MOBILE_BREAKPOINT ? 0.16 : 0.3),
        r: Math.random() * 2.5 + 1.5,
        phase: Math.random() * Math.PI * 2,
      });
    }

    nodesRef.current = nodes;
  }, [getAnimationConfig, pad]);

  const onPointerMove = useCallback((e: PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const newX = e.clientX - rect.left;
    const newY = e.clientY - rect.top;
    const pointer = pointerRef.current;
    const dx = newX - pointer.x;
    const dy = newY - pointer.y;

    pointer.speed = Math.sqrt(dx * dx + dy * dy);
    pointer.x = newX;
    pointer.y = newY;
  }, []);

  const onPointerLeave = useCallback(() => {
    pointerRef.current.x = -9999;
    pointerRef.current.y = -9999;
    pointerRef.current.speed = 0;
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
    const pointer = pointerRef.current;
    const isMobile = w < MOBILE_BREAKPOINT;
    const config = getAnimationConfig(w);
    const maxDistSq = config.maxDist * config.maxDist;
    const elapsed = performance.now() * 0.001;
    const hasPointer = pointer.x > -1000 && pointer.y > -1000;
    const focus = hasPointer
      ? pointer
      : {
          x: w * (0.5 + Math.sin(elapsed * 0.34) * 0.32),
          y: h * (0.5 + Math.cos(elapsed * 0.27) * 0.22),
          speed: isMobile ? 3.5 : 0,
        };

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const fg = getFgColor();

    pointer.speed *= 0.92;

    for (const n of nodes) {
      const mdx = n.x - focus.x;
      const mdy = n.y - focus.y;
      const mDist = Math.sqrt(mdx * mdx + mdy * mdy);

      if (mDist < config.pointerRadius && mDist > 0) {
        const speedMult = hasPointer ? Math.min(pointer.speed / 3, 8) : 1;
        const force = (1 - mDist / config.pointerRadius) * config.pointerForce * speedMult;
        n.vx += (mdx / mDist) * force;
        n.vy += (mdy / mDist) * force;

        if (isMobile && !hasPointer) {
          n.vx += (-mdy / mDist) * force * 0.7;
          n.vy += (mdx / mDist) * force * 0.7;
        }
      }

      n.vx *= config.friction;
      n.vy *= config.friction;

      const speed = Math.sqrt(n.vx * n.vx + n.vy * n.vy);
      if (speed < config.minSpeed) {
        n.vx += (Math.random() - 0.5) * config.jitter;
        n.vy += (Math.random() - 0.5) * config.jitter;
      }

      n.x += n.vx;
      n.y += n.vy;

      if (n.x < pad || n.x > w - pad) n.vx *= -1;
      if (n.y < pad || n.y > h - pad) n.vy *= -1;

      n.x = Math.max(pad, Math.min(w - pad, n.x));
      n.y = Math.max(pad, Math.min(h - pad, n.y));
    }

    ctx.strokeStyle = `rgba(${fg}, 1)`;
    ctx.lineWidth = config.lineWidth;

    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];

      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const dx = a.x - b.x;
        if (Math.abs(dx) >= config.maxDist) continue;

        const dy = a.y - b.y;
        if (Math.abs(dy) >= config.maxDist) continue;

        const distSq = dx * dx + dy * dy;
        if (distSq >= maxDistSq) continue;

        const dist = Math.sqrt(distSq);
        ctx.globalAlpha = (1 - dist / config.maxDist) * config.lineAlpha;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }

    if (isMobile && config.traceAlpha > 0) {
      let traces = 0;

      for (const n of nodes) {
        const dx = n.x - focus.x;
        const dy = n.y - focus.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const traceDist = config.maxDist * 0.9;

        if (dist >= traceDist) continue;

        ctx.globalAlpha = (1 - dist / traceDist) * config.traceAlpha;
        ctx.beginPath();
        ctx.moveTo(focus.x, focus.y);
        ctx.lineTo(n.x, n.y);
        ctx.stroke();

        traces += 1;
        if (traces >= 6) break;
      }
    }

    ctx.globalAlpha = 1;
    ctx.fillStyle = `rgba(${fg}, ${config.nodeAlpha})`;

    for (const n of nodes) {
      const pulse = config.pulseScale
        ? Math.sin(elapsed * 1.5 + n.phase) * config.pulseScale
        : 0;

      ctx.beginPath();
      ctx.arc(n.x, n.y, Math.max(0.8, n.r + pulse), 0, Math.PI * 2);
      ctx.fill();
    }

    frameRef.current = requestAnimationFrame(drawFrame);
  }, [getAnimationConfig, getFgColor, pad]);

  const updateRenderMode = useCallback(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setRenderMode(prefersReducedMotion ? 'static' : 'canvas');
  }, []);

  useEffect(() => {
    updateRenderMode();

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleViewportChange = () => {
      if (modeResizeTimeoutRef.current !== null) {
        window.clearTimeout(modeResizeTimeoutRef.current);
      }

      modeResizeTimeoutRef.current = window.setTimeout(() => {
        modeResizeTimeoutRef.current = null;
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

      if (modeResizeTimeoutRef.current !== null) {
        window.clearTimeout(modeResizeTimeoutRef.current);
        modeResizeTimeoutRef.current = null;
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
      if (canvasResizeTimeoutRef.current !== null) {
        window.clearTimeout(canvasResizeTimeoutRef.current);
      }

      canvasResizeTimeoutRef.current = window.setTimeout(() => {
        canvasResizeTimeoutRef.current = null;

        if (!resizeCanvas()) {
          cancelFrame();
          return;
        }

        initNodes();
      }, resizeDebounceMs);
    };

    parent?.addEventListener('pointermove', onPointerMove);
    parent?.addEventListener('pointerleave', onPointerLeave);
    parent?.addEventListener('pointercancel', onPointerLeave);
    window.addEventListener('resize', handleResize);

    return () => {
      cancelFrame();
      parent?.removeEventListener('pointermove', onPointerMove);
      parent?.removeEventListener('pointerleave', onPointerLeave);
      parent?.removeEventListener('pointercancel', onPointerLeave);
      window.removeEventListener('resize', handleResize);

      if (canvasResizeTimeoutRef.current !== null) {
        window.clearTimeout(canvasResizeTimeoutRef.current);
        canvasResizeTimeoutRef.current = null;
      }
    };
  }, [cancelFrame, drawFrame, initNodes, onPointerLeave, onPointerMove, renderMode, resizeCanvas]);

  if (renderMode === 'pending') return null;

  if (renderMode === 'static') return <StaticNodePattern />;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-0 h-full w-full opacity-45 will-change-transform"
    />
  );
}
