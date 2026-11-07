import './style.css';
import { MicLevel, MicError, type MicErrorKind } from './audio/micLevel';
import { LoudnessTracker, median, type TrackerState } from './audio/loudness';
import {
  STAGES,
  PHASES,
  DEFAULT_PHASE_ID,
  CALIBRATION_MS,
  METER_RANGE,
  SENSITIVITY_LIMIT,
  MIN_FIRST_THRESHOLD,
  type Phase,
} from './config/levels';

// ---------- DOM ----------
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

const app = $<HTMLDivElement>('app');
const phaseSelect = $<HTMLSelectElement>('phase');
const btnRecalibrate = $<HTMLButtonElement>('recalibrate');
const btnFullscreen = $<HTMLButtonElement>('fullscreen');
const disk = $<HTMLDivElement>('disk');
const stageLabel = $<HTMLSpanElement>('stage-label');
const stageHint = $<HTMLSpanElement>('stage-hint');
const zonesDim = $<HTMLDivElement>('zones-dim');
const zonesLit = $<HTMLDivElement>('zones-lit');
const meter = $<HTMLDivElement>('meter');
const meterBar = $<HTMLDivElement>('meter-bar');
const sensHandle = $<HTMLDivElement>('sens-handle');
const sensReset = $<HTMLButtonElement>('sens-reset');
const legend = $<HTMLOListElement>('legend');
const statusEl = $<HTMLParagraphElement>('status');
const startScreen = $<HTMLElement>('start-screen');
const startError = $<HTMLParagraphElement>('start-error');
const calibScreen = $<HTMLElement>('calib-screen');
const calibFill = $<HTMLDivElement>('calib-fill');

// ---------- Zustand ----------
type Mode = 'idle' | 'calibrating' | 'live' | 'manual';
let mode: Mode = 'idle';
let phase: Phase = loadPhase();
let currentStage = -1;
/** Live-Verschiebung der Phasen-Schwellen per Schieberegler (dB, + = lockerer). */
let offset = loadOffset(phase);

/** Wirksame Schwellen = Phase + Schieberegler. */
function thresholds(): number[] {
  return phase.thresholds.map((t) => t + offset);
}

const mic = new MicLevel();
const tracker = new LoudnessTracker(-60);
/** Untergrenze für den Grundpegel – sonst wirkt in sehr stillen Räumen jedes Rascheln riesig. */
const MIN_BASELINE_DB = -70;

// ---------- Persistenz (nur Komfort, darf fehlschlagen) ----------
function loadPhase(): Phase {
  let id = DEFAULT_PHASE_ID;
  try {
    id = localStorage.getItem('mm.phase') ?? id;
  } catch {
    /* privater Modus o. Ä. */
  }
  return PHASES.find((p) => p.id === id) ?? PHASES[0];
}

function savePhase(p: Phase): void {
  try {
    localStorage.setItem('mm.phase', p.id);
  } catch {
    /* egal */
  }
}

function loadOffset(p: Phase): number {
  try {
    const v = Number(localStorage.getItem(`mm.offset.${p.id}`));
    return Number.isFinite(v) ? clampOffset(v, p) : 0;
  } catch {
    return 0;
  }
}

function saveOffset(p: Phase, v: number): void {
  try {
    localStorage.setItem(`mm.offset.${p.id}`, String(v));
  } catch {
    /* egal */
  }
}

/** Erlaubter Bereich des Schiebereglers für eine Phase. */
function offsetBounds(p: Phase): { lo: number; hi: number } {
  return { lo: Math.max(-SENSITIVITY_LIMIT, MIN_FIRST_THRESHOLD - p.thresholds[0]), hi: SENSITIVITY_LIMIT };
}

function clampOffset(v: number, p: Phase = phase): number {
  const { lo, hi } = offsetBounds(p);
  return Math.max(lo, Math.min(hi, Math.round(v * 2) / 2));
}

// ---------- Aufbau ----------
for (const p of PHASES) {
  const opt = document.createElement('option');
  opt.value = p.id;
  opt.textContent = p.label;
  phaseSelect.append(opt);
}
phaseSelect.value = phase.id;

STAGES.forEach((s, i) => {
  const li = document.createElement('li');
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'chip';
  btn.style.setProperty('--c', s.color);
  btn.style.setProperty('--ink', s.ink);
  btn.textContent = s.label;
  btn.addEventListener('click', () => {
    if (mode === 'manual') setStage(i);
  });
  li.append(btn);
  legend.append(li);
});

/** dB über Grundpegel → Höhe im Pegelmesser in % (0 = unten). */
function toPercent(relDb: number): number {
  const { min, max } = METER_RANGE;
  return Math.max(0, Math.min(100, ((relDb - min) / (max - min)) * 100));
}

function fromPercent(pct: number): number {
  const { min, max } = METER_RANGE;
  return min + (pct / 100) * (max - min);
}

