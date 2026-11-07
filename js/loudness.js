/*
 * Mucksmäuschen – Glättung und Stufen-Logik.
 * Reine Rechenlogik ohne DOM/Audio, damit sie leicht getestet werden kann.
 */
'use strict';

window.MM = window.MM || {};

(function () {
  /** Exponentieller gleitender Mittelwert mit Zeitkonstante tauMs. */
  function ema(prev, value, dtMs, tauMs) {
    if (prev === null) return value;
    var alpha = 1 - Math.exp(-dtMs / tauMs);
    return prev + alpha * (value - prev);
  }

  /** Median – robust gegen einzelne Ausreißer während der Kalibrierung. */
  function median(values) {
    if (values.length === 0) return NaN;
    var sorted = values.slice().sort(function (a, b) { return a - b; });
    var mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  /** Wie viele (aufsteigende) Schwellen überschritten sind → 0 … thresholds.length */
  function stageFor(relDb, thresholds) {
    var stage = 0;
    for (var i = 0; i < thresholds.length; i++) if (relDb >= thresholds[i]) stage++;
    return stage;
  }

  var DEFAULT_TRACKER = {
    fastTauMs: 120,   // Glättung für die sichtbare Pegelanzeige (reagiert flott)
    slowTauMs: 900,   // Glättung für die Stufenbewertung (reagiert träge)
    holdUpMs: 1500,   // so lange muss eine höhere Stufe anliegen (Husten, Stühlerücken)
    holdDownMs: 1200, // so lange muss eine niedrigere Stufe anliegen
  };

  /**
   * Verfolgt den Pegel relativ zum Grundpegel und entscheidet die Stufe
   * mit Verzögerung, damit kurze Geräusche nichts auslösen.
   */
  class LoudnessTracker {
    constructor(baselineDb, opts) {
      this.baselineDb = baselineDb;
      this.opts = opts || DEFAULT_TRACKER;
      this.reset();
    }

    get baseline() {
      return this.baselineDb;
    }

    setBaseline(db) {
      this.baselineDb = db;
      this.reset();
    }

    reset() {
      this.fast = null;
      this.slow = null;
      this.stage = 0;
      this.candidate = 0;
      this.candidateSince = 0;
    }

    /**
     * @returns {{fastRel:number, slowRel:number, stage:number, pendingStage:number, pendingProgress:number}}
     *   fastRel/slowRel = geglätteter Pegel über Grundpegel (dB),
     *   stage = gültige Stufe, pendingStage = „anklopfende“ Stufe, pendingProgress = 0…1
     */
    update(dbfs, nowMs, dtMs, thresholds) {
      this.fast = ema(this.fast, dbfs, dtMs, this.opts.fastTauMs);
      this.slow = ema(this.slow, dbfs, dtMs, this.opts.slowTauMs);

      var slowRel = this.slow - this.baselineDb;
      var target = stageFor(slowRel, thresholds);

      if (target !== this.candidate) {
        this.candidate = target;
        this.candidateSince = nowMs;
      }

      var pendingProgress = 0;
      if (this.candidate !== this.stage) {
        var hold = this.candidate > this.stage ? this.opts.holdUpMs : this.opts.holdDownMs;
        var elapsed = nowMs - this.candidateSince;
        pendingProgress = Math.min(1, elapsed / hold);
        if (elapsed >= hold) {
          this.stage = this.candidate;
          pendingProgress = 0;
        }
      }

      return {
        fastRel: this.fast - this.baselineDb,
        slowRel: slowRel,
        stage: this.stage,
        pendingStage: this.candidate,
        pendingProgress: pendingProgress,
      };
    }
  }

  MM.loudness = { ema: ema, median: median, stageFor: stageFor, DEFAULT_TRACKER: DEFAULT_TRACKER, LoudnessTracker: LoudnessTracker };
})();
