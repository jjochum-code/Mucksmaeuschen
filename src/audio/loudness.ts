/**
 * Glättung und Stufen-Logik. Reine Rechenlogik ohne DOM/Audio,
 * damit sie später leicht getestet werden kann.
 */

/** Exponentieller gleitender Mittelwert mit Zeitkonstante tau (ms). */
export function ema(prev: number | null, value: number, dtMs: number, tauMs: number): number {
  if (prev === null) return value;
  const alpha = 1 - Math.exp(-dtMs / tauMs);
  return prev + alpha * (value - prev);
}

/** Median – robust gegen einzelne Ausreißer während der Kalibrierung. */
export function median(values: number[]): number {
  if (values.length === 0) return NaN;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/** Wie viele Schwellen (aufsteigend sortiert) überschritten sind → 0 … thresholds.length */
export function stageFor(relDb: number, thresholds: readonly number[]): number {
  let stage = 0;
  for (const t of thresholds) if (relDb >= t) stage++;
  return stage;
}

export interface TrackerOptions {
  /** Glättung für die sichtbare Pegelanzeige (reagiert flott). */
  fastTauMs: number;
  /** Glättung für die Stufenbewertung (reagiert träge). */
  slowTauMs: number;
  /** So lange muss eine höhere Stufe anliegen, bevor sie gilt (Husten, Stühlerücken). */
  holdUpMs: number;
  /** So lange muss eine niedrigere Stufe anliegen, bevor sie gilt. */
  holdDownMs: number;
}

export const DEFAULT_TRACKER: TrackerOptions = {
  fastTauMs: 120,
  slowTauMs: 900,
  holdUpMs: 1500,
  holdDownMs: 1200,
};

export interface TrackerState {
  /** geglätteter Pegel relativ zum Grundpegel (dB) – für die Anzeige */
  fastRel: number;
  /** träge geglätteter Pegel relativ zum Grundpegel (dB) – für die Bewertung */
  slowRel: number;
  /** aktuell gültige Stufe */
  stage: number;
  /** Stufe, die gerade „anklopft“, aber noch nicht lange genug anliegt */
  pendingStage: number;
  /** Fortschritt 0…1 bis der Wechsel zu pendingStage greift */
  pendingProgress: number;
}

export class LoudnessTracker {
  private fast: number | null = null;
  private slow: number | null = null;
  private stage = 0;
  private candidate = 0;
  private candidateSince = 0;

  constructor(
    private baselineDb: number,
    private readonly opts: TrackerOptions = DEFAULT_TRACKER,
  ) {}

  get baseline(): number {
    return this.baselineDb;
  }

  setBaseline(db: number): void {
    this.baselineDb = db;
    this.reset();
  }

  reset(): void {
    this.fast = this.slow = null;
    this.stage = this.candidate = 0;
    this.candidateSince = 0;
  }

  update(dbfs: number, nowMs: number, dtMs: number, thresholds: readonly number[]): TrackerState {
    this.fast = ema(this.fast, dbfs, dtMs, this.opts.fastTauMs);
    this.slow = ema(this.slow, dbfs, dtMs, this.opts.slowTauMs);

    const slowRel = this.slow - this.baselineDb;
    const target = stageFor(slowRel, thresholds);

    if (target !== this.candidate) {
      this.candidate = target;
      this.candidateSince = nowMs;
    }

    let pendingProgress = 0;
    if (this.candidate !== this.stage) {
      const hold = this.candidate > this.stage ? this.opts.holdUpMs : this.opts.holdDownMs;
      const elapsed = nowMs - this.candidateSince;
      pendingProgress = Math.min(1, elapsed / hold);
      if (elapsed >= hold) {
        this.stage = this.candidate;
        pendingProgress = 0;
      }
    }

    return {
      fastRel: this.fast - this.baselineDb,
      slowRel,
      stage: this.stage,
      pendingStage: this.candidate,
      pendingProgress,
    };
  }
}
