'use client';

import { useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  VIEW_H,
  VIEW_W,
  edges,
  nodes,
  regions,
  type NodeStatus,
} from './map/map-data';

interface RestView {
  x: number;
  y: number;
  k: number;
}

/** Mirror of AlgorithmMap's sizing so the settled overlay matches the real map. */
const statusRadius: Record<NodeStatus, number> = {
  workhorse: 11,
  active: 8,
  foundation: 8,
  research: 7,
  classic: 6,
};

const statusFontSize: Record<NodeStatus, number> = {
  workhorse: 14.5,
  foundation: 13.5,
  active: 13,
  research: 12.5,
  classic: 12,
};

const nodeById = new Map(nodes.map((n) => [n.id, n]));

const STAGGER = 10;
const NODE_DUR = 430;
const NAV_AT = 720;
const MORPH_DUR = 800;

/** Deterministic [0,1) hash — a stable, pure stand-in for Math.random. */
function scatter(seed: number) {
  let x = Math.imul(seed ^ 0x9e3779b9, 0x85ebca6b);
  x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35);
  x ^= x >>> 16;
  return (x >>> 0) / 4294967296;
}

/** Mild overshoot so each node settles into place rather than stopping dead. */
function easeOutBack(x: number) {
  const c1 = 1.0;
  const c3 = c1 + 1;
  const m = x - 1;
  return 1 + c3 * m * m * m + c1 * m * m;
}

/** Gravity center the constellation condenses toward. */
const CENTER = {
  x: nodes.reduce((s, n) => s + n.x, 0) / nodes.length,
  y: nodes.reduce((s, n) => s + n.y, 0) / nodes.length,
};

/**
 * Each node begins as a dispersed, exploded version of the final layout — pushed
 * outward from the center along a jittered radial — and condenses inward along a
 * gently curved path, so the galaxy looks like it gravitationally assembles.
 */
const NODE_ANIM = nodes.map((n, i) => {
  const baseAng = Math.atan2(n.y - CENTER.y, n.x - CENTER.x);
  const ang = baseAng + (scatter(i * 7 + 3) - 0.5) * 0.9;
  const dist = 230 + scatter(i * 7 + 4) * 240;
  const sx = n.x + Math.cos(ang) * dist;
  const sy = n.y + Math.sin(ang) * dist;
  const mvx = n.x - sx;
  const mvy = n.y - sy;
  const len = Math.hypot(mvx, mvy) || 1;
  return {
    sx,
    sy,
    perpx: -mvy / len,
    perpy: mvx / len,
    arc: (scatter(i * 7 + 5) - 0.5) * dist * 0.4,
    delay: Math.max(0, i * STAGGER + Math.round((scatter(i * 7 + 6) - 0.5) * 56)),
  };
});

const EDGE_LEN = edges.map((e) => {
  const a = nodeById.get(e.from)!;
  const b = nodeById.get(e.to)!;
  return Math.hypot(b.x - a.x, b.y - a.y);
});

