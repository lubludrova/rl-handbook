'use client';

import { useMemo, useState } from 'react';
import {
  ACTIVE_STATES,
  CLIFF,
  GOAL,
  START,
  THETA,
  createState,
  evaluateSweep,
  evaluateToConvergence,
  improvePolicy,
  inspectBackup,
  stepBackup,
} from './model.mjs';

type ModelState = ReturnType<typeof createState>;
type BackupTerm = {
  action: number;
  probability: number;
  reward: number;
  nextState: number;
  nextValue: number;
  q: number;
  contribution: number;
};
type BackupRecord = {
  state: number;
  oldValue: number;
  newValue: number;
  terms: BackupTerm[];
};

const ACTIONS = ['↑', '→', '↓', '←'];
const ACTION_NAMES = ['up', 'right', 'down', 'left'];
const GRID_SIZE = 16;
const ACTIVE_COUNT = 13;

const copy = {
  en: {
    title: 'Bellman playground',
    intro:
      'A small 4×4 cliff-walking snapshot. Step through synchronous backups and see exactly how the value and policy interact.',
    gamma: 'Discount γ',
    gammaHelp: 'Change γ to create a fresh value-function state.',
    value: 'Value',
    policy: 'Policy',
    selected: 'Selected state',
    start: 'START',
    goal: 'GOAL',
    cliff: 'CLIFF',
    backup: 'Single backup',
    fullSweep: 'Full sweep',
    finishSweep: 'Finish sweep',
    converge: 'Evaluate until converged',
    improve: 'Improve policy',
    reset: 'Reset',
    progress: 'Current progress',
    sweeps: 'Complete sweeps',
    improvements: 'Policy improvements',
    delta: 'Last complete-sweep Δ',
    next: 'Next cell',
    status: 'Status',
    ready: 'Ready for a sweep',
    running: 'Sweep in progress',
    converged: 'Converged',
    stable: 'Policy stable',
    actual: 'Actual backup',
    preview: 'Preview backup',
    formula: 'Backup equation',
    actionHeader: 'Action',
    probability: 'π',
    reward: 'r',
    nextState: 's′',
    nextValue: 'V(s′)',
    q: 'q',
    contribution: 'π·q',
    noTerms: 'This state has no Bellman backup terms.',
    terminalText: 'GOAL is terminal: its value is fixed at 0 and no action is evaluated.',
    cliffText: 'CLIFF is terminal and unavailable to the active sweep.',
    selectedLabel: (index: number) => `State ${index}`,
    cellLabel: (index: number, value: number, arrows: string) =>
      `State ${index}, value ${formatCell(value)}, current policy ${arrows || 'none'}`,
    action: (index: number) => ACTION_NAMES[index] ?? `action ${index}`,
  },
  zh: {
    title: '贝尔曼演示',
    intro: '一个小型 4×4 悬崖行走同步快照。逐步执行备份，观察价值与策略如何相互作用。',
    gamma: '折扣 γ',
    gammaHelp: '修改 γ 会创建全新的价值函数状态。',
    value: '价值',
    policy: '策略',
    selected: '选中状态',
    start: '起点',
    goal: '终点',
    cliff: '悬崖',
    backup: '单步备份',
    fullSweep: '完整扫描',
    finishSweep: '完成扫描',
    converge: '评估至收敛',
    improve: '改进策略',
    reset: '重置',
    progress: '当前进度',
    sweeps: '完成扫描数',
    improvements: '策略改进数',
    delta: '上次完整扫描 Δ',
    next: '下一个状态',
    status: '状态',
    ready: '等待扫描',
    running: '扫描进行中',
    converged: '已收敛',
    stable: '策略稳定',
    actual: '实际备份',
    preview: '预览备份',
    formula: '备份公式',
    actionHeader: '动作',
    probability: 'π',
    reward: 'r',
    nextState: 's′',
    nextValue: 'V(s′)',
    q: 'q',
    contribution: 'π·q',
    noTerms: '该状态没有贝尔曼备份项。',
    terminalText: '终点是终止状态：价值固定为 0，不评估动作。',
    cliffText: '悬崖是终止状态，不属于当前扫描的有效状态。',
    selectedLabel: (index: number) => `状态 ${index}`,
    cellLabel: (index: number, value: number, arrows: string) =>
      `状态 ${index}，价值 ${formatCell(value)}，当前策略 ${arrows || '无'}`,
    action: (index: number) => ['上', '右', '下', '左'][index] ?? `动作 ${index}`,
  },
} as const;