/** Farbzonen und Regler-Position an die wirksamen Schwellen anpassen. */
function buildZones(): void {
  const bounds = [METER_RANGE.min, ...thresholds(), METER_RANGE.max];
  const gradient = STAGES.map((s, i) => {
    const a = toPercent(bounds[i]);
    const b = toPercent(bounds[i + 1]);
    return `${s.color} ${a}% ${b}%`;
  }).join(', ');
  const bg = `linear-gradient(to top, ${gradient})`;
  zonesDim.style.background = bg;
  zonesLit.style.background = bg;

  const red = thresholds()[2];
  sensHandle.style.setProperty('--pos', String(toPercent(red) / 100));
  const { lo, hi } = offsetBounds(phase);
  sensHandle.setAttribute('aria-valuemin', String(phase.thresholds[2] + lo));
  sensHandle.setAttribute('aria-valuemax', String(phase.thresholds[2] + hi));
  sensHandle.setAttribute('aria-valuenow', String(red));
  sensHandle.setAttribute(
    'aria-valuetext',
    offset === 0 ? 'Standard' : offset > 0 ? `${offset} dB lockerer` : `${-offset} dB strenger`,
  );
  sensReset.hidden = offset === 0;
}

function setOffset(v: number): void {
  const next = clampOffset(v);
  if (next === offset) return;
  offset = next;
  saveOffset(phase, offset);
  buildZones();
}
buildZones();

// ---------- Schieberegler: Grenze „Zu laut!“ live verschieben ----------
// Ziehen am Griff oder Tippen irgendwo auf den Pegelmesser setzt die Grenze dorthin;
// die beiden unteren Grenzen wandern im gleichen Abstand mit.
let dragging = false;

function offsetFromPointer(clientY: number): number {
  const r = meterBar.getBoundingClientRect();
  const pct = ((r.bottom - clientY) / r.height) * 100;
  return fromPercent(pct) - phase.thresholds[2];
}

meter.addEventListener('pointerdown', (e) => {
  if (mode === 'manual') return;
  dragging = true;
  meter.setPointerCapture(e.pointerId);
  meter.classList.add('dragging');
  sensHandle.focus({ preventScroll: true });
  setOffset(offsetFromPointer(e.clientY));
});
meter.addEventListener('pointermove', (e) => {
  if (dragging) setOffset(offsetFromPointer(e.clientY));
});
const endDrag = (): void => {
  dragging = false;
  meter.classList.remove('dragging');
};
meter.addEventListener('pointerup', endDrag);
meter.addEventListener('pointercancel', endDrag);

sensHandle.addEventListener('keydown', (e) => {
  const step = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1, PageUp: 5, PageDown: -5 }[e.key];
  if (step !== undefined) setOffset(offset + step);
  else if (e.key === 'Home' || e.key === 'Escape') setOffset(0);
  else return;
  e.preventDefault();
});

sensReset.addEventListener('click', () => setOffset(0));

// ---------- Anzeige ----------
function setStage(i: number): void {
  if (i === currentStage) return;
  currentStage = i;
  const s = STAGES[i];
  app.dataset.stage = String(i);
  app.style.setProperty('--stage', s.color);
  app.style.setProperty('--stage-ink', s.ink);
  stageLabel.textContent = s.label;
  stageHint.textContent = s.hint;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', s.color);
  legend.querySelectorAll('.chip').forEach((el, k) => el.classList.toggle('active', k === i));
}

function setLevel(fastRel: number): void {
  const pct = toPercent(fastRel);
  zonesLit.style.clipPath = `inset(${100 - pct}% 0 0 0)`;
  // Scheibe „atmet“ ein wenig mit der Lautstärke mit.
  const scale = 1 + (pct / 100) * 0.08;
  disk.style.transform = `scale(${scale.toFixed(3)})`;
}

function render(st: TrackerState): void {
  setStage(st.stage);
  setLevel(st.fastRel);
}

// ---------- Messschleife ----------
let rafId = 0;
let lastT = 0;

// Messwerte zum Einstellen der Schwellen: Taste „D“ oder ?debug in der Adresse.
const debugEl = $<HTMLPreElement>('debug');
debugEl.hidden = !new URLSearchParams(location.search).has('debug');
let peakRel = -Infinity;
let lastDebugT = 0;

function showDebug(t: number, db: number, st: TrackerState): void {
  peakRel = Math.max(peakRel, st.fastRel);
  if (debugEl.hidden || t - lastDebugT < 150) return;
  lastDebugT = t;
  const [a, b, c] = thresholds();
  const f = (n: number) => (n >= 0 ? '+' : '') + n.toFixed(1);
  debugEl.textContent =
    `roh ${db.toFixed(1)} dBFS · Grundpegel ${tracker.baseline.toFixed(1)} dBFS\n` +
    `jetzt ${f(st.fastRel)} dB · geglättet ${f(st.slowRel)} dB · Spitze ${f(peakRel)} dB\n` +
    `Schwellen ${phase.label}${offset ? ` (${offset > 0 ? '+' : ''}${offset})` : ''}: ${a} / ${b} / ${c} dB · Stufe ${st.stage + 1}` +
    (st.pendingStage !== st.stage ? ` → ${st.pendingStage + 1} (${Math.round(st.pendingProgress * 100)} %)` : '');
}

