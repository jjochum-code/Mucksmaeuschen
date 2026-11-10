/*
 * Mucksmäuschen – Oberfläche und Ablauf.
 * Benötigt (in dieser Reihenfolge geladen): config.js, loudness.js, mic.js
 */
'use strict';

(function () {
  var cfg = MM.config;
  var STAGES = cfg.STAGES;
  var PHASES = cfg.PHASES;

  // ---------- DOM ----------
  function $(id) {
    return document.getElementById(id);
  }

  var app = $('app');
  var phaseSelect = $('phase');
  var btnRecalibrate = $('recalibrate');
  var btnFullscreen = $('fullscreen');
  var stageLabel = $('stage-label');
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
  var weltSelect = $('welt');
  var weltAuswahl = $('welt-auswahl');
  var weltCanvas = $('welt-canvas');

  // ---------- Zustand ----------
  /** 'idle' | 'calibrating' | 'live' | 'manual' */
  var mode = 'idle';
  var phase = loadPhase();
  var currentStage = -1;
  /** Position des Schiebereglers = Grenze zu „Zu laut!“ in dB über dem Grundpegel. */
  var red = loadRed(phase);

  var mic = new MM.MicLevel();
  var tracker = new MM.loudness.LoudnessTracker(-60);

  /**
   * Wirksame Schwellen: Die rote Grenze kommt vom Schieberegler, die beiden
   * unteren Grenzen wachsen/schrumpfen im gleichen Verhältnis wie in der Phase.
   */
  function thresholds() {
    var scale = red / phase.thresholds[2];
    return phase.thresholds.map(function (t) { return Math.round(t * scale * 10) / 10; });
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

  function loadRed(p) {
    var stored = store('mm.red.' + p.id);
    var v = stored === null ? NaN : Number(stored);
    return Number.isFinite(v) ? clampRed(v) : p.thresholds[2];
  }

  /** Der Regler darf über die ganze Höhe des Pegelmessers – keine weiteren Sperren. */
  function clampRed(v) {
    var r = cfg.METER_RANGE;
    return Math.max(r.min, Math.min(r.max, Math.round(v * 2) / 2));
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
    var r = cfg.METER_RANGE;
    var pct = ((relDb - r.min) / (r.max - r.min)) * 100;
    return Math.max(0, Math.min(100, pct));
  }

  /** Farbzonen und Regler-Position an die wirksamen Schwellen anpassen. */
  function buildZones() {
    var th = thresholds();
    var range = cfg.METER_RANGE;
    var bounds = [range.min].concat(th, [range.max]);
    var gradient = STAGES.map(function (s, i) {
      return s.color + ' ' + toPercent(bounds[i]) + '% ' + toPercent(bounds[i + 1]) + '%';
    }).join(', ');
    var bg = 'linear-gradient(to top, ' + gradient + ')';
    zonesDim.style.background = bg;
    zonesLit.style.background = bg;

    var isDefault = red === phase.thresholds[2];
    sensHandle.style.setProperty('--pos', String(toPercent(red) / 100));
    sensHandle.setAttribute('aria-valuemin', String(range.min));
    sensHandle.setAttribute('aria-valuemax', String(range.max));
    sensHandle.setAttribute('aria-valuenow', String(red));
    sensHandle.setAttribute(
      'aria-valuetext',
      'Grenze bei ' + red + ' dB' + (isDefault ? ' (Standard)' : ', Standard ' + phase.thresholds[2] + ' dB')
    );
    // Platz bleibt reserviert, damit der Pegelmesser beim Ein-/Ausblenden nicht springt
    sensReset.style.visibility = isDefault ? 'hidden' : 'visible';
    if (mode === 'manual') zeigeHandPegel(); // Regler verschoben → Pegel neu einordnen
  }

  function setRed(v) {
    var next = clampRed(v);
    if (next === red) return;
    red = next;
    store('mm.red.' + phase.id, String(red));
    buildZones();
  }
  buildZones();

  // ---------- Schieberegler: Grenze „Zu laut!“ live verschieben ----------
  // Der Griff lässt sich über die ganze Höhe ziehen (ganz unten = sehr streng,
  // ganz oben = sehr locker). Er bewegt sich relativ zur Greifposition, springt also nicht.
  var drag = null; // { y: Start-Y, red: Startwert, dbPerPx }

  sensHandle.addEventListener('pointerdown', function (e) {
    e.preventDefault();
    var barHeight = meterBar.getBoundingClientRect().height;
    drag = {
      y: e.clientY,
      red: red,
      dbPerPx: (cfg.METER_RANGE.max - cfg.METER_RANGE.min) / barHeight,
    };
    sensHandle.setPointerCapture(e.pointerId);
    meter.classList.add('dragging');
    sensHandle.focus({ preventScroll: true });
  });
  sensHandle.addEventListener('pointermove', function (e) {
    if (!drag) return;
    setRed(drag.red + (drag.y - e.clientY) * drag.dbPerPx);
  });
  function endDrag() {
    drag = null;
    meter.classList.remove('dragging');
  }
  sensHandle.addEventListener('pointerup', endDrag);
  sensHandle.addEventListener('pointercancel', endDrag);

  var KEY_STEPS = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1, PageUp: 5, PageDown: -5 };
  sensHandle.addEventListener('keydown', function (e) {
    if (e.key in KEY_STEPS) setRed(red + KEY_STEPS[e.key]);
    else if (e.key === 'Home' || e.key === 'Escape') setRed(phase.thresholds[2]);
    else if (e.key === 'End') setRed(cfg.METER_RANGE.max);
    else return;
    e.preventDefault();
  });

  sensReset.addEventListener('click', function () {
    setRed(phase.thresholds[2]);
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
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', s.color);
    var chips = legend.querySelectorAll('.chip');
    for (var k = 0; k < chips.length; k++) chips[k].classList.toggle('active', k === i);
    MM.welten.setStufe(i);
    if (mode === 'manual') zeigeHandPegel();
  }

  /** Handbetrieb: Es gibt keinen Messwert – der Pegelmesser zeigt die Mitte der gewählten Stufe. */
  function zeigeHandPegel() {
    if (currentStage < 0) return;
    var b = [cfg.METER_RANGE.min].concat(thresholds(), [cfg.METER_RANGE.max]);
    setLevel((b[currentStage] + b[currentStage + 1]) / 2);
  }

  function setLevel(fastRel) {
    var pct = toPercent(fastRel);
    zonesLit.style.clipPath = 'inset(' + (100 - pct) + '% 0 0 0)';
  }

  // ---------- Spielwelten ----------
  // Karten im Startbildschirm + Auswahl in der Kopfzeile; die Welt selbst malt js/welten.js.
  function weltWaehlen(id) {
    store('mm.welt', id);
    weltSelect.value = id;
    var karten = weltAuswahl.querySelectorAll('.welt-karte');
    for (var k = 0; k < karten.length; k++) {
      karten[k].setAttribute('aria-checked', String(karten[k].dataset.id === id));
    }
    MM.welten.aktivieren(id, weltCanvas);
  }

  function weltKarte(w) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'welt-karte';
    btn.dataset.id = w.id;
    btn.setAttribute('role', 'radio');
    btn.setAttribute('aria-checked', 'false');
    var img = document.createElement('img');
    img.src = w.ordner + (w.vorschau || 'vorschau.svg');
    img.alt = '';
    var name = document.createElement('span');
    name.className = 'welt-name';
    name.textContent = w.name;
    var info = document.createElement('span');
    info.className = 'welt-info';
    info.textContent = w.beschreibung || '';
    btn.append(img, name, info);
    if (w.status === 'platzhalter') {
      var badge = document.createElement('span');
      badge.className = 'welt-badge';
      badge.textContent = 'im Aufbau';
      btn.append(badge);
    }
    btn.addEventListener('click', function () {
      weltWaehlen(w.id);
    });
    return btn;
  }

  MM.welten.laden().then(
    function (liste) {
      if (!liste.length) throw new Error('keine Welten');
      liste.forEach(function (w) {
        var opt = document.createElement('option');
        opt.value = w.id;
        opt.textContent = w.name;
        weltSelect.appendChild(opt);
        weltAuswahl.appendChild(weltKarte(w));
      });
      var gemerkt = store('mm.welt');
      var start = liste.some(function (w) { return w.id === gemerkt; }) ? gemerkt : liste[0].id;
      weltWaehlen(start);
    },
    function (err) {
      console.warn('Welten konnten nicht geladen werden:', err);
      weltAuswahl.textContent =
        'Die Welten konnten nicht geladen werden (welten/liste.js fehlt?). Details in der Browser-Konsole (F12).';
      weltSelect.closest('.field').hidden = true;
    }
  );

  weltSelect.addEventListener('change', function () {
    weltWaehlen(weltSelect.value);
  });

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
    var shift = red !== phase.thresholds[2] ? ' (Regler)' : '';
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
    // Belohnungen (Sternenwiese): zählt ruhige Zeit im Mikrofon- und im Handbetrieb
    if (MM.belohnung) MM.belohnung.tick(t, dt, currentStage, mode === 'live' || mode === 'manual');
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
    statusEl.textContent = 'Von Hand: Stufe antippen oder Tasten 1–4 drücken.';
    setStage(0);
    zeigeHandPegel(); // Pegelmesser und Regler bleiben auch ohne Mikrofon sichtbar
    keepAwake();
    // Messschleife auch im Handbetrieb laufen lassen – für die Belohnungen
    cancelAnimationFrame(rafId);
    lastT = 0;
    rafId = requestAnimationFrame(loop);
  });

  // ---------- Bedienelemente ----------
  phaseSelect.addEventListener('change', function () {
    phase = findPhase(phaseSelect.value) || phase;
    store('mm.phase', phase.id);
    red = loadRed(phase);
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