type Locale = keyof typeof copy;
const format = (value: number) => (Number.isFinite(value) ? value.toFixed(2) : '—');
const formatCell = format;
const formatProbability = (value: number) => (Number.isFinite(value) ? value.toFixed(2) : '—');

function isCliff(index: number) {
  return CLIFF.includes(index);
}

function policyArrows(policy: number[] | undefined) {
  if (!policy) return '';
  const max = Math.max(...policy);
  if (!Number.isFinite(max) || max <= 0) return '';
  return policy
    .map((probability, action) => (probability > 0 && probability >= max - 1e-9 ? ACTIONS[action] : ''))
    .join('');
}

function cellKind(index: number) {
  if (index === START) return 'start';
  if (index === GOAL) return 'goal';
  if (isCliff(index)) return 'cliff';
  return 'active';
}

function statusText(state: ModelState, t: (typeof copy)[Locale]) {
  if (state.stable) return `${t.converged} · ${t.stable}`;
  if (state.converged) return t.converged;
  if (state.cursor > 0) return t.running;
  return t.ready;
}

export function BellmanPlayground({ locale }: { locale: 'en' | 'zh' }) {
  const t = copy[locale];
  const [state, setState] = useState<ModelState>(() => createState());
  const [selected, setSelected] = useState(START);

  const selectedRecord = (state.records?.[selected] ?? null) as BackupRecord | null;
  const previewValues = state.cursor > 0 ? state.snapshot : state.values;
  const detail = useMemo(() => {
    if (selectedRecord) return { record: selectedRecord, actual: true };
    if (selected === GOAL || isCliff(selected)) return { record: null, actual: false };
    return {
      record: inspectBackup(selected, previewValues, state.policy, state.gamma) as BackupRecord,
      actual: false,
    };
  }, [previewValues, selected, selectedRecord, state.gamma, state.policy]);

  const nextCell = state.cursor < ACTIVE_COUNT ? ACTIVE_STATES[state.cursor] : null;
  const runSingle = () => setState((current) => stepBackup(current));
  const runSweep = () =>
    setState((current) => {
      if (current.cursor === 0) return evaluateSweep(current);
      let next = current;
      for (let count = 0; count < ACTIVE_COUNT && next.cursor > 0; count += 1) next = stepBackup(next);
      return next;
    });
  const runConvergence = () => setState((current) => evaluateToConvergence(current));
  const runImprove = () => setState((current) => improvePolicy(current));
  const reset = () => setState((current) => createState(current.gamma));
  const changeGamma = (value: string) => setState(() => createState(Number(value)));

  return (
    <section className="not-prose my-8 overflow-hidden rounded-lg border border-fd-border bg-fd-card text-fd-card-foreground shadow-sm">
      <div className="border-b border-fd-border px-4 py-5 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="font-heading text-xl font-semibold tracking-tight">{t.title}</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-fd-muted-foreground">{t.intro}</p>
          </div>
          <label className="grid shrink-0 gap-1 text-sm font-medium" htmlFor="bellman-gamma">
            <span>{t.gamma}: {state.gamma.toFixed(2)}</span>
            <input
              id="bellman-gamma"
              className="h-2 w-36 cursor-pointer accent-fd-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring"
              type="range"
              min="0"
              max="0.99"
              step="0.01"
              value={state.gamma}
              onChange={(event) => changeGamma(event.target.value)}
              aria-describedby="bellman-gamma-help"
            />
            <span id="bellman-gamma-help" className="text-xs font-normal text-fd-muted-foreground">{t.gammaHelp}</span>
          </label>
        </div>
      </div>

      <div className="grid min-w-0 gap-6 p-4 sm:p-6 lg:grid-cols-[minmax(18rem,0.9fr)_minmax(0,1.1fr)] lg:items-start">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-fd-muted-foreground">
            <span>{t.value} + {t.policy} · γ={state.gamma.toFixed(2)}</span>
            <span aria-live="polite">{t.progress}: {state.cursor}/{ACTIVE_COUNT}</span>
          </div>
          <div className="mx-auto grid aspect-square w-full max-w-[27rem] grid-cols-4 gap-1.5" aria-label="4 by 4 cliff walking grid">
            {Array.from({ length: GRID_SIZE }, (_, index) => {
              const kind = cellKind(index);
              const value = state.values[index] ?? 0;
              // GOAL/CLIFF are terminal: no action is ever evaluated there, so
              // showing a policy arrow would imply a preference that doesn't exist.
              const showPolicy = kind === 'active' || kind === 'start';
              const arrows = showPolicy ? policyArrows(state.policy[index]) : '';
              const isNext = index === nextCell;
              const isSelected = index === selected;
              const kindClass =
                kind === 'cliff'
                  ? 'border-rose-500/50 bg-rose-500/15 text-rose-800 dark:text-rose-200'
                  : kind === 'goal'
                    ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-800 dark:text-emerald-200'
                    : kind === 'start'
                      ? 'border-fd-primary/60 bg-fd-primary/10'
                      : 'border-fd-border bg-fd-background';
              return (
                <button
                  key={index}
                  type="button"
                  className={`relative flex min-h-0 min-w-0 flex-col items-center justify-center rounded-md border p-1 text-center hover:border-fd-primary focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring ${kindClass} ${isSelected ? 'ring-2 ring-fd-primary ring-offset-1 ring-offset-fd-card' : ''} ${isNext ? 'outline outline-2 outline-dashed outline-fd-primary outline-offset-[-4px]' : ''}`}
                  aria-pressed={isSelected}
                  aria-label={t.cellLabel(index, value, arrows)}
                  onClick={() => setSelected(index)}
                >
                  <span className="absolute left-1 top-1 text-[0.62rem] font-semibold uppercase tracking-wide opacity-75">
                    {kind === 'start' ? t.start : kind === 'goal' ? t.goal : kind === 'cliff' ? t.cliff : index}
                  </span>
                  <span className="mt-2 text-[clamp(0.82rem,2.5vw,1.2rem)] font-semibold tabular-nums">{formatCell(value)}</span>
                  <span className="mt-1 min-h-5 text-xl leading-none" aria-hidden="true">{showPolicy ? arrows || '·' : ''}</span>
                  {showPolicy && (
                    <span className="sr-only">{arrows ? `${t.policy}: ${arrows}` : t.policy}</span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-3" role="group" aria-label={t.title}>
            <button type="button" className="rounded-md bg-fd-primary px-3 py-2 text-sm font-medium text-fd-primary-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring" onClick={runSingle}>{t.backup}</button>
            <button type="button" className="rounded-md border border-fd-border px-3 py-2 text-sm font-medium hover:bg-fd-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring" onClick={runSweep}>{state.cursor > 0 ? t.finishSweep : t.fullSweep}</button>
            <button type="button" className="rounded-md border border-fd-border px-3 py-2 text-sm font-medium hover:bg-fd-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring" onClick={runConvergence} disabled={state.converged} title={state.converged ? t.converged : undefined}>{t.converge}</button>
            <button type="button" className="rounded-md border border-fd-border px-3 py-2 text-sm font-medium hover:bg-fd-accent disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring" onClick={runImprove} disabled={!state.converged || state.stable} title={!state.converged ? t.converged : state.stable ? t.stable : undefined}>{t.improve}</button>
            <button type="button" className="ml-auto rounded-md px-3 py-2 text-sm font-medium text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring" onClick={reset}>{t.reset}</button>
          </div>
        </div>

        <aside className="min-w-0 rounded-md border border-fd-border bg-fd-background/70 p-4" aria-live="polite">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-fd-border pb-3">
            <h3 className="font-heading text-base font-semibold">{t.selected}: {t.selectedLabel(selected)}</h3>
            <span className="text-xs text-fd-muted-foreground">{detail.actual ? t.actual : t.preview}</span>
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 py-4 text-sm sm:grid-cols-4 lg:grid-cols-2">
            <div><dt className="text-fd-muted-foreground">{t.sweeps}</dt><dd className="font-semibold tabular-nums">{state.sweeps}</dd></div>
            <div><dt className="text-fd-muted-foreground">{t.improvements}</dt><dd className="font-semibold tabular-nums">{state.improvements}</dd></div>
            <div><dt className="text-fd-muted-foreground">{t.delta}</dt><dd className="font-semibold tabular-nums">{state.delta === null ? '—' : format(state.delta)}</dd></div>
            <div><dt className="text-fd-muted-foreground">{t.next}</dt><dd className="font-semibold">{nextCell === null ? '—' : t.selectedLabel(nextCell)}</dd></div>
          </dl>
          <p className="mb-4 rounded border border-fd-border px-3 py-2 text-sm"><span className="font-medium">{t.status}:</span> {statusText(state, t)}</p>

          {detail.record ? (
            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                <h4 className="font-heading text-sm font-semibold">{t.formula}</h4>
                <span className="font-mono text-xs text-fd-muted-foreground">{format(detail.record.oldValue)} → {format(detail.record.newValue)}</span>
              </div>
              <div className="overflow-x-auto rounded border border-fd-border">
                <table className="w-full text-left text-xs">
                  <thead className="bg-fd-accent/50 text-fd-muted-foreground"><tr><th className="px-1.5 py-2 font-medium">{t.actionHeader}</th><th className="px-1.5 py-2 font-medium">{t.probability}</th><th className="px-1.5 py-2 font-medium">{t.reward}</th><th className="px-1.5 py-2 font-medium">{t.nextState}</th><th className="px-1.5 py-2 font-medium">{t.nextValue}</th><th className="px-1.5 py-2 font-medium">{t.q}</th><th className="px-1.5 py-2 font-medium">{t.contribution}</th></tr></thead>
                  <tbody>{detail.record.terms.map((term) => <tr key={term.action} className="border-t border-fd-border"><td className="px-1.5 py-2 text-sm font-medium" aria-label={t.action(term.action)}>{ACTIONS[term.action]}</td><td className="px-1.5 py-2 tabular-nums">{formatProbability(term.probability)}</td><td className="px-1.5 py-2 tabular-nums">{format(term.reward)}</td><td className="px-1.5 py-2 tabular-nums">{term.nextState}</td><td className="px-1.5 py-2 tabular-nums">{format(term.nextValue)}</td><td className="px-1.5 py-2 tabular-nums">{format(term.q)}</td><td className="px-1.5 py-2 tabular-nums">{format(term.contribution)}</td></tr>)}</tbody>
                </table>
              </div>
              <p className="mt-3 break-words font-mono text-xs leading-5 text-fd-muted-foreground">V({detail.record.state}) = Σ π(a|s)q(s,a) = {format(detail.record.oldValue)} → {format(detail.record.newValue)}</p>
            </div>
          ) : (
            <p className="text-sm leading-6 text-fd-muted-foreground">{selected === GOAL ? t.terminalText : selected === START || !isCliff(selected) ? t.noTerms : t.cliffText}</p>
          )}
        </aside>
      </div>
      <div className="border-t border-fd-border px-4 py-3 text-xs text-fd-muted-foreground"><span className="font-medium">θ = {THETA}</span> · {t.status}: {statusText(state, t)}</div>
    </section>
  );
}

