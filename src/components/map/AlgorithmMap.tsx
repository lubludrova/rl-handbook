'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  VIEW_H,
  VIEW_W,
  continuations,
  edges,
  familyMeta,
  nodes,
  regions,

  type FamilyId,
  type MapNode,
  type NodeStatus,
} from './map-data';

interface ViewState {
  x: number;
  y: number;
  k: number;
}

const MIN_ZOOM = 0.45;
const MAX_ZOOM = 5;

/** Run the warp-arrival framing before paint on the client, plain effect on the server. */
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

const nodeById = new Map(nodes.map((n) => [n.id, n]));

const parentsOf = new Map<string, string[]>();
const childrenOf = new Map<string, string[]>();
for (const e of edges) {
  parentsOf.set(e.to, [...(parentsOf.get(e.to) ?? []), e.from]);
  childrenOf.set(e.from, [...(childrenOf.get(e.from) ?? []), e.to]);
}

function collectLineage(id: string): Set<string> {
  const related = new Set<string>([id]);
  const walk = (start: string, adj: Map<string, string[]>) => {
    const stack = [start];
    while (stack.length > 0) {
      const cur = stack.pop()!;
      for (const next of adj.get(cur) ?? []) {
        if (!related.has(next)) {
          related.add(next);
          stack.push(next);
        }
      }
    }
  };
  walk(id, parentsOf);
  walk(id, childrenOf);
  return related;
}

function clientToView(svg: SVGSVGElement, clientX: number, clientY: number) {
  const ctm = svg.getScreenCTM();
  if (!ctm) return { x: 0, y: 0 };
  const p = new DOMPoint(clientX, clientY).matrixTransform(ctm.inverse());
  return { x: p.x, y: p.y };
}

function clampZoom(k: number) {
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, k));
}

/** Node size encodes how much the method is used today. */
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

function nodeRadius(n: MapNode) {
  return statusRadius[n.status];
}

type FinderAxis =
  | 'paradigm'
  | 'family'
  | 'policyLocality'
  | 'actionSpace'
  | 'policyType';

type SelectedFacets = Record<FinderAxis, string[]>;

interface FinderOption {
  id: string;
  label: string;
}

interface FinderGroup {
  axis: FinderAxis;
  label: string;
  options: FinderOption[];
  subtle?: boolean;
}

const emptyFacets: SelectedFacets = {
  paradigm: [],
  family: [],
  policyLocality: [],
  actionSpace: [],
  policyType: [],
};

const finderGroups: FinderGroup[] = [
  {
    axis: 'paradigm',
    label: 'Paradigm',
    options: [
      { id: 'model-free', label: 'model-free' },
      { id: 'model-based', label: 'model-based' },
    ],
  },
  {
    axis: 'family',
    label: 'Family',
    options: [
      { id: 'value-based', label: 'value-based' },
      { id: 'policy-based', label: 'policy-based' },
      { id: 'actor-critic', label: 'actor-critic' },
    ],
  },
  {
    axis: 'policyLocality',
    label: 'Policy locality',
    options: [
      { id: 'on-policy', label: 'on-policy' },
      { id: 'off-policy', label: 'off-policy' },
    ],
  },
  {
    axis: 'actionSpace',
    label: 'Action space',
    options: [
      { id: 'discrete-actions', label: 'discrete actions' },
      { id: 'continuous-actions', label: 'continuous actions' },
    ],
  },
  {
    axis: 'policyType',
    label: 'Policy type',
    options: [
      { id: 'stochastic-policy', label: 'stochastic policy' },
      { id: 'deterministic-policy', label: 'deterministic policy' },
    ],
  },

];

const queryParamByAxis: Record<FinderAxis, string> = {
  paradigm: 'paradigm',
  family: 'family',
  policyLocality: 'locality',
  actionSpace: 'action',
  policyType: 'policy',
};

function countSelectedFacets(selected: SelectedFacets) {
  return Object.values(selected).reduce((sum, values) => sum + values.length, 0);
}

