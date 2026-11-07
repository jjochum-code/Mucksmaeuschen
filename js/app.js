/*
 * Mucksmäuschen – Oberfläche und Ablauf.
 * Benötigt (in dieser Reihenfolge geladen): config.js, loudness.js, mic.js
 */
'use strict';

(function () {
  var cfg = MM.config;
  var STAGES = cfg.STAGES;
  var PHASES = cfg.PHASES;
  var METER_RANGE = cfg.METER_RANGE;

  // ---------- DOM ----------
  function $(id) {
    return document.getElementById(id);
  }

  var app = $('app');
  var phaseSelect = $('phase');
  var btnRecalibrate = $('recalibrate');
  var btnFullscreen = $('fullscreen');
  var disk = $('disk');
  var stageLabel = $('stage-label');
  var stageHint = $('stage-hint');
  var zonesDim = $('zones-dim');
  var zonesLit = $('zones-lit');
  var meter = $('meter');
  var meterBar = $('meter-bar');
  var sensHandle = $('sens-handle');
  var sensReset = $('sens-reset');
  var legend = $('legend');
  var statusEl = $('status');
  var startScreen = $('start-screen');
  var startError = $('start-error');
  var calibScreen = $('calib-screen');
  var calibFill = $('calib-fill');
  var debugEl = $('debug');

  // ---------- Zustand ----------
  /** 'idle' | 'calibrating' | 'live' | 'manual' */
  var mode = 'idle';
  var phase = loadPhase();
  var currentStage = -1;
  /** Live-Verschiebung der Phasen-Schwellen per Schieberegler (dB, + = lockerer). */
  var offset = loadOffset(phase);

  var mic = new MM.MicLevel();
  var tracker = new MM.loudness.LoudnessTracker(-60);

  /** Wirksame Schwellen = Phase + Schieberegler. */
  function thresholds() {
    return phase.thresholds.map(function (t) { return t + offset; });
  }

  // ---------- Persistenz (nur Komfort, darf fehlschlagen) ----------
  function store(key, value) {
    try {
      if (value === undefined) return localStorage.getItem(key);
      localStorage.setItem(key, value);
    } catch (e) {
      /* privater Modus o. Ä. */
    }
    return null;
  }

  function findPhase(id) {
    for (var i = 0; i < PHASES.length; i++) if (PHASES[i].id === id) return PHASES[i];
    return null;
  }

  function loadPhase() {
    return findPhase(store('mm.phase')) || findPhase(cfg.DEFAULT_PHASE_ID) || PHASES[0];
  }

  function loadOffset(p) {
    var v = Number(store('mm.offset.' + p.id));
    return Number.isFinite(v) ? clampOffset(v, p) : 0;
  }

  /** Erlaubter Bereich des Schiebereglers für eine Phase. */
  function offsetBounds(p) {
    return {
      lo: Math.max(-cfg.SENSITIVITY_LIMIT, cfg.MIN_FIRST_THRESHOLD - p.thresholds[0]),
      hi: cfg.SENSITIVITY_LIMIT,
    };
  }

  function clampOffset(v, p) {
    var b = offsetBounds(p || phase);
    return Math.max(b.lo, Math.min(b.hi, Math.round(v * 2) / 2));
  }

  // ---------- Aufbau ----------
  PHASES.forEach(function (p) {
    var opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = p.label;
    phaseSelect.appendChild(opt);
  });
  phaseSelect.value = phase.id;

  STAGES.forEach(function (s, i) {
    var li = document.createElement('li');
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'chip';
    btn.style.setProperty('--c', s.color);
    btn.style.setProperty('--ink', s.ink);
    btn.textContent = s.label;
    btn.addEventListener('click', function () {
      if (mode === 'manual') setStage(i);
    });
    li.appendChild(btn);
    legend.appendChild(li);
  });

  /** dB über Grundpegel → Höhe im Pegelmesser in % (0 = unten). */
  function toPercent(relDb) {
    var pct = ((relDb - METER_RANGE.min) / (METER_RANGE.max - METER_RANGE.min)) * 100;
    return Math.max(0, Math.min(100, pct));
  }

  function fromPercent(pct) {
    return METER_RANGE.min + (pct / 100) * (METER_RANGE.max - METER_RANGE.min);
  }

  /** Farbzonen und Regler-Position an die wirksamen Schwellen anpassen. */
  function buildZones() {
    var th = thresholds();
    var bounds = [METER_RANGE.min].concat(th, [METER_RANGE.max]);
    var gradient = STAGES.map(function (s, i) {
      return s.color + ' ' + toPercent(bounds[i]) + '% ' + toPercent(bounds[i + 1]) + '%';
    }).join(', ');
    var bg = 'linear-gradient(to top, ' + gradient + ')';
    zonesDim.style.background = bg;
    zonesLit.style.background = bg;

    var red = th[2];
    var b = offsetBounds(phase);
    sensHandle.style.setProperty('--pos', String(toPercent(red) / 100));
    sensHandle.setAttribute('aria-valuemin', String(phase.thresholds[2] + b.lo));
    sensHandle.setAttribute('aria-valuemax', String(phase.thresholds[2] + b.hi));
    sensHandle.setAttribute('aria-valuenow', String(red));
    sensHandle.setAttribute(
      'aria-valuetext',
      offset === 0 ? 'Standard' : offset > 0 ? offset + ' dB lockerer' : -offset + ' dB strenger'
    );
    sensReset.hidden = offset === 0;
  }

  function setOffset(v) {
    var next = clampOffset(v);
    if (next === offset) return;
    offset = next;
    store('mm.offset.' + phase.id, String(offset));
    buildZones();
  }
  buildZones();

  // ---------- Schieberegler: Grenze „Zu laut!“ live verschieben ----------
  // Ziehen am Griff oder Tippen irgendwo auf den Pegelmesser setzt die Grenze dorthin;
  // die beiden unteren Grenzen wandern im gleichen Abstand mit.
  var dragging = false;

  function offsetFromPointer(clientY) {
    var r = meterBar.getBoundingClientRect();
    var pct = ((r.bottom - clientY) / r.height) * 100;
    return fromPercent(pct) - phase.thresholds[2];
  }

  meter.addEventListener('pointerdown', function (e) {
    if (mode === 'manual') return;
    dragging = true;
    meter.setPointerCapture(e.pointerId);
    meter.classList.add('dragging');
    sensHandle.focus({ preventScroll: true });
    setOffset(offsetFromPointer(e.clientY));
  });
  meter.addEventListener('pointermove', function (e) {
    if (dragging) setOffset(offsetFromPointer(e.clientY));
  });
  function endDrag() {
    dragging = false;
    meter.classList.remove('dragging');
  }
  meter.addEventListener('pointerup', endDrag);
  meter.addEventListener('pointercancel', endDrag);

  var KEY_STEPS = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1, PageUp: 5, PageDown: -5 };
  sensHandle.addEventListener('keydown', function (e) {
    if (e.key in KEY_STEPS) setOffset(offset + KEY_STEPS[e.key]);
    else if (e.key === 'Home' || e.key === 'Escape') setOffset(0);
    else return;
    e.preventDefault();
  });

  sensReset.addEventListener('click', function () {
    setOffset(0);
  });

  // ---------- Anzeige ----------
  function setStage(i) {
    if (i === currentStage) return;
    currentStage = i;
    var s = STAGES[i];
    app.dataset.stage = String(i);
    app.style.setProperty('--stage', s.color);
    app.style.setProperty('--stage-ink', s.ink);
    stageLabel.textContent = s.label;
    stageHint.textContent = s.hint;
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', s.color);
    var chips = legend.querySelectorAll('.chip');
    for (var k = 0; k < chips.length; k++) chips[k].classList.toggle('active', k === i);
  }

  function setLevel(fastRel) {
    var pct = toPercent(fastRel);
    zonesLit.style.clipPath = 'inset(' + (100 - pct) + '% 0 0 0)';
    // Scheibe „atmet“ ein wenig mit der Lautstärke mit.
    disk.style.transform = 'scale(' + (1 + (pct / 100) * 0.08).toFixed(3) + ')';
  }

  // ---------- Messwerte zum Einstellen: Taste „D“ oder ?debug in der Adresse ----------
  debugEl.hidden = !/[?&]debug\b/.test(location.search);
  var peakRel = -Infinity;
  var lastDebugT = 0;

  function signed(n) {
    return (n >= 0 ? '+' : '') + n.toFixed(1);
  }

  function showDebug(t, db, st) {
    peakRel = Math.max(peakRel, st.fastRel);
    if (debugEl.hidden || t - lastDebugT < 150) return;
    lastDebugT = t;
    var th = thresholds();
    var shift = offset ? ' (' + (offset > 0 ? '+' : '') + offset + ')' : '';
    var pending =
      st.pendingStage !== st.stage
        ? ' → ' + (st.pendingStage + 1) + ' (' + Math.round(st.pendingProgress * 100) + ' %)'
        : '';
    debugEl.textContent =
      'roh ' + db.toFixed(1) + ' dBFS · Grundpegel ' + tracker.baseline.toFixed(1) + ' dBFS\n' +
      'jetzt ' + signed(st.fastRel) + ' dB · geglättet ' + signed(st.slowRel) + ' dB · Spitze ' + signed(peakRel) + ' dB\n' +
      'Schwellen ' + phase.label + shift + ': ' + th.join(' / ') + ' dB · Stufe ' + (st.stage + 1) + pending;
  }

  // ---------- Messschleife ----------
  var rafId = 0;
  var lastT = 0;

  function loop(t) {
    var dt = lastT ? Math.min(t - lastT, 250) : 16;
    lastT = t;
    var db = mic.readDbfs();
    if (mode === 'live') {
      var st = tracker.update(db, t, dt, thresholds());
      setStage(st.stage);
      setLevel(st.fastRel);
      showDebug(t, db, st);
    }
    rafId = requestAnimationFrame(loop);
  }

  function calibrate() {
    mode = 'calibrating';
    calibScreen.hidden = false;
    calibFill.style.width = '0%';
    var samples = [];
    var t0 = performance.now();

    return new Promise(function (resolve) {
      function tick() {
        var elapsed = performance.now() - t0;
        samples.push(mic.readDbfs());
        calibFill.style.width = Math.min(100, (elapsed / cfg.CALIBRATION_MS) * 100) + '%';
        if (elapsed < cfg.CALIBRATION_MS) {
          setTimeout(tick, 50);
          return;
        }
        var baseline = Math.max(cfg.MIN_BASELINE_DB, MM.loudness.median(samples));
        tracker.setBaseline(baseline);
        statusEl.textContent = 'Grundpegel: ' + baseline.toFixed(0) + ' dBFS · Phase: ' + phase.label;
        calibScreen.hidden = true;
        mode = 'live';
        resolve();
      }
      tick();
    });
  }

  // ---------- Start ----------
  var ERROR_TEXT = {
    insecure: 'Das Mikrofon geht nur über eine sichere Verbindung (https).',
    denied:
      'Der Zugriff auf das Mikrofon wurde nicht erlaubt. Bitte in den Browser-Einstellungen freigeben – oder ohne Mikrofon starten.',
    notfound: 'Es wurde kein Mikrofon gefunden.',
    unknown: 'Das Mikrofon konnte nicht gestartet werden.',
  };

  $('start-mic').addEventListener('click', function () {
    startError.hidden = true;
    mic.start().then(
      function () {
        startScreen.hidden = true;
        app.classList.remove('manual');
        btnRecalibrate.hidden = false;
        setStage(0);
        keepAwake();
        cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(loop);
        return calibrate();
      },
      function (err) {
        startError.textContent = ERROR_TEXT[(err && err.kind) || 'unknown'] || ERROR_TEXT.unknown;
        startError.hidden = false;
      }
    );
  });

  $('start-manual').addEventListener('click', function () {
    mode = 'manual';
    startScreen.hidden = true;
    app.classList.add('manual');
    btnRecalibrate.hidden = true;
    zonesLit.style.clipPath = 'inset(100% 0 0 0)';
    statusEl.textContent = 'Von Hand: Stufe antippen oder Tasten 1–4 drücken.';
    setStage(0);
    keepAwake();
  });

  // ---------- Bedienelemente ----------
  phaseSelect.addEventListener('change', function () {
    phase = findPhase(phaseSelect.value) || phase;
    store('mm.phase', phase.id);
    offset = loadOffset(phase);
    buildZones();
    if (mode === 'live') {
      statusEl.textContent = statusEl.textContent.replace(/Phase: .*/, 'Phase: ' + phase.label);
    }
  });

  btnRecalibrate.addEventListener('click', function () {
    if (mode === 'live') calibrate();
  });

  btnFullscreen.addEventListener('click', function () {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(function () {});
    }
  });
  document.addEventListener('fullscreenchange', function () {
    btnFullscreen.textContent = document.fullscreenElement ? 'Vollbild beenden' : 'Vollbild';
  });

  document.addEventListener('keydown', function (e) {
    if (e.target instanceof HTMLSelectElement) return;
    if (e.key === 'd' || e.key === 'D') {
      debugEl.hidden = !debugEl.hidden;
      peakRel = -Infinity;
      return;
    }
    if (mode !== 'manual') return;
    var n = Number(e.key);
    if (n >= 1 && n <= STAGES.length) setStage(n - 1);
  });

  // ---------- Bildschirm wach halten (Smartboard/Tablet) ----------
  var wakeLock = null;
  function keepAwake() {
    if (!navigator.wakeLock) return;
    navigator.wakeLock.request('screen').then(
      function (lock) { wakeLock = lock; },
      function () { wakeLock = null; }
    );
  }
  document.addEventListener('visibilitychange', function () {
    // Der Browser gibt den Wake Lock beim Verstecken des Tabs automatisch frei.
    if (document.visibilityState === 'visible' && mode !== 'idle' && (!wakeLock || wakeLock.released)) {
      keepAwake();
    }
  });

  setStage(0);
})();
