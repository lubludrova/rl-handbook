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

type RenderMode = 'pending' | 'static' | 'mobile' | 'canvas';

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
  fps: number;
  dprCap: number;
  enablePointer: boolean;
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
  fps: 60,
  dprCap: 2,
  enablePointer: true,
};

const MOBILE_CONFIG: AnimationConfig = {
  nodeCount: 28,
  maxDist: 110,
  pointerRadius: 96,
  pointerForce: 0.006,
  friction: 0.985,
  minSpeed: 0.08,
  jitter: 0.018,
  lineAlpha: 0.3,
  lineWidth: 0.75,
  nodeAlpha: 0.46,
  pulseScale: 0.45,
  traceAlpha: 0.08,
  fps: 30,
  dprCap: 1.5,
  enablePointer: false,
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

function MobileNodePattern() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 z-0 h-full w-full opacity-45"
      viewBox="0 0 390 560"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <style>
        {`
          .mobile-node-cluster-a {
            animation: mobile-node-drift-a 12s ease-in-out infinite alternate;
            transform-origin: 120px 210px;
            transform-box: fill-box;
          }

          .mobile-node-cluster-b {
            animation: mobile-node-drift-b 14s ease-in-out infinite alternate;
            transform-origin: 270px 350px;
            transform-box: fill-box;
          }

          .mobile-node-pulse {
            animation: mobile-node-pulse 3s ease-in-out infinite alternate;
          }

          @keyframes mobile-node-drift-a {
            from {
              transform: translate(-8px, 4px) rotate(-1deg);
            }

            to {
              transform: translate(10px, -7px) rotate(1.5deg);
            }
          }

          @keyframes mobile-node-drift-b {
            from {
              transform: translate(7px, -6px) rotate(1deg);
            }

            to {
              transform: translate(-10px, 8px) rotate(-1.4deg);
            }
          }

          @keyframes mobile-node-pulse {
            from {
              opacity: 0.52;
            }

            to {
              opacity: 0.8;
            }
          }
        `}
      </style>

      <g className="mobile-node-cluster-a" fill="none" stroke="currentColor" strokeWidth="0.8">
        <path d="M18 112L64 92L112 130L146 66L202 104L226 150L170 172L112 130L74 214L30 188" opacity="0.13" />
        <path d="M64 92L146 66M112 130L132 190L170 172M202 104L226 150L170 172M74 214L138 250L170 172M30 188L74 214L138 250" opacity="0.09" />
        <g fill="currentColor" stroke="none" opacity="0.48">
          <circle cx="18" cy="112" r="3.5" />
          <circle cx="64" cy="92" r="4.2" className="mobile-node-pulse" />
          <circle cx="112" cy="130" r="3.2" />
          <circle cx="132" cy="190" r="3" />
          <circle cx="146" cy="66" r="4.6" />
          <circle cx="202" cy="104" r="3.8" />
          <circle cx="226" cy="150" r="3.1" />
          <circle cx="170" cy="172" r="4.1" className="mobile-node-pulse" />
          <circle cx="74" cy="214" r="3.4" />
          <circle cx="30" cy="188" r="3.1" />
          <circle cx="138" cy="250" r="4.3" />
        </g>
      </g>

      <g className="mobile-node-cluster-b" fill="none" stroke="currentColor" strokeWidth="0.8">
        <path d="M246 250L300 214L354 260L368 318L326 332L262 356L226 304L246 250" opacity="0.12" />
        <path d="M300 214L326 332M354 260L368 318L326 332M246 250L286 286L326 332M226 304L262 356L326 332L354 260" opacity="0.08" />
        <path d="M88 410L146 374L204 420L190 462L162 492L104 468L88 410" opacity="0.11" />
        <path d="M146 374L162 492M204 420L190 462L162 492M88 410L128 438L204 420M104 468L128 438L162 492" opacity="0.075" />
        <g fill="currentColor" stroke="none" opacity="0.46">
          <circle cx="246" cy="250" r="3.3" />
          <circle cx="286" cy="286" r="3" />
          <circle cx="300" cy="214" r="4" />
          <circle cx="354" cy="260" r="3.5" className="mobile-node-pulse" />
          <circle cx="368" cy="318" r="3.2" />
          <circle cx="326" cy="332" r="4.4" />
          <circle cx="262" cy="356" r="3.7" />
          <circle cx="226" cy="304" r="3.2" />
          <circle cx="88" cy="410" r="3.3" />
          <circle cx="128" cy="438" r="3.1" />
          <circle cx="146" cy="374" r="4.5" className="mobile-node-pulse" />
          <circle cx="204" cy="420" r="3.8" />
          <circle cx="190" cy="462" r="3.2" />
          <circle cx="162" cy="492" r="4.1" />
          <circle cx="104" cy="468" r="3.6" />
        </g>
      </g>

      <g fill="currentColor" opacity="0.22">
        <circle cx="354" cy="88" r="2.2" className="mobile-node-pulse" />
        <circle cx="28" cy="316" r="2.5" />
        <circle cx="320" cy="498" r="2.1" />
        <circle cx="54" cy="526" r="2.3" />
        <circle cx="376" cy="438" r="2" />
      </g>
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
  const fgColorRef = useRef('0, 0, 0');
  const lastFrameTimeRef = useRef(0);
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

  const updateFgColor = useCallback(() => {
    fgColorRef.current = getFgColor();
  }, [getFgColor]);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return false;

    const rect = parent.getBoundingClientRect();
    const nextWidth = rect.width;
    const nextHeight = rect.height;
    const config = getAnimationConfig(nextWidth);
    const dpr = Math.min(window.devicePixelRatio || 1, config.dprCap);

    dimensionsRef.current = { w: nextWidth, h: nextHeight };
    canvas.width = Math.round(nextWidth * dpr);
    canvas.height = Math.round(nextHeight * dpr);

    return nextWidth > pad * 2 && nextHeight > pad * 2;
  }, [getAnimationConfig, pad]);

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

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const config = getAnimationConfig(dimensionsRef.current.w);
      if (!config.enablePointer || e.pointerType === 'touch') return;

      const rect = canvas.getBoundingClientRect();
      const newX = e.clientX - rect.left;
      const newY = e.clientY - rect.top;
      const pointer = pointerRef.current;
      const dx = newX - pointer.x;
      const dy = newY - pointer.y;

      pointer.speed = Math.sqrt(dx * dx + dy * dy);
      pointer.x = newX;
      pointer.y = newY;
    },
    [getAnimationConfig],
  );

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
    const now = performance.now();
    const minFrameMs = 1000 / config.fps;

    if (lastFrameTimeRef.current > 0 && now - lastFrameTimeRef.current < minFrameMs) {
      frameRef.current = requestAnimationFrame(drawFrame);
      return;
    }

    lastFrameTimeRef.current = now;

    const maxDistSq = config.maxDist * config.maxDist;
    const elapsed = now * 0.001;
    const hasPointer = pointer.x > -1000 && pointer.y > -1000;
    const focus = hasPointer
      ? pointer
      : {
          x: w * (0.5 + Math.sin(elapsed * 0.34) * 0.32),
          y: h * (0.5 + Math.cos(elapsed * 0.27) * 0.22),
          speed: isMobile ? 3.5 : 0,
        };

    const dpr = Math.min(window.devicePixelRatio || 1, config.dprCap);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const fg = fgColorRef.current;

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
  }, [getAnimationConfig, pad]);

  const updateRenderMode = useCallback(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.innerWidth < MOBILE_BREAKPOINT;

    if (prefersReducedMotion) {
      setRenderMode('static');
      return;
    }

    setRenderMode(isMobile ? 'mobile' : 'canvas');
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

    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    const hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    const startAnimation = () => {
      if (frameRef.current !== null) return;
      lastFrameTimeRef.current = 0;
      drawFrame();
    };

    const stopAnimation = () => {
      cancelFrame();
      lastFrameTimeRef.current = 0;
    };

    updateFgColor();
    initNodes();
    startAnimation();

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
        updateFgColor();
      }, resizeDebounceMs);
    };

    const shouldTrackPointer =
      hasFinePointer && getAnimationConfig(dimensionsRef.current.w).enablePointer;

    if (shouldTrackPointer) {
      parent?.addEventListener('pointermove', onPointerMove, { passive: true });
      parent?.addEventListener('pointerleave', onPointerLeave);
      parent?.addEventListener('pointercancel', onPointerLeave);
    }

    const observer = parent
      ? new IntersectionObserver(
          ([entry]) => {
            if (entry.isIntersecting) {
              startAnimation();
            } else {
              stopAnimation();
            }
          },
          { rootMargin: '160px 0px' },
        )
      : null;

    if (parent) observer?.observe(parent);

    window.addEventListener('resize', handleResize);

    return () => {
      cancelFrame();
      observer?.disconnect();

      if (shouldTrackPointer) {
        parent?.removeEventListener('pointermove', onPointerMove);
        parent?.removeEventListener('pointerleave', onPointerLeave);
        parent?.removeEventListener('pointercancel', onPointerLeave);
      }

      window.removeEventListener('resize', handleResize);

      if (canvasResizeTimeoutRef.current !== null) {
        window.clearTimeout(canvasResizeTimeoutRef.current);
        canvasResizeTimeoutRef.current = null;
      }
    };
  }, [
    cancelFrame,
    drawFrame,
    getAnimationConfig,
    initNodes,
    onPointerLeave,
    onPointerMove,
    renderMode,
    resizeCanvas,
    updateFgColor,
  ]);

  if (renderMode === 'pending') return null;

  if (renderMode === 'static') return <StaticNodePattern />;
  if (renderMode === 'mobile') return <MobileNodePattern />;

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-0 h-full w-full opacity-45"
      aria-hidden="true"
    />
  );
}
