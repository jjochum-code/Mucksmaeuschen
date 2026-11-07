import './style.css';
import { MicLevel, MicError, type MicErrorKind } from './audio/micLevel';
import { LoudnessTracker, median, type TrackerState } from './audio/loudness';
import {
  STAGES,
  PHASES,
  DEFAULT_PHASE_ID,
  CALIBRATION_MS,
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
const legend = $<HTMLOListElement>('legend');
const statusEl = $<HTMLParagraphElement>('status');
const startScreen = $<HTMLElement>('start-screen');
const startError = $<HTMLParagraphElement>('start-error');
const calibScreen = $<HTMLElement>('calib-screen');
const calibFill = $<HTMLDivElement>('calib-fill');
const rewardsOpen = $<HTMLButtonElement>('rewards-open');
const rewardsClose = $<HTMLButtonElement>('rewards-close');
const rewardScreen = $<HTMLElement>('reward-screen');
const starBadge = $<HTMLSpanElement>('star-badge');
const starCount = $<HTMLElement>('star-count');
const rewardMessage = $<HTMLParagraphElement>('reward-message');
const flowerCount = $<HTMLParagraphElement>('flower-count');
const quietTimer = $<HTMLSpanElement>('quiet-timer');
const meadow = $<HTMLDivElement>('meadow');
const rewardProgress = $<HTMLDivElement>('reward-progress');
const rewardProgressFill = $<HTMLDivElement>('reward-progress-fill');
const animalGrid = $<HTMLDivElement>('animal-grid');

// ---------- Zustand ----------
type Mode = 'idle' | 'calibrating' | 'live' | 'manual';
let mode: Mode = 'idle';
let phase: Phase = loadPhase();
let currentStage = -1;

const mic = new MicLevel();
const tracker = new LoudnessTracker(-60);
/** Untergrenze für den Grundpegel – sonst wirkt in sehr stillen Räumen jedes Rascheln riesig. */
const MIN_BASELINE_DB = -70;
const QUIET_STAR_MS = 60_000;

const ANIMALS = [
  { id: 'rabbit', name: 'Hoppel', kind: 'Hase', emoji: '🐰', cost: 3 },
  { id: 'fox', name: 'Fuchs', kind: 'Fuchs', emoji: '🦊', cost: 5 },
  { id: 'owl', name: 'Oskar', kind: 'Eule', emoji: '🦉', cost: 8 },
] as const;

interface RewardState {
  stars: number;
  flowers: number;
  unlocked: string[];
}

function loadRewards(): RewardState {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem('mm.rewards') ?? 'null');
    if (typeof saved === 'object' && saved !== null) {
      const data = saved as Partial<RewardState>;
      return {
        stars: Number.isSafeInteger(data.stars) && (data.stars ?? -1) >= 0 ? data.stars! : 0,
        flowers: Number.isSafeInteger(data.flowers) && (data.flowers ?? -1) >= 0 ? data.flowers! : 0,
        unlocked: Array.isArray(data.unlocked)
          ? data.unlocked.filter((id): id is string => ANIMALS.some((animal) => animal.id === id))
          : [],
      };
    }
  } catch {
    /* Speicher kann im privaten Modus oder bei defekten Daten fehlen. */
  }
  return { stars: 0, flowers: 0, unlocked: [] };
}

const rewards = loadRewards();
let quietMs = 0;
let lastRewardRender = 0;

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

function saveRewards(): void {
  try {
    localStorage.setItem('mm.rewards', JSON.stringify(rewards));
  } catch {
    /* Belohnungen funktionieren auch ohne dauerhaften Speicher. */
  }
}

function buildRewardPanel(): void {
  for (let i = 0; i < 12; i++) {
    const flower = document.createElement('span');
    flower.className = 'flower';
    flower.textContent = '🌱';
    flower.setAttribute('aria-hidden', 'true');
    meadow.append(flower);
  }

  for (const animal of ANIMALS) {
    const card = document.createElement('article');
    card.className = 'animal-card';
    card.dataset.animal = animal.id;

    const icon = document.createElement('span');
    icon.className = 'animal-icon';
    icon.textContent = animal.emoji;
    icon.setAttribute('aria-hidden', 'true');

    const details = document.createElement('div');
    details.className = 'animal-details';
    const name = document.createElement('h4');
    name.textContent = animal.name;
    const kind = document.createElement('p');
    kind.textContent = animal.kind;
    details.append(name, kind);

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn animal-unlock';
    button.addEventListener('click', () => {
      if (rewards.stars < animal.cost || rewards.unlocked.includes(animal.id)) return;
      rewards.stars -= animal.cost;
      rewards.unlocked.push(animal.id);
      saveRewards();
      renderRewards();
    });

    card.append(icon, details, button);
    animalGrid.append(card);
  }
}

