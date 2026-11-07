/*
 * Mucksmäuschen – Konfiguration
 * Stufen und Unterrichtsphasen bewusst als Daten, damit sie später
 * aus JSON (z. B. Themenwelten) geladen oder angepasst werden können.
 */
'use strict';

window.MM = window.MM || {};

MM.config = {
  /**
   * Vier Stufen von ruhig nach laut.
   * color = Farbe der Stufe, ink = Textfarbe darauf (Kontrast).
   * ­ = weiches Trennzeichen für den Zeilenumbruch.
   */
  STAGES: [
    { id: 'still', label: 'Mucksmäuschen­still', hint: 'Super! So bleibt es.', color: '#2f9e57', ink: '#ffffff' },
    { id: 'leise', label: 'Leise', hint: 'Gut – noch ein bisschen leiser?', color: '#e6b81e', ink: '#2b2100' },
    { id: 'laut', label: 'Etwas laut', hint: 'Bitte leiser werden.', color: '#ee7d1f', ink: '#2b1400' },
    { id: 'zulaut', label: 'Zu laut!', hint: 'Stopp – jetzt ganz leise.', color: '#d93a2b', ink: '#ffffff' },
  ],

  /**
   * Unterrichtsphasen. thresholds = drei aufsteigende Schwellen in dB ÜBER dem
   * kalibrierten Grundpegel: ab Schwelle 1 → Stufe 2, ab 2 → Stufe 3, ab 3 → Stufe 4.
   */
  PHASES: [
    { id: 'stillarbeit', label: 'Stillarbeit', thresholds: [5, 11, 17] },
    { id: 'unterricht', label: 'Unterricht', thresholds: [9, 16, 23] },
    { id: 'gruppenarbeit', label: 'Gruppenarbeit', thresholds: [14, 21, 28] },
  ],

  DEFAULT_PHASE_ID: 'unterricht',

  /** Anzeigebereich des Pegelmessers in dB relativ zum Grundpegel. */
  METER_RANGE: { min: -3, max: 40 },

  /** Wie weit der Schieberegler die Schwellen einer Phase verschieben darf (dB). */
  SENSITIVITY_LIMIT: 12,

  /** Die unterste Grenze bleibt mindestens so weit über dem Grundpegel – sonst gäbe es kein Grün mehr. */
  MIN_FIRST_THRESHOLD: 3,

  /** Dauer der Grundpegel-Messung (ms). */
  CALIBRATION_MS: 4000,

  /** Untergrenze für den Grundpegel – sonst wirkt in sehr stillen Räumen jedes Rascheln riesig. */
  MIN_BASELINE_DB: -70,
};