function loop(t: number): void {
  const dt = lastT ? Math.min(t - lastT, 250) : 16;
  lastT = t;
  const db = mic.readDbfs();
  if (mode === 'live') {
    const st = tracker.update(db, t, dt, thresholds());
    render(st);
    showDebug(t, db, st);
  }
  rafId = requestAnimationFrame(loop);
}

async function calibrate(): Promise<void> {
  mode = 'calibrating';
  calibScreen.hidden = false;
  calibFill.style.width = '0%';
  const samples: number[] = [];
  const t0 = performance.now();

  await new Promise<void>((resolve) => {
    const tick = (): void => {
      const elapsed = performance.now() - t0;
      samples.push(mic.readDbfs());
      calibFill.style.width = `${Math.min(100, (elapsed / CALIBRATION_MS) * 100)}%`;
      if (elapsed >= CALIBRATION_MS) resolve();
      else setTimeout(tick, 50);
    };
    tick();
  });

  const baseline = Math.max(MIN_BASELINE_DB, median(samples));
  tracker.setBaseline(baseline);
  statusEl.textContent = `Grundpegel: ${baseline.toFixed(0)} dBFS · Phase: ${phase.label}`;
  calibScreen.hidden = true;
  mode = 'live';
}

// ---------- Start ----------
const ERROR_TEXT: Record<MicErrorKind, string> = {
  insecure: 'Das Mikrofon geht nur über eine sichere Verbindung (https).',
  denied:
    'Der Zugriff auf das Mikrofon wurde nicht erlaubt. Bitte in den Browser-Einstellungen freigeben – oder ohne Mikrofon starten.',
  notfound: 'Es wurde kein Mikrofon gefunden.',
  unknown: 'Das Mikrofon konnte nicht gestartet werden.',
};

$<HTMLButtonElement>('start-mic').addEventListener('click', async () => {
  startError.hidden = true;
  try {
    await mic.start();
  } catch (err) {
    startError.textContent = ERROR_TEXT[err instanceof MicError ? err.kind : 'unknown'];
    startError.hidden = false;
    return;
  }
  startScreen.hidden = true;
  app.classList.remove('manual');
  btnRecalibrate.hidden = false;
  setStage(0);
  void keepAwake();
  cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(loop);
  await calibrate();
});

$<HTMLButtonElement>('start-manual').addEventListener('click', () => {
  mode = 'manual';
  startScreen.hidden = true;
  app.classList.add('manual');
  btnRecalibrate.hidden = true;
  zonesLit.style.clipPath = 'inset(100% 0 0 0)';
  statusEl.textContent = 'Von Hand: Stufe antippen oder Tasten 1–4 drücken.';
  setStage(0);
  void keepAwake();
});

// ---------- Bedienelemente ----------
phaseSelect.addEventListener('change', () => {
  phase = PHASES.find((p) => p.id === phaseSelect.value) ?? phase;
  savePhase(phase);
  offset = loadOffset(phase);
  buildZones();
  if (mode === 'live') {
    statusEl.textContent = statusEl.textContent?.replace(/Phase: .*/, `Phase: ${phase.label}`) ?? '';
  }
});

btnRecalibrate.addEventListener('click', () => {
  if (mode === 'live') void calibrate();
});

btnFullscreen.addEventListener('click', () => {
  if (document.fullscreenElement) void document.exitFullscreen();
  else void document.documentElement.requestFullscreen?.().catch(() => {});
});
document.addEventListener('fullscreenchange', () => {
  btnFullscreen.textContent = document.fullscreenElement ? 'Vollbild beenden' : 'Vollbild';
});

document.addEventListener('keydown', (e) => {
  if (e.target instanceof HTMLSelectElement) return;
  if (e.key === 'd' || e.key === 'D') {
    debugEl.hidden = !debugEl.hidden;
    peakRel = -Infinity;
    return;
  }
  if (mode !== 'manual') return;
  const n = Number(e.key);
  if (n >= 1 && n <= STAGES.length) setStage(n - 1);
});

// ---------- Bildschirm wach halten (Smartboard/Tablet) ----------
let wakeLock: WakeLockSentinel | null = null;
async function keepAwake(): Promise<void> {
  try {
    wakeLock = (await navigator.wakeLock?.request('screen')) ?? null;
  } catch {
    wakeLock = null;
  }
}
document.addEventListener('visibilitychange', () => {
  // Der Browser gibt den Wake Lock beim Verstecken des Tabs automatisch frei.
  if (document.visibilityState === 'visible' && mode !== 'idle' && (!wakeLock || wakeLock.released)) {
    void keepAwake();
  }
});

setStage(0);
