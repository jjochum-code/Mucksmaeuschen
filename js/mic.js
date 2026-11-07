/*
 * Mucksmäuschen – Mikrofonpegel über die Web Audio API.
 * Audio wird ausschließlich im Speicher analysiert – nie aufgezeichnet,
 * gespeichert oder übertragen.
 */
'use strict';

window.MM = window.MM || {};

(function () {
  var SILENCE_DBFS = -100;

  /** Fehler mit kind: 'insecure' | 'denied' | 'notfound' | 'unknown' */
  class MicError extends Error {
    constructor(kind) {
      super(kind);
      this.kind = kind;
    }
  }

  class MicLevel {
    constructor() {
      this.ctx = null;
      this.stream = null;
      this.analyser = null;
      this.buffer = null;
    }

    /** Muss aus einem User-Klick heraus aufgerufen werden (Autoplay-Regeln). */
    async start() {
      if (!window.isSecureContext || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new MicError('insecure');
      }
      try {
        this.stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            // Rohsignal: Browser-„Verbesserungen“ würden den Pegel verfälschen.
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
          },
          video: false,
        });
      } catch (err) {
        var name = err && err.name;
        if (name === 'NotAllowedError' || name === 'SecurityError') throw new MicError('denied');
        if (name === 'NotFoundError' || name === 'OverconstrainedError') throw new MicError('notfound');
        throw new MicError('unknown');
      }

      var AC = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AC();
      if (this.ctx.state === 'suspended') await this.ctx.resume();

      var source = this.ctx.createMediaStreamSource(this.stream);
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 2048; // ~43 ms bei 48 kHz
      source.connect(this.analyser); // bewusst NICHT an destination → kein Mithören
      this.buffer = new Float32Array(this.analyser.fftSize);
    }

    get running() {
      return this.analyser !== null;
    }

    /** Aktueller Pegel als dBFS (0 = Vollaussteuerung, typisch −70 … −20). */
    readDbfs() {
      if (!this.analyser) return SILENCE_DBFS;
      this.analyser.getFloatTimeDomainData(this.buffer);
      var sum = 0;
      for (var i = 0; i < this.buffer.length; i++) {
        var s = this.buffer[i];
        sum += s * s;
      }
      var rms = Math.sqrt(sum / this.buffer.length);
      return rms > 0 ? Math.max(SILENCE_DBFS, 20 * Math.log10(rms)) : SILENCE_DBFS;
    }

    async stop() {
      if (this.stream) this.stream.getTracks().forEach(function (t) { t.stop(); });
      if (this.ctx) await this.ctx.close();
      this.ctx = null;
      this.stream = null;
      this.analyser = null;
      this.buffer = null;
    }
  }

  MM.MicLevel = MicLevel;
  MM.MicError = MicError;
  MM.SILENCE_DBFS = SILENCE_DBFS;
})();
