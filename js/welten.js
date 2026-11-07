/*
 * Mucksmäuschen – Spielwelten
 *
 * Jede Welt liegt in einem eigenen Ordner unter welten/<id>/:
 *   welt.json      Daten (Name, Beschreibung, Farben, später Items und Tiere)
 *   szene.js       Zeichnet die Welt (meldet sich mit MM.welten.register an)
 *   vorschau.svg   Bild für die Auswahl im Startbildschirm
 * Welche Welten es gibt, steht in welten/welten.json.
 *
 * Die Welt wird in niedriger Auflösung (Pixel-Look) auf ein Canvas gemalt und
 * groß skaliert. Sie bekommt in jedem Bild, wie ruhig die Klasse gerade ist.
 */
'use strict';

window.MM = window.MM || {};

(function () {
  /** Größe eines Welt-Pixels in Bildschirm-Pixeln (Pixel-Look). */
  var PIXEL = 4;
  /** Wie träge die „Ruhe“ der Stufe folgt (Sekunden) – Welt reagiert sanft, nicht hektisch. */
  var RUHE_TAU = 1.5;

  var szenen = {};      // id → Szene-Objekt aus szene.js
  var liste = [];       // Daten aus welt.json, in der Reihenfolge von welten.json
  var aktiv = null;     // { welt, szene, canvas, ctx, env }
  var zielRuhe = 1;
  var rafId = 0;
  var lastT = 0;

  // ---------- Hilfsfunktionen für Szenen ----------
  var pixel = {
    /** Reproduzierbarer Zufall (gleicher Startwert → gleiche Welt). */
    zufall: function (seed) {
      var a = seed >>> 0;
      return function () {
        a = (a + 0x6d2b79f5) | 0;
        var t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    },
    /** Farbe abdunkeln (f < 1) oder aufhellen (f > 1). */
    schattiere: function (hex, f) {
      var r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
      if (f > 1) {
        var k = f - 1;
        r += (255 - r) * k; g += (255 - g) * k; b += (255 - b) * k;
      } else {
        r *= f; g *= f; b *= f;
      }
      return '#' + [r, g, b].map(function (v) {
        return ('0' + Math.max(0, Math.min(255, Math.round(v))).toString(16)).slice(-2);
      }).join('');
    },
    /** Senkrechter Farbverlauf über die ganze Fläche. */
    verlauf: function (ctx, env, oben, unten) {
      var g = ctx.createLinearGradient(0, 0, 0, env.h);
      g.addColorStop(0, oben);
      g.addColorStop(1, unten);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, env.w, env.h);
    },
    /** Zwischen zwei Werten überblenden (t = 0 … 1). */
    mische: function (a, b, t) {
      return a + (b - a) * t;
    },
  };

  /**
   * Platzhalter-Szene für Welten, die noch gebaut werden: Himmel, Boden,
   * eine Sonne, die bei Ruhe aufgeht, und ein Baustellen-Schild.
   */
  function platzhalter(ctx, env) {
    var f = env.welt.farben || {};
    pixel.verlauf(ctx, env, f.himmel || '#9fd3ff', f.horizont || '#e6f4ff');

    // Sonne steigt mit der Ruhe
    var sx = Math.round(env.w * 0.78);
    var sy = Math.round(pixel.mische(env.h * 0.7, env.h * 0.18, env.ruhe));
    ctx.fillStyle = '#ffd84a';
    ctx.beginPath();
    ctx.arc(sx, sy, Math.max(6, env.h * 0.07), 0, Math.PI * 2);
    ctx.fill();

    // Boden mit leichten Hügeln
    var bodenY = Math.round(env.h * 0.7);
    ctx.fillStyle = f.boden || '#6fbf4a';
    for (var x = 0; x < env.w; x++) {
      var y = bodenY + Math.round(Math.sin(x * 0.05) * 3 + Math.sin(x * 0.013 + 1) * 5);
      ctx.fillRect(x, y, 1, env.h - y);
    }
    ctx.fillStyle = pixel.schattiere(f.boden || '#6fbf4a', 0.8);
    ctx.fillRect(0, env.h - Math.round(env.h * 0.08), env.w, env.h);

    // Baustellen-Schild
    var text = env.welt.name + ' – im Aufbau';
    ctx.font = 'bold ' + Math.max(8, Math.round(env.h * 0.075)) + 'px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    var tw = ctx.measureText(text).width + 16;
    var th = Math.round(env.h * 0.13);
    var tx = Math.round(env.w / 2), ty = Math.round(env.h * 0.42);
    ctx.fillStyle = '#ffffffcc';
    ctx.fillRect(Math.round(tx - tw / 2), Math.round(ty - th / 2), Math.round(tw), th);
    ctx.fillStyle = '#1d2327';
    ctx.fillText(text, tx, ty + 1);
  }

  // ---------- Laden ----------
  function ladeJson(url) {
    return fetch(url, { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error(url + ': ' + r.status);
      return r.json();
    });
  }

  /** Liest welten/welten.json und alle welt.json. Fehlerhafte Welten werden übersprungen. */
  function laden() {
    return ladeJson('welten/welten.json').then(function (index) {
      return Promise.all(index.welten.map(function (id) {
        return ladeJson('welten/' + id + '/welt.json').then(
          function (w) {
            w.id = id;
            w.ordner = 'welten/' + id + '/';
            return w;
          },
          function (err) {
            console.warn('Welt „' + id + '“ konnte nicht geladen werden:', err);
            return null;
          }
        );
      }));
    }).then(function (welten) {
      liste = welten.filter(Boolean);
      return liste;
    });
  }

  /** Lädt welten/<id>/szene.js einmalig als normales Skript. */
  function ladeSzene(welt) {
    if (szenen[welt.id]) return Promise.resolve(szenen[welt.id]);
    return new Promise(function (resolve) {
      var s = document.createElement('script');
      s.src = welt.ordner + 'szene.js';
      s.onload = function () { resolve(szenen[welt.id] || null); };
      s.onerror = function () {
        console.warn('szene.js für „' + welt.id + '“ fehlt – zeige Platzhalter.');
        resolve(null);
      };
      document.head.appendChild(s);
    });
  }

  // ---------- Anzeige ----------
  function groesseAnpassen() {
    if (!aktiv) return;
    var c = aktiv.canvas;
    var w = Math.max(40, Math.round(c.clientWidth / PIXEL));
    var h = Math.max(30, Math.round(c.clientHeight / PIXEL));
    if (c.width === w && c.height === h) return;
    c.width = w;
    c.height = h;
    aktiv.ctx.imageSmoothingEnabled = false;
    aktiv.env.w = w;
    aktiv.env.h = h;
    if (aktiv.szene && aktiv.szene.resize) aktiv.szene.resize(aktiv.env);
  }

  function bild(t) {
    rafId = requestAnimationFrame(bild);
    if (!aktiv) return;
    var dt = lastT ? Math.min(0.1, (t - lastT) / 1000) : 1 / 60;
    lastT = t;
    groesseAnpassen();
    var env = aktiv.env;
    env.t += dt;
    env.dt = dt;
    env.ruhe += (zielRuhe - env.ruhe) * (1 - Math.exp(-dt / RUHE_TAU));
    var ctx = aktiv.ctx;
    ctx.save();
    try {
      if (aktiv.szene && aktiv.szene.draw) aktiv.szene.draw(ctx, env);
      else platzhalter(ctx, env);
    } catch (err) {
      // Fehler in einer Szene sollen die App nicht lahmlegen
      console.error('Fehler in Szene „' + env.welt.id + '“:', err);
      aktiv.szene = null;
    }
    ctx.restore();
  }

  /** Welt auf dem Canvas anzeigen. */
  function aktivieren(id, canvas) {
    var welt = liste.find(function (w) { return w.id === id; }) || liste[0];
    if (!welt) return Promise.resolve(null);
    return ladeSzene(welt).then(function (szene) {
      var env = { w: 0, h: 0, t: 0, dt: 0, ruhe: zielRuhe, stufe: 0, welt: welt, pixel: pixel };
      aktiv = { welt: welt, szene: szene, canvas: canvas, ctx: canvas.getContext('2d'), env: env };
      canvas.width = 0; // erzwingt Neuberechnung der Größe
      groesseAnpassen();
      if (szene && szene.init) {
        try {
          szene.init(env);
        } catch (err) {
          console.error('Fehler beim Start der Szene „' + welt.id + '“:', err);
          aktiv.szene = null;
        }
      }
      if (!rafId) rafId = requestAnimationFrame(bild);
      return welt;
    });
  }

  /** Stufe der Ampel (0 = still … 3 = zu laut) an die Welt weitergeben. */
  function setStufe(stufe) {
    zielRuhe = 1 - stufe / 3;
    if (aktiv) aktiv.env.stufe = stufe;
  }

  MM.welten = {
    /** Wird von welten/<id>/szene.js aufgerufen. */
    register: function (id, szene) {
      szenen[id] = szene;
    },
    laden: laden,
    aktivieren: aktivieren,
    setStufe: setStufe,
    get liste() {
      return liste;
    },
    get aktiv() {
      return aktiv ? aktiv.welt : null;
    },
    pixel: pixel,
    platzhalter: platzhalter,
  };
})();
