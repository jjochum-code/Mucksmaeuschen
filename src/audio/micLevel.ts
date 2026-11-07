/**
 * Liest den Mikrofonpegel lokal über die Web Audio API.
 * Audio wird ausschließlich im Speicher analysiert – nie aufgezeichnet,
 * gespeichert oder übertragen.
 */
export const SILENCE_DBFS = -100;

export class MicLevel {
  private ctx: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private analyser: AnalyserNode | null = null;
  private buffer: Float32Array<ArrayBuffer> | null = null;

  /** Muss aus einem User-Klick heraus aufgerufen werden (Autoplay-Regeln). */
  async start(): Promise<void> {
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
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
      const name = err instanceof DOMException ? err.name : '';
      if (name === 'NotAllowedError' || name === 'SecurityError') throw new MicError('denied');
      if (name === 'NotFoundError' || name === 'OverconstrainedError') throw new MicError('notfound');
      throw new MicError('unknown');
    }

    this.ctx = new AudioContext();
    if (this.ctx.state === 'suspended') await this.ctx.resume();

    const source = this.ctx.createMediaStreamSource(this.stream);
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 2048; // ~43 ms bei 48 kHz
    source.connect(this.analyser); // bewusst NICHT an destination → kein Mithören
    this.buffer = new Float32Array(this.analyser.fftSize);
  }

  get running(): boolean {
    return this.analyser !== null;
  }

  /** Aktueller Pegel als dBFS (0 = Vollaussteuerung, typisch −70 … −20). */
  readDbfs(): number {
    if (!this.analyser || !this.buffer) return SILENCE_DBFS;
    this.analyser.getFloatTimeDomainData(this.buffer);
    let sum = 0;
    for (let i = 0; i < this.buffer.length; i++) {
      const s = this.buffer[i];
      sum += s * s;
    }
    const rms = Math.sqrt(sum / this.buffer.length);
    return rms > 0 ? Math.max(SILENCE_DBFS, 20 * Math.log10(rms)) : SILENCE_DBFS;
  }

  async stop(): Promise<void> {
    this.stream?.getTracks().forEach((t) => t.stop());
    await this.ctx?.close();
    this.ctx = null;
    this.stream = null;
    this.analyser = null;
    this.buffer = null;
  }
}

export type MicErrorKind = 'insecure' | 'denied' | 'notfound' | 'unknown';

export class MicError extends Error {
  constructor(public readonly kind: MicErrorKind) {
    super(kind);
  }
}
