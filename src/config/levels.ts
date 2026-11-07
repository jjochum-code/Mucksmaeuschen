/**
 * Stufen und Unterrichtsphasen – bewusst als Daten, damit sie später
 * aus JSON (z. B. Themenwelten) geladen oder angepasst werden können.
 */

export interface Stage {
  id: string;
  label: string;
  hint: string;
  color: string;
  /** Textfarbe auf color (Kontrast) */
  ink: string;
}

/** Vier Stufen von ruhig nach laut. (\u00AD = weiches Trennzeichen für den Zeilenumbruch) */
export const STAGES: readonly Stage[] = [
  { id: 'still', label: 'Mucksmäuschen\u00ADstill', hint: 'Super! So bleibt es.', color: '#2f9e57', ink: '#ffffff' },
  { id: 'leise', label: 'Leise', hint: 'Gut – noch ein bisschen leiser?', color: '#e6b81e', ink: '#2b2100' },
  { id: 'laut', label: 'Etwas laut', hint: 'Bitte leiser werden.', color: '#ee7d1f', ink: '#2b1400' },
  { id: 'zulaut', label: 'Zu laut!', hint: 'Stopp – jetzt ganz leise.', color: '#d93a2b', ink: '#ffffff' },
];

export interface Phase {
  id: string;
  label: string;
  /**
   * Drei aufsteigende Schwellen in dB ÜBER dem kalibrierten Grundpegel.
   * Ab Schwelle 1 → Stufe 2, ab Schwelle 2 → Stufe 3, ab Schwelle 3 → Stufe 4.
   */
  thresholds: readonly [number, number, number];
}

export const PHASES: readonly Phase[] = [
  { id: 'stillarbeit', label: 'Stillarbeit', thresholds: [5, 11, 17] },
  { id: 'unterricht', label: 'Unterricht', thresholds: [9, 16, 23] },
  { id: 'gruppenarbeit', label: 'Gruppenarbeit', thresholds: [14, 21, 28] },
];

export const DEFAULT_PHASE_ID = 'unterricht';

/** Anzeigebereich des Pegelmessers in dB relativ zum Grundpegel. */
export const METER_RANGE = { min: -3, max: 40 } as const;

/** Wie weit der Schieberegler die Schwellen einer Phase verschieben darf (dB). */
export const SENSITIVITY_LIMIT = 12;

/** Die unterste Grenze bleibt mindestens so weit über dem Grundpegel – sonst gäbe es kein Grün mehr. */
export const MIN_FIRST_THRESHOLD = 3;

/** Dauer der Grundpegel-Messung. */
export const CALIBRATION_MS = 4000;
