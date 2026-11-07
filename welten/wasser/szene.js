/*
 * Szene „Wasser“ – ausgebautes Beispiel.
 *
 * Pixel-Fische, Seegras und Lichtstrahlen nach dem Vorbild von Pixelquarium
 * (https://github.com/jjochum-code/Pixelquarium, MIT-Lizenz): Fisch-Sprites werden
 * prozedural aus Form, Farbpalette und Muster erzeugt (vereinfachte Fassung von
 * makeSprite aus Pixelquarium/fishdata.js).
 *
 * Verhalten: Je ruhiger die Klasse (env.ruhe 0 … 1), desto mehr Fische
 * schwimmen im Bild. Wird es laut, flüchten die scheuesten zuerst.
 */
'use strict';

(function () {
  var P = MM.welten.pixel;

  // ---------- Fisch-Sprites (nach Pixelquarium) ----------
  var SPR_W = 32, SPR_H = 24, OUTLINE = '#20264a';

  // Farbpaletten [Körper, Muster/Bauch, Flossen] – aus Pixelquarium übernommen
  var PALS = [
    ['#ff5a4e', '#ffd9a0', '#ff9d2e'],
    ['#3f8cff', '#bfe3ff', '#7fd8ff'],
    ['#41c463', '#d8f7a1', '#2e8b57'],
    ['#ffb02e', '#fff1b8', '#ff7a1a'],
    ['#b45cff', '#ffd6f2', '#7a3cff'],
    ['#22c9c9', '#ccfff4', '#0f8f96'],
    ['#ff6fb0', '#ffe3f1', '#d63384'],
    ['#8a97ff', '#e0e4ff', '#5560d6'],
    ['#c9d64f', '#f4ffd0', '#8ba32c'],
    ['#59d9ff', '#e8fbff', '#2a9fd6'],
  ];

  // Körperformen (Halbachsen der Ellipse, Schwanzlänge)
  var SHAPES = {
    round: { rx: 5, ry: 5, tail: 3 },
    oval: { rx: 6, ry: 4, tail: 3 },
    long: { rx: 8, ry: 3, tail: 3 },
    tall: { rx: 4, ry: 6, tail: 3 },
    tiny: { rx: 3, ry: 2, tail: 2 },
  };
  var SHAPE_IDS = Object.keys(SHAPES);
  var PATTERNS = ['solid', 'stripes', 'dots', 'belly', 'back'];

  /** Erzeugt ein Fisch-Sprite (Blick nach rechts) als kleines Canvas. */
  function makeSprite(sp) {
    var W = SPR_W, H = SPR_H, cx = 18, cy = 12;
    var d = SHAPES[sp.shape];
    var grid = new Array(W * H).fill(null);
    function set(x, y, c) {
      x = Math.round(x); y = Math.round(y);
      if (x >= 0 && x < W && y >= 0 && y < H) grid[y * W + x] = c;
    }
    var c1 = sp.pal[0], c2 = sp.pal[1], c3 = sp.pal[2];
    var c1d = P.schattiere(c1, 0.72), c1l = P.schattiere(c1, 1.35);
    var c2d = P.schattiere(c2, 0.8), c3d = P.schattiere(c3, 0.7);
    function inB(x, y) {
      var nx = (x - cx) / d.rx, ny = (y - cy) / d.ry;
      return nx * nx + ny * ny <= 1.05;
    }

    // Gabelschwanz mit Flossenstrahlen (links)
    var bx = cx - d.rx;
    for (var i = 0; i <= d.tail + 1; i++) {
      var half = Math.min(i, d.ry);
      for (var ty = cy - half; ty <= cy + half; ty++) {
        if (i >= 2 && Math.abs(ty - cy) < half - 1 && i === d.tail + 1) continue; // Kerbe
        set(bx - i, ty, (ty - cy + i) % 2 ? c3 : c3d);
      }
    }

    // Körper mit Muster und Schattierung
    for (var y = 0; y < H; y++) {
      for (var x = 0; x < W; x++) {
        if (!inB(x, y)) continue;
        var c = c1;
        if (sp.pattern === 'belly' && y > cy + d.ry * 0.25) c = c2;
        else if (sp.pattern === 'back' && y < cy - d.ry * 0.25) c = c2;
        else if (sp.pattern === 'stripes' && (x + 100) % 4 < 2) c = c2;
        else if (sp.pattern === 'dots' && x % 4 === 1 && y % 3 === 1) c = c2;
        var ny = (y - cy) / d.ry;
        if (ny < -0.55) c = c === c2 ? P.schattiere(c2, 1.25) : c1l;
        else if (ny > 0.62) c = c === c2 ? c2d : c1d;
        set(x, y, c);
      }
    }

    // Kiemenlinie
    var gx = cx + Math.round(d.rx * 0.42);
    for (var gy = cy - Math.round(d.ry * 0.55); gy <= cy + Math.round(d.ry * 0.55); gy++) {
      if (inB(gx, gy)) set(gx, gy, c1d);
    }
    // Rückenflosse
    for (var k = 0; k < 3; k++) set(cx - 1 + k, cy - d.ry - 1, k % 2 ? c3 : c3d);
    // Auge
    var ex = cx + Math.max(1, d.rx - 2), ey = cy - Math.max(0, Math.round(d.ry * 0.3));
    if (inB(ex + 1, ey)) {
      set(ex, ey, '#ffffff');
      set(ex + 1, ey, OUTLINE); // Pupille
    } else {
      set(ex, ey, OUTLINE); // sehr kleine Fische: nur Pupille
    }

    // Umriss um alles Gemalte
    var out = grid.slice();
    for (var oy = 0; oy < H; oy++) {
      for (var ox = 0; ox < W; ox++) {
        if (grid[oy * W + ox]) continue;
        var nb =
          (ox > 0 && grid[oy * W + ox - 1]) || (ox < W - 1 && grid[oy * W + ox + 1]) ||
          (oy > 0 && grid[(oy - 1) * W + ox]) || (oy < H - 1 && grid[(oy + 1) * W + ox]);
        if (nb) out[oy * W + ox] = OUTLINE;
      }
    }

    var cv = document.createElement('canvas');
    cv.width = W;
    cv.height = H;
    var cx2 = cv.getContext('2d');
    for (var p = 0; p < out.length; p++) {
      if (!out[p]) continue;
      cx2.fillStyle = out[p];
      cx2.fillRect(p % W, Math.floor(p / W), 1, 1);
    }
    return cv;
  }

  // ---------- Zustand der Szene ----------
  var fische = [];
  var seegras = [];
  var korallen = [];
  var blasen = [];
  var rnd = P.zufall(20261107);
  var ANZAHL = 12;

  function sandY(env, x) {
    return Math.round(env.h * 0.86 + Math.sin(x * 0.06) * 2 + Math.sin(x * 0.017 + 2) * 3);
  }

  function verteilen(env) {
    seegras = [];
    korallen = [];
    var n = Math.max(4, Math.round(env.w / 22));
    for (var i = 0; i < n; i++) {
      var x = Math.round((i + 0.3 + rnd() * 0.4) * (env.w / n));
      seegras.push({ x: x, hoehe: Math.round(env.h * (0.25 + rnd() * 0.35)), phase: rnd() * 6, dunkel: rnd() < 0.5 });
    }
    var farben = ['#ff6fb0', '#ff9d2e', '#b45cff', '#ffd84a'];
    for (var j = 0; j < 3; j++) {
      korallen.push({ x: Math.round(env.w * (0.15 + j * 0.33 + rnd() * 0.1)), r: 3 + Math.round(rnd() * 3), farbe: farben[j % farben.length] });
    }
  }

  function neuerFisch(i, env) {
    var sp = {
      shape: SHAPE_IDS[Math.floor(rnd() * SHAPE_IDS.length)],
      pal: PALS[Math.floor(rnd() * PALS.length)],
      pattern: PATTERNS[Math.floor(rnd() * PATTERNS.length)],
    };
    var vonLinks = rnd() < 0.5;
    return {
      sprite: makeSprite(sp),
      // mut: ab welcher Ruhe sich der Fisch ins Bild traut (die scheuesten brauchen viel Ruhe)
      mut: (i + 0.5) / ANZAHL,
      drin: false,
      x: vonLinks ? -SPR_W : env.w + SPR_W,
      y: env.h * (0.15 + rnd() * 0.55),
      zielX: env.w * rnd(),
      zielY: env.h * (0.15 + rnd() * 0.55),
      tempo: 6 + rnd() * 10,
      richtung: vonLinks ? 1 : -1,
      phase: rnd() * 6,
    };
  }

  // ---------- Zeichnen ----------
  function hintergrund(ctx, env) {
    var f = env.welt.farben;
    P.verlauf(ctx, env, f.oben, f.unten);

    // Lichtstrahlen von oben, wandern langsam
    ctx.globalAlpha = 0.07 + 0.06 * env.ruhe;
    ctx.fillStyle = '#ffffff';
    for (var i = 0; i < 4; i++) {
      var x0 = ((i * env.w) / 3 + env.t * 4) % (env.w * 1.4) - env.w * 0.2;
      ctx.beginPath();
      ctx.moveTo(x0, 0);
      ctx.lineTo(x0 + env.w * 0.08, 0);
      ctx.lineTo(x0 + env.w * 0.22, env.h);
      ctx.lineTo(x0 + env.w * 0.12, env.h);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Sandboden mit Kieseln
    for (var x = 0; x < env.w; x++) {
      var y = sandY(env, x);
      ctx.fillStyle = f.sand;
      ctx.fillRect(x, y, 1, env.h - y);
      ctx.fillStyle = P.schattiere(f.sand, 1.15);
      ctx.fillRect(x, y, 1, 1);
      if ((x * 7919) % 23 === 0) {
        ctx.fillStyle = P.schattiere(f.sand, 0.75);
        ctx.fillRect(x, y + 3 + (x % 4), 2, 1);
      }
    }
  }

  function zeichneKorallen(ctx, env) {
    korallen.forEach(function (k) {
      var by = sandY(env, k.x);
      for (var dy = -k.r; dy <= 0; dy++) {
        for (var dx = -k.r; dx <= k.r; dx++) {
          if (dx * dx + dy * dy > k.r * k.r) continue;
          ctx.fillStyle = (dx + dy) % 2 ? k.farbe : P.schattiere(k.farbe, 0.8);
          ctx.fillRect(k.x + dx, by + dy, 1, 1);
        }
      }
    });
  }

  function zeichneSeegras(ctx, env) {
    seegras.forEach(function (s) {
      var by = sandY(env, s.x);
      var farbe = s.dunkel ? '#2e8b57' : '#41c463';
      for (var i = 0; i < s.hoehe; i++) {
        var k = i / s.hoehe;
        var sway = Math.round(Math.sin(env.t * 1.2 + s.phase + i * 0.15) * 3 * k);
        ctx.fillStyle = i % 3 === 0 ? P.schattiere(farbe, 0.8) : farbe;
        ctx.fillRect(s.x + sway, by - i, 2, 1);
      }
    });
  }

  function zeichneBlasen(ctx, env) {
    // Bei Ruhe steigen mehr Blasen auf
    if (rnd() < env.dt * (0.6 + 2.5 * env.ruhe)) {
      var s = seegras[Math.floor(rnd() * seegras.length)];
      if (s) blasen.push({ x: s.x + 1, y: sandY(env, s.x) - s.hoehe, r: rnd() < 0.3 ? 2 : 1 });
    }
    ctx.fillStyle = '#ffffffaa';
    blasen = blasen.filter(function (b) {
      b.y -= env.dt * 14;
      b.x += Math.sin(b.y * 0.3) * 0.15;
      ctx.fillRect(Math.round(b.x), Math.round(b.y), b.r, b.r);
      return b.y > -4;
    });
  }

  function bewegeUndZeichneFische(ctx, env) {
    fische.forEach(function (f) {
      // Mit kleiner Hysterese, damit Fische an der Grenze nicht hin und her zappeln
      if (!f.drin && env.ruhe > f.mut + 0.04) {
        f.drin = true;
        f.zielX = env.w * (0.1 + rnd() * 0.8);
      } else if (f.drin && env.ruhe < f.mut - 0.04) {
        f.drin = false;
        f.zielX = f.x < env.w / 2 ? -SPR_W * 2 : env.w + SPR_W * 2; // zum nächsten Rand flüchten
      }

      var tempo = f.drin ? f.tempo : f.tempo * 6 + 20; // Flucht ist deutlich schneller
      var dx = f.zielX - f.x, dy = f.zielY - f.y;
      if (f.drin && Math.abs(dx) < 3) {
        // neues Ziel im Becken suchen
        f.zielX = env.w * (0.08 + rnd() * 0.84);
        f.zielY = env.h * (0.12 + rnd() * 0.58);
      }
      if (Math.abs(dx) > 0.5) f.richtung = dx > 0 ? 1 : -1;
      f.x += Math.sign(dx) * Math.min(Math.abs(dx), tempo * env.dt);
      f.y += Math.sign(dy) * Math.min(Math.abs(dy), (f.drin ? tempo : f.tempo) * 0.4 * env.dt);

      var wobble = Math.round(Math.sin(env.t * 3 + f.phase));
      var px = Math.round(f.x - SPR_W / 2), py = Math.round(f.y - SPR_H / 2 + wobble);
      if (px < -SPR_W || px > env.w) return;
      ctx.save();
      if (f.richtung < 0) {
        ctx.translate(px + SPR_W, py);
        ctx.scale(-1, 1);
        ctx.drawImage(f.sprite, 0, 0);
      } else {
        ctx.drawImage(f.sprite, px, py);
      }
      ctx.restore();
    });
  }

  MM.welten.register('wasser', {
    init: function (env) {
      fische = [];
      blasen = [];
      verteilen(env);
      for (var i = 0; i < ANZAHL; i++) fische.push(neuerFisch(i, env));
    },

    resize: function (env) {
      verteilen(env);
    },

    draw: function (ctx, env) {
      hintergrund(ctx, env);
      zeichneKorallen(ctx, env);
      zeichneSeegras(ctx, env);
      bewegeUndZeichneFische(ctx, env);
      zeichneBlasen(ctx, env);

      // Wird es laut, trübt das Wasser ein
      var truebung = (1 - env.ruhe) * 0.35;
      if (truebung > 0.01) {
        ctx.fillStyle = 'rgba(8, 20, 45, ' + truebung.toFixed(3) + ')';
        ctx.fillRect(0, 0, env.w, env.h);
      }
    },
  });
})();