function cloneFacets(selected: SelectedFacets): SelectedFacets {
  return {
    paradigm: [...selected.paradigm],
    family: [...selected.family],
    policyLocality: [...selected.policyLocality],
    actionSpace: [...selected.actionSpace],
    policyType: [...selected.policyType],
  };
}

function nodeMatchScore(node: MapNode, selected: SelectedFacets) {
  const tags = node.tags ?? [];
  let score = 0;

  for (const group of finderGroups) {
    const chosen = selected[group.axis];
    if (chosen.length === 0) continue;
    const hits = chosen.filter((tag) => tags.includes(tag));
    if (hits.length === 0) return { pass: false, score: 0 };
    score += hits.length;
  }

  return { pass: true, score };
}

function optionLabel(id: string) {
  for (const group of finderGroups) {
    const option = group.options.find((item) => item.id === id);
    if (option) return option.label;
  }
  return id;
}

function initialFacetsFromUrl(): SelectedFacets {
  if (typeof window === 'undefined') return emptyFacets;
  const params = new URLSearchParams(window.location.search);
  const initial = cloneFacets(emptyFacets);
  for (const group of finderGroups) {
    const value = params.get(queryParamByAxis[group.axis]);
    if (!value) continue;
    const allowed = new Set(group.options.map((option) => option.id));
    initial[group.axis] = value.split(',').filter((item) => allowed.has(item));
  }
  return initial;
}

const visibleChipTags = new Set(finderGroups.flatMap((group) => group.options.map((option) => option.id)));

function attributeChips(n: MapNode): string[] {
  return (n.tags ?? []).filter((tag) => visibleChipTags.has(tag));
}

function activateWithKeyboard(e: React.KeyboardEvent, action: () => void) {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  e.preventDefault();
  e.stopPropagation();
  action();
}