export function MapMorphOverlay({
  restView,
  isMobile,
  onNavigate,
}: {
  restView: RestView;
  isMobile: boolean;
  onNavigate: () => void;
}) {
  const nodeRefs = useRef<(SVGGElement | null)[]>([]);
  const trailRefs = useRef<(SVGLineElement | null)[]>([]);
  const labelRefs = useRef<(SVGTextElement | null)[]>([]);
  const edgeRefs = useRef<(SVGLineElement | null)[]>([]);
  const fillerRefs = useRef<(SVGCircleElement | null)[]>([]);
  const regionRefs = useRef<(SVGTextElement | null)[]>([]);
  const rafRef = useRef<number | null>(null);
  const navedRef = useRef(false);

  // Filler dots (the dispersing hero cloud); deterministic so the morph is stable.
  const fillers = useMemo(() => {
    const count = isMobile ? 20 : 42;
    return Array.from({ length: count }, (_, i) => {
      const x = scatter(i * 4 + 1000) * VIEW_W;
      const y = scatter(i * 4 + 2000) * VIEW_H;
      const dx = x - CENTER.x;
      const dy = y - CENTER.y;
      const len = Math.hypot(dx, dy) || 1;
      return { x, y, r: 1.6 + scatter(i * 4 + 3000) * 3.4, dirx: dx / len, diry: dy / len };
    });
  }, [isMobile]);

  useEffect(() => {
    // The fumadocs navbar is hoisted above our overlay's stacking context, so
    // hide it for the duration of the morph; it returns with the real map.
    const root = document.documentElement;
    root.classList.add('map-morphing');

    const start = performance.now();
    const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
    const finishOf = (i: number) => NODE_ANIM[i].delay + NODE_DUR;

    const edgeStart = edges.map((e) => {
      const fi = nodes.findIndex((n) => n.id === e.from);
      const ti = nodes.findIndex((n) => n.id === e.to);
      return Math.max(finishOf(fi), finishOf(ti)) - 220;
    });

    // Previous-frame positions, for speed-driven comet trails.
    const prev = NODE_ANIM.map((a) => ({ x: a.sx, y: a.sy }));

    const tick = (now: number) => {
      const t = now - start;

      nodes.forEach((n, i) => {
        const g = nodeRefs.current[i];
        if (!g) return;
        const a = NODE_ANIM[i];
        const local = clamp((t - a.delay) / NODE_DUR, 0, 1);
        const p = easeOutBack(local);
        const bow = Math.sin(local * Math.PI) * a.arc;
        const x = a.sx + (n.x - a.sx) * p + a.perpx * bow;
        const y = a.sy + (n.y - a.sy) * p + a.perpy * bow;
        g.setAttribute('transform', `translate(${x.toFixed(2)},${y.toFixed(2)})`);
        g.style.opacity = String(clamp((t - a.delay) / 140, 0, 1));

        const trail = trailRefs.current[i];
        if (trail) {
          const vx = x - prev[i].x;
          const vy = y - prev[i].y;
          const speed = Math.hypot(vx, vy);
          if (speed > 0.45 && local < 1) {
            const scale = Math.min(speed * 2.3, 44) / speed;
            trail.setAttribute('x2', (-vx * scale).toFixed(2));
            trail.setAttribute('y2', (-vy * scale).toFixed(2));
            trail.style.opacity = String(clamp(speed / 16, 0, 1) * 0.4);
          } else {
            trail.style.opacity = '0';
          }
        }
        prev[i].x = x;
        prev[i].y = y;

        const label = labelRefs.current[i];
        if (label) {
          label.style.opacity = String(clamp((t - (a.delay + NODE_DUR * 0.5)) / 220, 0, 1) * 0.72);
        }
      });

      // Edges draw in along their length once their endpoints have arrived.
      edges.forEach((_, i) => {
        const el = edgeRefs.current[i];
        if (!el) return;
        const dp = clamp((t - edgeStart[i]) / 220, 0, 1);
        el.style.strokeDashoffset = String(EDGE_LEN[i] * (1 - dp));
        el.style.opacity = String(dp * 0.17);
      });

      // Filler cloud drifts outward and fades as the structure crystallizes.
      fillers.forEach((f, i) => {
        const el = fillerRefs.current[i];
        if (!el) return;
        const prog = clamp(t / 440, 0, 1);
        const drift = prog * 44;
        el.setAttribute('transform', `translate(${(f.dirx * drift).toFixed(2)},${(f.diry * drift).toFixed(2)})`);
        el.style.opacity = String((1 - prog) * 0.4);
      });

      regions.forEach((_, i) => {
        const el = regionRefs.current[i];
        if (!el) return;
        el.style.opacity = String(clamp((t - 460) / 240, 0, 1) * 0.08);
      });

      if (!navedRef.current && t >= NAV_AT) {
        navedRef.current = true;
        onNavigate();
      }
      if (t < MORPH_DUR) rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      root.classList.remove('map-morphing');
    };
  }, [onNavigate, fillers]);

  return createPortal(
    <div className="map-morph-overlay" aria-hidden="true">
      <div className="map-morph-stage">
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          className="h-full w-full"
          style={{ color: 'var(--color-fd-foreground)' }}
        >
          <g transform={`translate(${restView.x},${restView.y}) scale(${restView.k})`}>
            {fillers.map((f, i) => (
              <circle
                key={`f${i}`}
                ref={(el) => {
                  fillerRefs.current[i] = el;
                }}
                cx={f.x}
                cy={f.y}
                r={f.r}
                fill="currentColor"
                style={{ opacity: 0.4 }}
              />
            ))}

            {edges.map((e, i) => {
              const a = nodeById.get(e.from)!;
              const b = nodeById.get(e.to)!;
              return (
                <line
                  key={`${e.from}-${e.to}`}
                  ref={(el) => {
                    edgeRefs.current[i] = el;
                  }}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke="currentColor"
                  strokeWidth={1}
                  strokeDasharray={EDGE_LEN[i]}
                  style={{ strokeDashoffset: EDGE_LEN[i], opacity: 0 }}
                />
              );
            })}

            {nodes.map((n, i) => {
              const r = statusRadius[n.status];
              return (
                <g
                  key={n.id}
                  ref={(el) => {
                    nodeRefs.current[i] = el;
                  }}
                  style={{ opacity: 0 }}
                >
                  <line
                    ref={(el) => {
                      trailRefs.current[i] = el;
                    }}
                    x1={0}
                    y1={0}
                    x2={0}
                    y2={0}
                    stroke="currentColor"
                    strokeWidth={Math.max(1.3, r * 0.5)}
                    strokeLinecap="round"
                    style={{ opacity: 0 }}
                  />
                  {n.comingSoon && (
                    <circle
                      r={r + 5}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={0.8}
                      strokeDasharray="2 3.5"
                      opacity={0.55}
                    />
                  )}
                  <circle
                    r={r}
                    fill={n.kind === 'concept' ? 'var(--color-fd-background)' : 'currentColor'}
                    stroke="currentColor"
                    strokeWidth={n.kind === 'concept' ? 1.8 : 0}
                  />
                  <text
                    ref={(el) => {
                      labelRefs.current[i] = el;
                    }}
                    x={n.labelDx ?? 0}
                    y={n.labelDy ?? r + 17}
                    textAnchor="middle"
                    className="font-heading select-none"
                    style={{
                      fontSize: statusFontSize[n.status],
                      fontWeight: n.status === 'workhorse' ? 700 : 500,
                      fill: 'currentColor',
                      opacity: 0,
                    }}
                  >
                    {n.label}
                  </text>
                </g>
              );
            })}

            {regions.map((r, i) => (
              <text
                key={r.label}
                ref={(el) => {
                  regionRefs.current[i] = el;
                }}
                x={r.x}
                y={r.y}
                textAnchor="middle"
                className="font-heading select-none"
                transform={r.rotate ? `rotate(${r.rotate} ${r.x} ${r.y})` : undefined}
                style={{
                  fontSize: r.size ?? 26,
                  letterSpacing: '0.35em',
                  fill: 'currentColor',
                  fontWeight: 600,
                  opacity: 0,
                }}
              >
                {r.label}
              </text>
            ))}
          </g>
        </svg>
      </div>
    </div>,
    document.body,
  );
}