function renderRewards(): void {
  starBadge.textContent = `${rewards.stars} ⭐`;
  starCount.textContent = String(rewards.stars);
  const grownFlowers = Math.min(rewards.flowers, meadow.children.length);
  meadow.querySelectorAll<HTMLElement>('.flower').forEach((flower, index) => {
    const grown = index < grownFlowers;
    flower.classList.toggle('grown', grown);
    flower.textContent = grown ? (index % 2 === 0 ? '🌼' : '🌷') : '🌱';
  });
  meadow.setAttribute(
    'aria-label',
    `Eine Wiese mit ${rewards.flowers} gewachsenen Blumen${rewards.flowers > 12 ? ', mindestens zwölf sind zu sehen' : ''}`,
  );
  flowerCount.textContent = rewards.flowers === 0
    ? 'Noch keine Blumen – die erste wächst bald!'
    : `${rewards.flowers} ${rewards.flowers === 1 ? 'Blume' : 'Blumen'} wachsen auf eurer Wiese.`;

  for (const animal of ANIMALS) {
    const card = animalGrid.querySelector<HTMLElement>(`[data-animal="${animal.id}"]`);
    const button = card?.querySelector<HTMLButtonElement>('.animal-unlock');
    const unlocked = rewards.unlocked.includes(animal.id);
    card?.classList.toggle('unlocked', unlocked);
    if (button) {
      button.disabled = unlocked || rewards.stars < animal.cost;
      button.textContent = unlocked ? 'Freigeschaltet ✓' : `Freischalten · ${animal.cost} ⭐`;
    }
  }
}

function updateRewardProgress(t: number, dt: number): void {
  if (currentStage === 0 && (mode === 'live' || mode === 'manual')) {
    quietMs += dt;
    while (quietMs >= QUIET_STAR_MS) {
      quietMs -= QUIET_STAR_MS;
      rewards.stars++;
      rewards.flowers++;
      saveRewards();
      renderRewards();
      rewardMessage.textContent = 'Eine neue Blume ist gewachsen – ihr habt einen Stern verdient!';
    }
  }

  if (t - lastRewardRender < 150) return;
  lastRewardRender = t;
  const seconds = Math.floor(quietMs / 1000);
  quietTimer.textContent = `🌱 ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')} / 1:00`;
  rewardProgressFill.style.width = `${(quietMs / QUIET_STAR_MS) * 100}%`;
  rewardProgress.setAttribute('aria-valuenow', String(seconds));
  rewardMessage.textContent = currentStage === 0
    ? 'Toll, ihr seid mucksmäuschenstill – eure nächste Blume wächst!'
    : 'Werdet wieder mucksmäuschenstill, damit eure Blume weiterwächst.';
}

buildRewardPanel();
renderRewards();

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

/** Messbereich der Anzeige in dB relativ zum Grundpegel. */
function meterRange(): { min: number; max: number } {
  return { min: -3, max: phase.thresholds[2] + 9 };
}

function toPercent(relDb: number): number {
  const { min, max } = meterRange();
  return Math.max(0, Math.min(100, ((relDb - min) / (max - min)) * 100));
}

function buildZones(): void {
  const bounds = [meterRange().min, ...phase.thresholds, meterRange().max];
  const gradient = STAGES.map((s, i) => {
    const a = toPercent(bounds[i]);
    const b = toPercent(bounds[i + 1]);
    return `${s.color} ${a}% ${b}%`;
  }).join(', ');
  const bg = `linear-gradient(to right, ${gradient})`;
  zonesDim.style.background = bg;
  zonesLit.style.background = bg;
}
buildZones();

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
  zonesLit.style.clipPath = `inset(0 ${100 - pct}% 0 0)`;
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
  const [a, b, c] = phase.thresholds;
  const f = (n: number) => (n >= 0 ? '+' : '') + n.toFixed(1);
  debugEl.textContent =
    `roh ${db.toFixed(1)} dBFS · Grundpegel ${tracker.baseline.toFixed(1)} dBFS\n` +
    `jetzt ${f(st.fastRel)} dB · geglättet ${f(st.slowRel)} dB · Spitze ${f(peakRel)} dB\n` +
    `Schwellen ${phase.label}: ${a} / ${b} / ${c} dB · Stufe ${st.stage + 1}` +
    (st.pendingStage !== st.stage ? ` → ${st.pendingStage + 1} (${Math.round(st.pendingProgress * 100)} %)` : '');
}

function loop(t: number): void {
  const dt = lastT ? Math.min(t - lastT, 250) : 16;
  lastT = t;
  const db = mic.readDbfs();
  if (mode === 'live') {
    const st = tracker.update(db, t, dt, phase.thresholds);
    render(st);
    showDebug(t, db, st);
    updateRewardProgress(t, dt);
  } else if (mode === 'manual') {
    updateRewardProgress(t, dt);
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
  zonesLit.style.clipPath = 'inset(0 100% 0 0)';
  statusEl.textContent = 'Von Hand: Stufe antippen oder Tasten 1–4 drücken.';
  setStage(0);
  void keepAwake();
  cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(loop);
});

// ---------- Bedienelemente ----------
phaseSelect.addEventListener('change', () => {
  phase = PHASES.find((p) => p.id === phaseSelect.value) ?? phase;
  savePhase(phase);
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

rewardsOpen.addEventListener('click', () => {
  rewardScreen.hidden = false;
  rewardsClose.focus();
});
rewardsClose.addEventListener('click', () => {
  rewardScreen.hidden = true;
  rewardsOpen.focus();
});
rewardScreen.addEventListener('click', (event) => {
  if (event.target === rewardScreen) {
    rewardScreen.hidden = true;
    rewardsOpen.focus();
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !rewardScreen.hidden) {
    rewardScreen.hidden = true;
    rewardsOpen.focus();
    return;
  }
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