export function AlgorithmMap() {
  const svgRef = useRef<SVGSVGElement>(null);
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const dragDistRef = useRef(0);

  // Resolve the active language from the URL so chapter links point at the
  // correct locale. The default language (en) has no prefix; only `zh` is
  // prefixed. Without this, every node link in the Chinese site pointed at the
  // bare `/docs/...` path and the navigation would hang / 404.
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);
  const lang = segments[0] === 'zh' ? 'zh' : 'en';
  const localizedHref = useCallback(
    (href?: string): string => {
      if (!href) return '';
      if (lang === 'en') return href;
      return href.startsWith('/') ? `/zh${href}` : href;
    },
    [lang],
  );

  const [view, setView] = useState<ViewState>({ x: 0, y: 0, k: 1 });
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [selectedFamily, setSelectedFamily] = useState<FamilyId | null>(null);
  const [finderOpen, setFinderOpen] = useState(false);
  const [selectedFacets, setSelectedFacets] = useState<SelectedFacets>(initialFacetsFromUrl);
  const [urlSyncReady, setUrlSyncReady] = useState(false);
  // Captured once at first render, before any effect strips the flag from the
  // URL, so the deep-link and arrival effects agree on whether we warped in.
  const warpArrivalRef = useRef(
    typeof window !== 'undefined' &&
      new URLSearchParams(window.location.search).get('warp') === '1',
  );

  const focusId = hovered ?? selected;
  const lineage = useMemo(() => (focusId ? collectLineage(focusId) : null), [focusId]);

  const selectedCount = countSelectedFacets(selectedFacets);
  const finderActive = selectedCount > 0;

  const matchById = useMemo(() => {
    const matches = new Map<string, { pass: boolean; score: number }>();
    for (const n of nodes) matches.set(n.id, nodeMatchScore(n, selectedFacets));
    return matches;
  }, [selectedFacets]);

  const matchedNodes = useMemo(
    () => nodes.filter((n) => n.kind === 'algorithm' && matchById.get(n.id)?.pass),
    [matchById],
  );

  const visibleCount = matchedNodes.length;

  const zeroSuggestion = useMemo(() => {
    if (!finderActive || visibleCount > 0) return null;
    let best: { tag: string; count: number } | null = null;

    for (const group of finderGroups) {
      for (const tag of selectedFacets[group.axis]) {
        const candidate = cloneFacets(selectedFacets);
        candidate[group.axis] = candidate[group.axis].filter((item) => item !== tag);
        const count = nodes.filter(
          (n) => n.kind === 'algorithm' && nodeMatchScore(n, candidate).pass,
        ).length;
        if (!best || count > best.count) best = { tag, count };
      }
    }

    return best && best.count > 0 ? best : null;
  }, [finderActive, selectedFacets, visibleCount]);

  /** Stagger index inside the selected family, for the cascade pop. */
  const familyOrder = useMemo(() => {
    const order = new Map<string, number>();
    if (!selectedFamily) return order;
    let i = 0;
    for (const n of nodes) {
      if (n.family === selectedFamily) order.set(n.id, i++);
    }
    return order;
  }, [selectedFamily]);

  const centerOn = useCallback((node: MapNode, k = 1.4) => {
    setView({ x: VIEW_W / 2 - node.x * k, y: VIEW_H / 2 - node.y * k, k });
  }, []);

  const selectNode = useCallback((id: string) => {
    setSelected(id);
    setSelectedFamily(null);
  }, []);

  const selectFamily = useCallback((family: FamilyId) => {
    setSelectedFamily((cur) => (cur === family ? null : family));
    setSelected(null);
    setHovered(null);
  }, []);

  const toggleFinderFacet = useCallback((axis: FinderAxis, tag: string) => {
    setSelectedFacets((cur) => {
      const next = cloneFacets(cur);
      next[axis] = next[axis].includes(tag)
        ? next[axis].filter((item) => item !== tag)
        : [...next[axis], tag];
      return next;
    });
    setSelected(null);
    setHovered(null);
    setSelectedFamily(null);
  }, []);

  const clearFinder = useCallback(() => {
    setSelectedFacets(emptyFacets);
    setSelected(null);
    setHovered(null);
    setSelectedFamily(null);
  }, []);

  // Deep link: /map?focus=ppo
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('focus');
    const warp = warpArrivalRef.current;
    const frame = window.requestAnimationFrame(() => {
      if (id && nodeById.has(id)) {
        setSelected(id);
        centerOn(nodeById.get(id)!);
      } else if (!warp && window.innerWidth < 768) {
        // Portrait screens: start zoomed into the center of the map.
        const k = 1.9;
        setView({ x: VIEW_W / 2 - 800 * k, y: VIEW_H / 2 - 480 * k, k });
      }

      setUrlSyncReady(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [centerOn]);

  // Warp arrival: we landed from the homepage morph, which already settled the
  // dots onto this exact layout. Mount at the matching resting framing (before
  // paint) so the hand-off from the overlay is seamless.
  useIsomorphicLayoutEffect(() => {
    if (!warpArrivalRef.current) return;
    // A deep-linked node owns the framing; let it win.
    if (new URLSearchParams(window.location.search).get('focus')) return;

    const cleanUrl = new URL(window.location.href);
    cleanUrl.searchParams.delete('warp');
    window.history.replaceState(null, '', cleanUrl);

    const isMobile = window.innerWidth < 768;
    setView(
      isMobile
        ? { x: VIEW_W / 2 - 800 * 1.9, y: VIEW_H / 2 - 480 * 1.9, k: 1.9 }
        : { x: 0, y: 0, k: 1 },
    );
  }, []);

  // Keep ?focus= and finder facets in the URL shareable.
  useEffect(() => {
    if (!urlSyncReady) return;
    const url = new URL(window.location.href);
    if (selected) url.searchParams.set('focus', selected);
    else url.searchParams.delete('focus');

    for (const group of finderGroups) {
      const key = queryParamByAxis[group.axis];
      const values = selectedFacets[group.axis];
      if (values.length > 0) url.searchParams.set(key, values.join(','));
      else url.searchParams.delete(key);
    }

    window.history.replaceState(null, '', url);
  }, [selected, selectedFacets, urlSyncReady]);

  // Wheel zoom (non-passive so we can prevent page scroll).
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const p = clientToView(svg, e.clientX, e.clientY);
      setView((v) => {
        const k = clampZoom(v.k * Math.exp(-e.deltaY * 0.0016));
        const wx = (p.x - v.x) / v.k;
        const wy = (p.y - v.y) / v.k;
        return { x: p.x - wx * k, y: p.y - wy * k, k };
      });
    };
    svg.addEventListener('wheel', onWheel, { passive: false });
    return () => svg.removeEventListener('wheel', onWheel);
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    pointersRef.current.set(e.pointerId, clientToView(svg, e.clientX, e.clientY));
    if (pointersRef.current.size === 1) dragDistRef.current = 0;
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    const pointers = pointersRef.current;
    if (!svg || !pointers.has(e.pointerId)) return;

    const prev = pointers.get(e.pointerId)!;
    const cur = clientToView(svg, e.clientX, e.clientY);

    // Capture only once an actual drag starts, so plain clicks still reach the
    // node elements (pointer capture would retarget the click to the svg).
    if (dragDistRef.current > 4 && !svg.hasPointerCapture(e.pointerId)) {
      svg.setPointerCapture(e.pointerId);
    }

    if (pointers.size === 1) {
      const dx = cur.x - prev.x;
      const dy = cur.y - prev.y;
      dragDistRef.current += Math.abs(dx) + Math.abs(dy);
      setView((v) => ({ ...v, x: v.x + dx, y: v.y + dy }));
    } else if (pointers.size === 2) {
      const [a, b] = [...pointers.entries()];
      const other = a[0] === e.pointerId ? b[1] : a[1];
      const prevDist = Math.hypot(prev.x - other.x, prev.y - other.y);
      const curDist = Math.hypot(cur.x - other.x, cur.y - other.y);
      const mid = { x: (cur.x + other.x) / 2, y: (cur.y + other.y) / 2 };
      dragDistRef.current += 10;
      if (prevDist > 0) {
        setView((v) => {
          const k = clampZoom(v.k * (curDist / prevDist));
          const wx = (mid.x - v.x) / v.k;
          const wy = (mid.y - v.y) / v.k;
          return { x: mid.x - wx * k, y: mid.y - wy * k, k };
        });
      }
    }
    pointers.set(e.pointerId, cur);
  }, []);

  const onPointerUp = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    pointersRef.current.delete(e.pointerId);
  }, []);

  const onBackgroundClick = useCallback(() => {
    if (dragDistRef.current < 6) {
      setSelected(null);
      setSelectedFamily(null);
    }
  }, []);

  const zoomBy = useCallback((factor: number) => {
    setView((v) => {
      const k = clampZoom(v.k * factor);
      const cx = VIEW_W / 2;
      const cy = VIEW_H / 2;
      const wx = (cx - v.x) / v.k;
      const wy = (cy - v.y) / v.k;
      return { x: cx - wx * k, y: cy - wy * k, k };
    });
  }, []);

  const selectedNode = selected ? nodeById.get(selected) : null;
  const selectedFamilyMeta = selectedFamily ? familyMeta[selectedFamily] : null;
  const selectedFamilyCount = selectedFamily
    ? nodes.filter((n) => n.family === selectedFamily).length
    : 0;

  function nodeOpacity(n: MapNode) {
    const match = matchById.get(n.id);
    if (finderActive) return match?.pass ? 1 : 0.12;
    if (lineage) return lineage.has(n.id) ? 1 : 0.15;
    if (selectedFamily) return n.family === selectedFamily ? 1 : 0.13;
    return 1;
  }

  function edgeOpacity(e: { from: string; to: string }) {
    if (finderActive) {
      const a = matchById.get(e.from)?.pass ?? false;
      const b = matchById.get(e.to)?.pass ?? false;
      if (a && b) return 1;
      if (a || b) return 0.15;
      return 0.06;
    }
    if (lineage) {
      return lineage.has(e.from) && lineage.has(e.to) ? 0.65 : 0.05;
    }
    if (selectedFamily) {
      const a = nodeById.get(e.from)!;
      const b = nodeById.get(e.to)!;
      return a.family === selectedFamily && b.family === selectedFamily ? 0.5 : 0.04;
    }
    return 0.17;
  }

  return (
    <div
      className="relative h-full w-full overflow-hidden grain-overlay"
      style={{ background: 'var(--color-fd-background)', color: 'var(--color-fd-foreground)' }}
    >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="h-full w-full"
        style={{ touchAction: 'none', cursor: 'grab' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClick={onBackgroundClick}
        role="group"
        aria-label="Interactive map of reinforcement learning algorithms"
      >
        <g transform={`translate(${view.x},${view.y}) scale(${view.k})`}>
          {/* Region labels — clickable family territories */}
          {regions.map((r) => (
            <text
              key={r.label}
              x={r.x}
              y={r.y}
              textAnchor="middle"
              className={`font-heading select-none map-region${
                selectedFamily === r.family ? ' map-region-active' : ''
              }`}
              role="button"
              tabIndex={0}
              focusable="true"
              aria-label={`Show ${familyMeta[r.family].label} territory`}
              aria-pressed={selectedFamily === r.family}
              style={{
                fontSize: r.size ?? 26,
                letterSpacing: '0.35em',
                fill: 'currentColor',
                fontWeight: 600,
              }}
              transform={r.rotate ? `rotate(${r.rotate} ${r.x} ${r.y})` : undefined}
              onClick={(e) => {
                e.stopPropagation();
                if (dragDistRef.current < 6) selectFamily(r.family);
              }}
              onKeyDown={(e) => activateWithKeyboard(e, () => selectFamily(r.family))}
            >
              {r.label}
            </text>
          ))}

          <defs>
            {continuations.map((c) => {
              const a = nodeById.get(c.from)!;
              return (
                <linearGradient
                  key={c.from}
                  id={`map-continuation-${c.from}`}
                  x1={a.x}
                  y1={a.y}
                  x2={c.toX}
                  y2={c.toY}
                  gradientUnits="userSpaceOnUse"
                >
                  <stop offset="0%" stopColor="currentColor" stopOpacity={0.14} />
                  <stop offset="58%" stopColor="currentColor" stopOpacity={0.06} />
                  <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
                </linearGradient>
              );
            })}
          </defs>

          {/* Edges */}
          {edges.map((e) => {
            const a = nodeById.get(e.from)!;
            const b = nodeById.get(e.to)!;
            return (
              <line
                key={`${e.from}-${e.to}`}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke="currentColor"
                strokeWidth={lineage && lineage.has(e.from) && lineage.has(e.to) ? 1.5 : 1}
                className="map-fade"
                style={{ opacity: edgeOpacity(e) }}
              />
            );
          })}

          {/* Fading continuations for branches that will grow later. */}
          {continuations.map((c) => {
            const a = nodeById.get(c.from)!;
            return (
              <line
                key={c.from}
                x1={a.x}
                y1={a.y}
                x2={c.toX}
                y2={c.toY}
                stroke={`url(#map-continuation-${c.from})`}
                strokeWidth={0.9}
                className="map-continuation"
              />
            );
          })}

          {/* Nodes */}
          {nodes.map((n) => {
            const r = nodeRadius(n);
            const isFocus = focusId === n.id;
            const inSelectedFamily = selectedFamily !== null && n.family === selectedFamily;
            const match = matchById.get(n.id);
            const isMatched = !finderActive || !!match?.pass;
            const labelY = n.labelDy ?? r + 17;
            const breatheDelay = `-${(n.x * 13 + n.y * 7) % 3400}ms`;
            return (
              <g
                key={n.id}
                transform={`translate(${n.x},${n.y})`}
                className="map-node-group map-fade"
                role="button"
                tabIndex={isMatched ? 0 : -1}
                focusable={isMatched ? 'true' : 'false'}
                aria-label={`${n.label}${n.year ? `, ${n.year}` : ''}. ${
                  n.comingSoon ? 'Chapter coming soon.' : 'Chapter available.'
                }`}
                aria-pressed={selected === n.id}
                style={{ opacity: nodeOpacity(n), cursor: isMatched ? 'pointer' : 'default', pointerEvents: isMatched ? 'auto' : 'none' }}
                onPointerEnter={(e) => {
                  if (e.pointerType !== 'touch') setHovered(n.id);
                }}
                onPointerLeave={() => setHovered((h) => (h === n.id ? null : h))}
                onFocus={() => setHovered(n.id)}
                onBlur={() => setHovered((h) => (h === n.id ? null : h))}
                onClick={(e) => {
                  e.stopPropagation();
                  if (dragDistRef.current < 6) selectNode(n.id);
                }}
                onKeyDown={(e) => activateWithKeyboard(e, () => selectNode(n.id))}
              >
                <circle
                  r={r + 14}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  className="map-focus-ring"
                />
                <g
                  className={`map-node-visual${inSelectedFamily ? ' map-pop' : ''}`}
                  style={{
                    transform: isFocus ? 'scale(1.3)' : undefined,
                    animationDelay: inSelectedFamily
                      ? `${(familyOrder.get(n.id) ?? 0) * 60}ms`
                      : undefined,
                  }}
                >
                  {n.status === 'workhorse' && (
                    <circle
                      r={r + 8}
                      fill="currentColor"
                      opacity={0.09}
                      className="map-breathe"
                      style={{ animationDelay: breatheDelay }}
                    />
                  )}
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
                </g>
                {/* invisible hit area */}
                <circle r={24} fill="transparent" />
                <text
                  x={n.labelDx ?? 0}
                  y={labelY}
                  textAnchor="middle"
                  className="font-heading select-none"
                  style={{
                    fontSize: statusFontSize[n.status],
                    fontWeight: isFocus || n.status === 'workhorse' ? 700 : 500,
                    fill: 'currentColor',
                    opacity: isFocus ? 1 : 0.72,
                  }}
                >
                  {n.label}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      {/* ===== Header ===== */}
      <div className="pointer-events-none absolute left-3 top-3 z-10 w-[300px] max-w-[calc(100%-1.5rem)] sm:left-5 sm:top-5 sm:w-[330px]">
        <div className="pointer-events-auto map-overlay-card rounded-sm p-3.5 sm:p-4">
          <h1
            className="font-heading text-lg font-bold leading-tight sm:text-xl"
            style={{ color: 'var(--color-fd-foreground)' }}
          >
            The Map of RL
          </h1>
          <p
            className="font-body mt-1.5 text-xs leading-relaxed sm:text-sm"
            style={{ color: 'var(--color-fd-muted-foreground)' }}
          >
            A curated lineage of handbook methods. Click a node for the chapter,
            or click a territory to isolate a family.
          </p>

          <button
            type="button"
            onClick={() => setFinderOpen((open) => !open)}
            aria-expanded={finderOpen}
            aria-controls="map-finder-panel"
            className="cta-btn mt-3 flex w-full cursor-pointer items-center justify-between px-3 py-2 font-heading text-xs font-semibold uppercase"
            style={{
              letterSpacing: '0.08em',
              background: finderOpen ? 'var(--color-fd-foreground)' : 'var(--color-fd-primary)',
              color: finderOpen ? 'var(--color-fd-background)' : 'var(--color-fd-primary-foreground)',
            }}
          >
            <span>{finderOpen ? 'Hide filters' : 'Find my algorithm'}</span>
            <span>{finderActive ? `${selectedCount}` : finderOpen ? '↑' : '↓'}</span>
          </button>

          {finderOpen && (
            <div
              id="map-finder-panel"
              className="mt-3 border-t pt-3"
              style={{ borderColor: 'var(--color-fd-border)' }}
            >
              <div className="flex items-center justify-between gap-3">
                <p
                  className="font-heading text-[0.65rem] font-semibold uppercase"
                  aria-live="polite"
                  style={{ letterSpacing: '0.1em', color: 'var(--color-fd-muted-foreground)' }}
                >
                  {visibleCount} matches
                </p>
                {finderActive && (
                  <button
                    type="button"
                    onClick={clearFinder}
                    className="cursor-pointer font-heading text-[0.65rem] uppercase underline-offset-2 hover:underline"
                    style={{ letterSpacing: '0.08em', color: 'var(--color-fd-muted-foreground)' }}
                  >
                    Clear
                  </button>
                )}
              </div>

              {zeroSuggestion && (
                <p
                  className="font-body mt-2 text-[0.74rem] leading-relaxed"
                  style={{ color: 'var(--color-fd-muted-foreground)' }}
                >
                  No exact match. Remove “{optionLabel(zeroSuggestion.tag)}” to see{' '}
                  {zeroSuggestion.count} results.
                </p>
              )}

              <div className="mt-2 flex max-h-[52vh] flex-col gap-2 overflow-y-auto pr-1">
                {finderGroups.map((group) => (
                  <fieldset
                    key={group.axis}
                    className={group.subtle ? 'border-t pt-2' : undefined}
                    style={group.subtle ? { borderColor: 'var(--color-fd-border)' } : undefined}
                  >
                    <legend
                      className="font-heading text-[0.6rem] font-semibold uppercase"
                      style={{ letterSpacing: '0.1em', color: 'var(--color-fd-muted-foreground)' }}
                    >
                      {group.label}
                    </legend>
                    <div className="mt-1 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                      {group.options.map((tag) => {
                        const checked = selectedFacets[group.axis].includes(tag.id);
                        return (
                          <label
                            key={tag.id}
                            className="map-option flex cursor-pointer items-center gap-2 rounded-sm px-1 py-1 font-body text-[0.75rem] leading-tight"
                            style={{
                              color: checked ? 'var(--color-fd-foreground)' : 'var(--color-fd-muted-foreground)',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleFinderFacet(group.axis, tag.id)}
                              className="size-3 accent-current"
                            />
                            <span>{tag.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </fieldset>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===== Detail card: node ===== */}
      {selectedNode && (
        <div className="map-overlay-card absolute inset-x-3 bottom-3 z-10 rounded-sm p-4 md:inset-x-auto md:bottom-auto md:right-5 md:top-5 md:w-[330px]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <button
                onClick={() => selectFamily(selectedNode.family)}
                className="cursor-pointer font-heading text-[0.65rem] font-semibold uppercase underline-offset-2 hover:underline"
                style={{ letterSpacing: '0.12em', color: 'var(--color-fd-muted-foreground)' }}
              >
                {familyMeta[selectedNode.family].label} →
              </button>
              <h2
                className="font-heading mt-1 text-base font-bold"
                style={{ color: 'var(--color-fd-foreground)' }}
              >
                {selectedNode.label}
                {selectedNode.year && (
                  <span
                    className="ml-2 text-xs font-medium"
                    style={{ color: 'var(--color-fd-muted-foreground)' }}
                  >
                    {selectedNode.year}
                  </span>
                )}
              </h2>
            </div>
            <button
              onClick={() => setSelected(null)}
              aria-label="Close"
              className="cursor-pointer font-heading text-sm leading-none"
              style={{ color: 'var(--color-fd-muted-foreground)' }}
            >
              ✕
            </button>
          </div>

          {!selectedNode.comingSoon && (
            <>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {attributeChips(selectedNode).map((chip) => (
                  <span
                    key={chip}
                    className="font-heading rounded-sm px-1.5 py-0.5 text-[0.62rem] uppercase"
                    style={{
                      letterSpacing: '0.06em',
                      border: '1px solid var(--color-fd-border)',
                      color: 'var(--color-fd-muted-foreground)',
                    }}
                  >
                    {chip}
                  </span>
                ))}
              </div>

              <p
                className="font-body mt-2.5 text-[0.84rem] leading-relaxed"
                style={{ color: 'var(--color-fd-foreground)' }}
              >
                {selectedNode.blurb}
              </p>
            </>
          )}

          {selectedNode.href ? (
            <Link
              href={localizedHref(selectedNode.href)}
              className="icon-link mt-3 inline-block font-heading text-xs font-semibold uppercase underline underline-offset-4"
              style={{ letterSpacing: '0.08em', color: 'var(--color-fd-foreground)' }}
            >
              Read the chapter →
            </Link>
          ) : (
            <p
              className="font-heading mt-3 text-[0.65rem] uppercase"
              style={{ letterSpacing: '0.1em', color: 'var(--color-fd-muted-foreground)' }}
            >
              Chapter coming soon
            </p>
          )}
        </div>
      )}

      {/* ===== Detail card: family territory ===== */}
      {!selectedNode && selectedFamilyMeta && (
        <div className="map-overlay-card absolute inset-x-3 bottom-3 z-10 rounded-sm p-4 md:inset-x-auto md:bottom-auto md:right-5 md:top-5 md:w-[330px]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p
                className="font-heading text-[0.65rem] font-semibold uppercase"
                style={{ letterSpacing: '0.12em', color: 'var(--color-fd-muted-foreground)' }}
              >
                Territory · {selectedFamilyCount} nodes
              </p>
              <h2
                className="font-heading mt-1 text-base font-bold"
                style={{ color: 'var(--color-fd-foreground)' }}
              >
                {selectedFamilyMeta.label}
              </h2>
            </div>
            <button
              onClick={() => setSelectedFamily(null)}
              aria-label="Close"
              className="cursor-pointer font-heading text-sm leading-none"
              style={{ color: 'var(--color-fd-muted-foreground)' }}
            >
              ✕
            </button>
          </div>

          {selectedFamilyMeta.href && (
            <p
              className="font-body mt-2.5 text-[0.84rem] leading-relaxed"
              style={{ color: 'var(--color-fd-foreground)' }}
            >
              {selectedFamilyMeta.blurb}
            </p>
          )}

          {selectedFamilyMeta.href ? (
            <Link
              href={localizedHref(selectedFamilyMeta.href)}
              className="icon-link mt-3 inline-block font-heading text-xs font-semibold uppercase underline underline-offset-4"
              style={{ letterSpacing: '0.08em', color: 'var(--color-fd-foreground)' }}
            >
              Start the chapter →
            </Link>
          ) : (
            <p
              className="font-heading mt-3 text-[0.65rem] uppercase"
              style={{ letterSpacing: '0.1em', color: 'var(--color-fd-muted-foreground)' }}
            >
              Chapters coming soon
            </p>
          )}
        </div>
      )}

      {/* ===== Legend ===== */}
      <div
        className="pointer-events-none absolute bottom-4 left-5 z-10 hidden md:block"
        style={{ color: 'var(--color-fd-muted-foreground)' }}
      >
        <div className="font-heading flex flex-col gap-1.5 text-[0.65rem]" style={{ letterSpacing: '0.05em' }}>
          <span className="flex items-center gap-1.5">
            <svg width="30" height="14" viewBox="0 0 30 14" aria-hidden="true">
              <circle cx="7" cy="7" r="6.5" fill="currentColor" />
              <circle cx="22" cy="7" r="3" fill="currentColor" />
            </svg>
            size = rough use
          </span>
          <span>○ foundation concept</span>
          <span style={{ opacity: 0.8 }}>◌ chapter coming soon</span>
        </div>
      </div>

      {/* ===== Zoom controls ===== */}
      <div className="absolute bottom-4 right-4 z-10 flex flex-col items-end gap-2">
        <div className="map-overlay-card flex overflow-hidden rounded-sm">
          {[
            { label: '−', action: () => zoomBy(1 / 1.35), aria: 'Zoom out' },
            { label: '⌖', action: () => setView({ x: 0, y: 0, k: 1 }), aria: 'Reset view' },
            { label: '+', action: () => zoomBy(1.35), aria: 'Zoom in' },
          ].map((b) => (
            <button
              key={b.aria}
              onClick={b.action}
              aria-label={b.aria}
              className="map-option cursor-pointer px-3 py-1.5 font-heading text-sm"
              style={{ color: 'var(--color-fd-foreground)' }}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
