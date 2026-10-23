'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { APPROX, CUE, POCKET, REAL, TARGET, findShot, simulate } from './model.mjs';
import styles from './billiards.module.css';

type Mode = 'none' | 'approx' | 'exact';
type Frame = ReturnType<typeof simulate>['frames'][number];
const initialFrame = (): Frame => [CUE, TARGET].map((p) => ({ ...p, pocket: false }));
const modes: { value: Mode; title: string; description: string }[] = [
  { value: 'none', title: 'No model', description: 'Aim and observe' },
  { value: 'approx', title: 'Imperfect model', description: 'Biased physics predictions' },
  { value: 'exact', title: 'Accurate model', description: 'Matches this simulator' },
];

function path(frames: Frame[], ball: number) {
  return frames.filter((_, i) => i % 2 === 0 || i === frames.length - 1)
    .map((f, i) => `${i ? 'L' : 'M'}${f[ball].x.toFixed(1)},${f[ball].y.toFixed(1)}`).join(' ');
}

export function BilliardsPlayground() {
  const id = useId().replace(/:/g, '');
  const [mode, setMode] = useState<Mode>('exact');
  const [angle, setAngle] = useState(-19.5);
  const [power, setPower] = useState(60);
  const [history, setHistory] = useState<Frame[]>([initialFrame()]);
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState('Aim the white ball to pocket the blue ball. Dashed lines are predictions.');
  const animation = useRef(0);
  useEffect(() => () => cancelAnimationFrame(animation.current), []);
  const prediction = useMemo(() => mode === 'none' ? null : simulate(angle, power, mode === 'exact' ? REAL : APPROX), [angle, power, mode]);
  const current = history[history.length - 1];

  function reset() {
    cancelAnimationFrame(animation.current);
    setRunning(false);
    setHistory([initialFrame()]);
  }
  function changeShot(nextAngle: number, nextPower: number) {
    reset(); setAngle(nextAngle); setPower(nextPower);
    setStatus('Shot updated. No real interaction has taken place.');
  }
  function changeModel(next: Mode) {
    reset(); setMode(next);
    setStatus('Model changed; direction, power and real table are unchanged. Compare the predicted outcome.');
  }
  function search() {
    if (mode === 'none' || running) return;
    const best = findShot(mode === 'exact' ? REAL : APPROX);
    if (!best) { setStatus('No successful direct shot found in this search. Adjust the aim or power.'); return; }
    changeShot(best.angle, best.power);
    setStatus('Search found a predicted pocket. Shoot to test it, or switch models without changing the shot.');
  }
  function shoot() {
    if (running) return;
    reset(); setRunning(true); setStatus('The shot is running in the real table simulator. Solid trails show measured motion.');
    const actual = simulate(angle, power, REAL);
    let start: number | undefined;
    function tick(time: number) {
      start ??= time;
      const n = Math.min(actual.frames.length, Math.floor((time - start) / 1000 * 60) + 1);
      setHistory(actual.frames.slice(0, n));
      if (n < actual.frames.length) { animation.current = requestAnimationFrame(tick); return; }
      setRunning(false);
      let text = actual.pocket ? 'Target ball pocketed!' : actual.contact ? 'Contact made, but the target missed.' : 'The cue ball did not hit the target.';
      if (prediction) {
        const expected = prediction.frames.at(-1)![1], observed = actual.frames.at(-1)![1];
        const error = Math.hypot(expected.x - observed.x, expected.y - observed.y);
        text += ` Model predicted ${prediction.pocket ? 'a pocket' : 'a miss'}; target endpoint error: ${error.toFixed(0)} table units.`;
      } else text += ' No model prediction was used.';
      if (actual.scratch) text += ' The cue ball was also pocketed (scratch).';
      setStatus(text);
    }
    animation.current = requestAnimationFrame(tick);
  }
  function aim(event: React.PointerEvent<SVGSVGElement>) {
    if (running) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) * 720 / bounds.width;
    const y = (event.clientY - bounds.top) * 400 / bounds.height;
    changeShot(Math.atan2(y - CUE.y, x - CUE.x) * 180 / Math.PI, power);
  }
  const radians = angle * Math.PI / 180;

  return <div className={styles.playground}>
    <p className={styles.title}>Try it: predict, collide, pocket</p>
    <p className={styles.intro}>Strike the white cue ball so that the blue target ball reaches the pocket. The real table stays the same in all three modes.</p>
    <fieldset className={styles.modes} disabled={running}>
      <legend>Prediction model</legend>
      {modes.map((item) => <label key={item.value} className={mode === item.value ? styles.selected : ''}>
        <span><input type="radio" name={`model-${id}`} value={item.value} checked={mode === item.value} onChange={() => changeModel(item.value)} />{item.title}</span>
        <small>{item.description}</small>
      </label>)}
    </fieldset>
    <svg className={styles.table} viewBox="0 0 720 400" role="img" aria-label="Billiards table: drag to aim, or use the direction slider below" onPointerDown={(e) => { if (!running) { e.currentTarget.setPointerCapture(e.pointerId); aim(e); } }} onPointerMove={(e) => { if (e.buttons) aim(e); }}>
      <defs><radialGradient id={`cue-${id}`} cx="30%" cy="25%"><stop stopColor="#fff" /><stop offset="1" stopColor="#c1cad5" /></radialGradient></defs>
      <rect x="12" y="12" width="696" height="376" rx="24" fill="#202c3b" />
      <rect x="30" y="30" width="660" height="340" rx="12" fill="var(--color-fd-secondary)" />
      <circle cx={POCKET.x} cy={POCKET.y} r="24" fill="#101923" />
      <text x="570" y="107" fill="var(--color-fd-muted-foreground)" fontSize="11">TARGET POCKET</text>
      {prediction && [0, 1].map((b) => <path key={`pred-${b}`} d={path(prediction.frames, b)} fill="none" stroke={b ? '#5790ff' : '#99a7b9'} strokeWidth="2" strokeDasharray="7 6" />)}
      {[0, 1].map((b) => <path key={`real-${b}`} d={path(history, b)} fill="none" stroke={b ? '#5790ff' : '#99a7b9'} strokeWidth={b ? 3 : 2} />)}
      {!running && history.length === 1 && <line x1={CUE.x - 20 * Math.cos(radians)} y1={CUE.y - 20 * Math.sin(radians)} x2={CUE.x - 90 * Math.cos(radians)} y2={CUE.y - 90 * Math.sin(radians)} stroke="#99a7b9" strokeWidth="2" />}
      {current.map((b, i) => <circle key={i} cx={b.x} cy={b.y} r="10" fill={i ? '#3979f6' : `url(#cue-${id})`} stroke={i ? '#1e55b9' : '#94a0b2'} opacity={b.pocket ? 0.15 : 1} />)}
      <text x="100" y="322" fill="var(--color-fd-muted-foreground)" fontSize="11">WHITE CUE BALL</text>
      <text x="404" y="154" fill="var(--color-fd-muted-foreground)" fontSize="11">BLUE TARGET</text>
    </svg>
    <div className={styles.buttons}>
      <button type="button" className={styles.primary} disabled={running} onClick={shoot}>Shoot</button>
      <button type="button" onClick={() => { reset(); setStatus('Both balls reset. The shot settings are unchanged.'); }}>Reset balls</button>
      <button type="button" disabled={running || mode === 'none'} onClick={search}>Find a shot with model</button>
    </div>
    <div className={styles.sliders}>
      <label htmlFor={`angle-${id}`}>Direction <output>{angle.toFixed(1)}°</output><input id={`angle-${id}`} disabled={running} type="range" min="-180" max="180" step="0.05" value={angle} onChange={(e) => changeShot(Number(e.target.value), power)} /></label>
      <label htmlFor={`power-${id}`}>Power <output>{power}</output><input id={`power-${id}`} disabled={running} type="range" min="15" max="100" value={power} onChange={(e) => changeShot(angle, Number(e.target.value))} /></label>
    </div>
    <p className={styles.prediction}>{prediction ? `Model prediction: ${prediction.pocket ? 'target pocketed' : prediction.contact ? 'collision, but no pocket' : 'no collision'}.` : 'No model: you can still aim and shoot; no future paths are computed.'}</p>
    <p className={styles.status} role="status" aria-live="polite">{status}</p>
    <p className={styles.legend}>Dashed = imagined · solid = actual · gray = cue ball · blue = target ball</p>
  </div>;
}
