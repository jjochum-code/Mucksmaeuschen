/*
 * Szene „Strand“ / Scene "Beach"
 *
 * Ein Pixel-Strand mit Bewohnern, die auf die Lautstärke reagieren.
 * A pixel beach whose residents react to the noise level.
 *
 *   Stufe          Krabben           Seesterne         Delfine     Möwen            Muscheln
 *   0 still        laufen, klappern  tanzen, lächeln   springen    laufen, picken   offen mit Perle
 *   1 leise        bleiben stehen    liegen still      schwimmen   schauen sich um  zu
 *   2 etwas laut   zittern, gucken   zittern           schwimmen   gucken hektisch  zu
 *   3 zu laut      graben sich ein   rollen ins Meer   hauen ab    hauen ab         zu
 *
 * Wird es wieder ruhig, kommen alle nach und nach zurück.
 * Once it is quiet again, everyone comes back one after another.
 */
'use strict';

(function () {
  var P = MM.welten.pixel;

  // ---------- Aufteilung / layout (Anteil der Bildhöhe / share of the height) ----------
  var HORIZONT = 0.36; // Himmel → Meer
  var UFER = 0.52;     // Meer → Sand

  // ---------- Farben der Pixel-Bilder / sprite colours ----------
  // Jeder Buchstabe in den Pixel-Bildern unten steht für eine Farbe.
  // Each letter in the sprites below stands for one colour.
  var FARBEN = {
    k: '#2a2a35', // Augen, Mund / eyes, mouth
    w: '#ffffff',
    c: '#fffaf0', // Wolke / cloud
    r: '#e8553e', // Krabbe / crab
    R: '#b23a28',
    s: '#ff9a3c', // Seestern / starfish
    S: '#dd6f28',
    b: '#6f9fd8', // Delfin / dolphin
    B: '#4a78b5',
    l: '#dbe9f7', // Delfinbauch / dolphin belly
    g: '#b9c2cc', // Möwe / gull
    G: '#7d8794',
    y: '#ffcf3a', // Schnabel, Muschel / beak, shell
    o: '#f08a2a', // Möwenbeine, Muschel / gull legs, shell
    p: '#ff9ec4', // rosa / pink
    P: '#e0709d',
    m: '#ffdbe8', // Muschel innen / inside of the clam
    h: '#b07a45', // Holz / wood
    H: '#7d5530',
    e: '#5cb85c', // Gras / grass
    E: '#3a8a3e',
    t: '#8a8f96', // Stein / rock
    T: '#6a6f76',
    u: '#b4b9c0', // heller Stein / light rock
  };

  // ---------- Pixel-Bilder / sprites ('.' = durchsichtig / transparent) ----------
  var WOLKE = [
    '......ccccc...........',
    '......ccccccc..ccc....',
    '..cccccccccccccccccc..',
    'cccccccccccccccccccccc',
    'cccccccccccccccccccccc',
    '.....cccccccccccc.....',
  ];

  // Steine und Gras in der Ecke (rechts gespiegelt) / rocks and grass in the corner
  var ECKE = [
    '.e....................',
    '.e.....e..............',
    '.e....ee..............',
    'ee...ee...............',
    '.e..ee................',
    '.ee.e.................',
    '..eE..................',
    '..eE..................',
    '...ttttttt............',
    '..tttttttttt..........',
    '.tTttttttttTt...uuu...',
    '.TTTTTTTTTTTT..uuuuu..',
    'TTTTTTTTTTTTT.uuuuuuu.',
  ];

  // Liege mit rot-weißem Handtuch / sun lounger with red-and-white towel
  var LIEGE = [
    '......................rwH...',
    '.....................wrH....',
    '....................rwH.....',
    '...................wrH......',
    'wwrrwwrrwwrrwwrrwwrrwH......',
    'HHHHHHHHHHHHHHHHHHHHHHH.....',
    '.H...................H......',
    '.H...................H......',
    'HH..................HH......',
  ];

  // Krabbe aus drei Teilen: Scheren + Körper + Beine / crab built from three parts
  var KRABBE_SCHEREN_OFFEN = [
    '.RR..........RR.',
    'R.rR........Rr.R',
    'R..R........R..R',
    '.RrR........RrR.',
  ];
  var KRABBE_SCHEREN_ZU = [
    '.RR..........RR.',
    'RrrR........RrrR',
    'RrrR........RrrR',
    '.RRR........RRR.',
  ];
  var KRABBE_KOERPER = [
    '...rrrrrrrrrr...',
    '..rrrrrrrrrrrr..',
    '.rrrrrrrrrrrrrr.',
    '..RrrrrrrrrrrR..',
  ];
  var KRABBE_BEINE_1 = [
    '.R.R.R....R.R.R.',
    'R..R..R..R..R..R',
  ];
  var KRABBE_BEINE_2 = [
    'R.R.R......R.R.R',
    '.R..R.R..R.R..R.',
  ];
  var MUND_FROH = ['k....k', '.kkkk.'];
  var MUND_GERADE = ['kkkk'];
  var MUND_O = ['.kk.', 'k..k', '.kk.'];

  var SEESTERN = [
    '......s......',
    '.....sSs.....',
    '.....sss.....',
    '....sssss....',
    'sSsssssssssSs',
    '.sssssssssss.',
    '..sssssssss..',
    '...sssssss...',
    '...sssssss...',
    '..ssss.ssss..',
    '.ssss...ssss.',
    '.sSs.....sSs.',
    'ss.........ss',
  ];
  // Gesichter für den Seestern / starfish faces
  var GESICHT_FROH = ['.k...k.', '.k...k.', '.......', '.k...k.', '..kkk..'];
  var GESICHT_RUHIG = ['.k...k.', '.k...k.', '.......', '.......', '..kkk..'];
  var GESICHT_BLINZELN = ['.......', 'kk...kk', '.......', '.k...k.', '..kkk..'];
  var GESICHT_ANGST = ['k.....k', '.k...k.', 'k.....k', '..kkk..', '.k...k.'];

  var DELFIN = [
    '..........B...........',
    '.........BB...........',
    '........BBB...........',
    '....BBBBbbbbBBBB......',
    'B..BbbbbbbbbbbbbBB....',
    'BBBbbbbbbbbbbbbkbbBBBB',
    'B..Bblllllllllllbbbbb.',
    '.....BllllllllllBB....',
    '.........BBB..........',
    '..........BB..........',
  ];

  // Möwe am Boden: Körper oben, Beine in zwei Stellungen / gull on the ground: body + two leg poses
  var MOEWE_KOERPER = [
    '........www.',
    '.......wwkw.',
    '.......wwwyy',
    '......wwww..',
    'G.ggggwwww..',
    'GGgggggwww..',
    '.GGgggwwww..',
    '...wwwwwww..',
  ];
  var MOEWE_BEINE = ['.....o..o...', '....oo.oo...'];
  var MOEWE_BEINE_SCHRITT = ['....o....o..', '...oo...oo..'];

  // Kopf runter zum Picken / head down to peck
  var MOEWE_PICKT = [
    '............',
    '............',
    '............',
    'G.gggg......',
    'GGgggggwww..',
    '.GGgggwwwww.',
    '...wwwwwwwww',
    '.....o..wwkw',
    '.....o..wwwy',
    '....oo.o...y',
  ];

  // Kopf hoch, Schnabel offen: „Kriiäh!“ / head up, beak open: "kree!"
  var MOEWE_RUFT = [
    '........www.',
    '.......wwkwy',
    '.......www..',
    '......wwwwy.',
    'G.ggggwwww..',
    'GGgggggwww..',
    '.GGgggwwww..',
    '...wwwwwww..',
    '.....o..o...',
    '....oo.oo...',
  ];

  // Flügel strecken / stretching the wings
  var MOEWE_STRECKT = [
    'G.......www.',
    'gG.....wwkw.',
    '.gg....wwwyy',
    '..ggg.wwww..',
    '....ggwwww..',
    '.....gwwww..',
    '.GGgggwwww..',
    '...wwwwwww..',
    '.....o..o...',
    '....oo.oo...',
  ];

  // Im Flug von vorne / in flight, seen from the front
  var MOEWE_GLEITET = [
    '...........',
    'GgggwwwgggG',
    '.....y.....',
    '...........',
  ];
  var MOEWE_FLUEGEL_OBEN = [
    'G.........G',
    '.gg.....gg.',
    '...gwwwg...',
    '.....y.....',
  ];
  var MOEWE_FLUEGEL_UNTEN = [
    '...........',
    '...gwwwg...',
    '.gg..y..gg.',
    'G.........G',
  ];

  // Fächermuschel, geschlossen und offen mit Perle / fan shell, closed and open with a pearl
  var MUSCHEL_ZU = [
    '.PpPpPpP.',
    'PpPpPpPpP',
    'PpPpPpPpP',
    '.PpPpPpP.',
    '..PpPpP..',
    '...PPP...',
  ];
  var MUSCHEL_OFFEN = [
    '..PpPpP..',
    '.PpPpPpP.',
    '.PPPPPPP.',
    '..mwwwm..',
    '.mmwwwmm.',
    'PpPpPpPpP',
    '.PpPpPpP.',
    '..PpPpP..',
    '...PPP...',
  ];
  var JAKOBSMUSCHEL = [
    '..yyy..',
    '.yoyoy.',
    'yoyoyoy',
    '.yoyoy.',
    '..ooo..',
  ];

  // Sprechblase mit „!“, wenn sich ein Tier erschreckt / "!" bubble when an animal gets scared
  var AUSRUF = [
    '.www.',
    'wwRww',
    'wwRww',
    'wwRww',
    'wwwww',
    'wwRww',
    '.www.',
  ];

  /** Macht aus einem Pixel-Bild (Text) ein kleines Canvas. / Turns a text sprite into a canvas. */
  function sprite(zeilen) {
    var breite = Math.max.apply(null, zeilen.map(function (z) { return z.length; }));
    var cv = document.createElement('canvas');
    cv.width = breite;
    cv.height = zeilen.length;
    var c = cv.getContext('2d');
    zeilen.forEach(function (zeile, y) {
      for (var x = 0; x < zeile.length; x++) {
        var farbe = FARBEN[zeile[x]];
        if (!farbe) continue;
        c.fillStyle = farbe;
        c.fillRect(x, y, 1, 1);
      }
    });
    return cv;
  }

  /** Sonnenschirm rot-weiß, mit Formeln statt als Text gemalt. / Red-and-white umbrella. */
  function sonnenschirm() {
    var DACH = [0, 3, 6, 8, 10, 11, 12]; // halbe Breite des Dachs je Reihe / half width per row
    var HALB = 12, STANGE = 16;
    var cv = document.createElement('canvas');
    cv.width = HALB * 2 + 1;
    cv.height = DACH.length + 1 + STANGE;
    var c = cv.getContext('2d');

    // Dach: 5 Streifen rot-weiß-rot-weiß-rot, die oben zusammenlaufen (spiegelgleich)
    // Canopy: 5 red/white stripes that meet at the top (mirror-symmetric)
    DACH.forEach(function (halb, y) {
      for (var dx = -halb; dx <= halb; dx++) {
        var streifen = Math.floor(((dx + halb + 0.5) / (halb * 2 + 1)) * 5);
        c.fillStyle = streifen % 2 === 0 ? FARBEN.r : FARBEN.w;
        if (y === 0) c.fillStyle = FARBEN.R; // Spitze / tip
        c.fillRect(HALB + dx, y, 1, 1);
      }
    });

    // Gewellter Saum unten / scalloped hem
    var saum = DACH.length;
    for (var dx = -HALB; dx <= HALB; dx++) {
      var stelle = (dx + HALB) % 5;
      if (stelle === 0 || stelle === 4) continue;
      var rot = Math.floor((dx + HALB) / 5) % 2 === 0;
      c.fillStyle = rot ? FARBEN.R : '#dcdcdc';
      c.fillRect(HALB + dx, saum, 1, 1);
    }

    // Stange / pole
    c.fillStyle = FARBEN.u;
    c.fillRect(HALB, saum, 1, STANGE + 1);
    return cv;
  }

  var bilder = {
    wolke: sprite(WOLKE),
    ecke: sprite(ECKE),
    liege: sprite(LIEGE),
    schirm: sonnenschirm(),
    krabbe: {
      offen1: sprite(KRABBE_SCHEREN_OFFEN.concat(KRABBE_KOERPER, KRABBE_BEINE_1)),
      offen2: sprite(KRABBE_SCHEREN_OFFEN.concat(KRABBE_KOERPER, KRABBE_BEINE_2)),
      zu1: sprite(KRABBE_SCHEREN_ZU.concat(KRABBE_KOERPER, KRABBE_BEINE_1)),
      zu2: sprite(KRABBE_SCHEREN_ZU.concat(KRABBE_KOERPER, KRABBE_BEINE_2)),
    },
    mundFroh: sprite(MUND_FROH),
    mundGerade: sprite(MUND_GERADE),
    mundO: sprite(MUND_O),
    seestern: sprite(SEESTERN),
    gesichtFroh: sprite(GESICHT_FROH),
    gesichtRuhig: sprite(GESICHT_RUHIG),
    gesichtBlinzeln: sprite(GESICHT_BLINZELN),
    gesichtAngst: sprite(GESICHT_ANGST),
    delfin: sprite(DELFIN),
    moeweSteht: sprite(MOEWE_KOERPER.concat(MOEWE_BEINE)),
    moeweSchritt: sprite(MOEWE_KOERPER.concat(MOEWE_BEINE_SCHRITT)),
    moewePickt: sprite(MOEWE_PICKT),
    moeweRuft: sprite(MOEWE_RUFT),
    moeweStreckt: sprite(MOEWE_STRECKT),
    moeweGleitet: sprite(MOEWE_GLEITET),
    moeweOben: sprite(MOEWE_FLUEGEL_OBEN),
    moeweUnten: sprite(MOEWE_FLUEGEL_UNTEN),
    muschelZu: sprite(MUSCHEL_ZU),
    muschelOffen: sprite(MUSCHEL_OFFEN),
    jakobsmuschel: sprite(JAKOBSMUSCHEL),
    ausruf: sprite(AUSRUF),
  };

  // ---------- Zustand / state ----------
  var S = 2;            // Welt-Pixel pro Sprite-Pixel (Landschaft) / world pixels per sprite pixel (scenery)
  var T = 1;            // dasselbe für Tiere / the same for animals
  var F = {};           // Farben aus welt.json / colours from welt.json
  var ruhigSeit = 0;    // Sekunden seit es zuletzt laut war / seconds since it was last loud
  var rnd = P.zufall(1);
  var sandKoerner = [], wellen = [], wolken = [];
  var krabben = [], seesterne = [], delfine = [], moewen = [], muscheln = [], deko = [];
  var teilchen = [];    // Sandkörner und Spritzer, die durch die Luft fliegen / flying sand and splashes
  var ausrufe = [];     // „!“ über erschrockenen Tieren / "!" over scared animals

  // ---------- Kleine Helfer / small helpers ----------
  function horizontY(env) { return Math.round(env.h * HORIZONT); }
  function uferY(env) { return Math.round(env.h * UFER); }
  function zwischen(a, b) { return a + rnd() * (b - a); }

  /** Bewegt wert höchstens um schritt in Richtung ziel. / Moves value towards target by at most step. */
  function naeher(wert, ziel, schritt) {
    if (Math.abs(ziel - wert) <= schritt) return ziel;
    return wert + Math.sign(ziel - wert) * schritt;
  }

  /**
   * Setzt den Pinsel auf ein Sprite: (x, y) ist die Mitte unten. Danach zählen Koordinaten
   * in Sprite-Pixeln, (0, 0) ist oben links. Drehen geht um die Mitte des Sprites.
   * Places the brush on a sprite: (x, y) is the bottom centre; afterwards coordinates are
   * in sprite pixels with (0, 0) at the top left. Rotation is around the sprite's centre.
   */
  function aufSprite(ctx, x, y, breite, hoehe, opt, malen) {
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    var p = opt.tier ? T : S;
    ctx.scale(opt.spiegeln ? -p : p, p);
    if (opt.winkel) {
      ctx.translate(0, -hoehe / 2);
      ctx.rotate(opt.winkel);
      ctx.translate(0, hoehe / 2);
    }
    ctx.translate(-Math.floor(breite / 2), -hoehe);
    malen();
    ctx.restore();
  }

  function male(ctx, bild, x, y, opt) {
    aufSprite(ctx, x, y, bild.width, bild.height, opt || {}, function () {
      ctx.drawImage(bild, 0, 0);
    });
  }

  function maleTier(ctx, bild, x, y, opt) {
    opt = opt || {};
    opt.tier = true;
    male(ctx, bild, x, y, opt);
  }

  function glitzern(ctx, x, y) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(Math.round(x) - S, Math.round(y), 3 * S, S);
    ctx.fillRect(Math.round(x), Math.round(y) - S, S, 3 * S);
  }

  /** Flache Ellipse aus Pixeln (p = Pixelgröße), z. B. Schatten oder Sandhügel. / Flat pixel ellipse. */
  function huegel(ctx, x, boden, halbeBreite, hoehe, farbe, p) {
    ctx.fillStyle = farbe;
    for (var i = -halbeBreite; i <= halbeBreite; i++) {
      var h = Math.round(hoehe * (1 - (i * i) / (halbeBreite * halbeBreite)) + 0.4);
      if (h > 0) ctx.fillRect(Math.round(x + i * p), boden - h * p, p, h * p);
    }
  }

  function erschrecken(tier) {
    ausrufe.push({ tier: tier, zeit: 1.2 });
  }

  function sandWerfen(x, y, anzahl) {
    for (var i = 0; i < anzahl; i++) {
      var seite = rnd() < 0.5 ? -1 : 1;
      teilchen.push({
        x: x + seite * 6 * T, y: y - T,
        vx: seite * zwischen(10, 45) * T, vy: -zwischen(30, 70) * T,
        farbe: F.sandSchatten, leben: zwischen(0.5, 0.9),
      });
    }
  }

  function platschen(x, y, anzahl) {
    for (var i = 0; i < anzahl; i++) {
      teilchen.push({
        x: x, y: y,
        vx: zwischen(-25, 25) * T, vy: -zwischen(25, 60) * T,
        farbe: F.schaum, leben: zwischen(0.4, 0.8),
      });
    }
  }

  // ---------- Aufbau / setup ----------
  function aufbauen(env) {
    var w = env.w, h = env.h;
    S = Math.max(1, Math.round(h / 110));
    T = Math.max(1, Math.round(h / 150 * 2) / 2); // Tiere etwas kleiner, in halben Schritten / animals a bit smaller
    F = env.welt.farben;
    rnd = P.zufall(20261107);
    ruhigSeit = 0;
    teilchen = [];
    ausrufe = [];

    sandKoerner = [];
    for (var i = 0; i < Math.round((w * h) / 500); i++) {
      sandKoerner.push({ x: Math.floor(rnd() * w), y: Math.floor(zwischen(UFER + 0.05, 1) * h) });
    }
    wellen = [];
    for (var j = 0; j < Math.round(w / 14); j++) {
      wellen.push({ x: rnd() * w, hoehe: rnd(), laenge: Math.round(zwischen(4, 12)) * S, tempo: zwischen(0.6, 1.4) });
    }
    wolken = [
      { x: 0.12 * w, y: 0.14 * h, tempo: 1.2 },
      { x: 0.8 * w, y: 0.2 * h, tempo: 0.8 },
    ];

    // Positionen als Anteil von Breite und Höhe / positions as share of width and height
    krabben = [neueKrabbe(0, 0.1, 0.4, 0.84, env), neueKrabbe(1, 0.7, 0.86, 0.92, env)];
    seesterne = [neuerSeestern(0, 0.24, 0.63, env), neuerSeestern(1, 0.5, 0.68, env)];
    delfine = [neuerDelfin(0, env), neuerDelfin(1, env)];
    moewen = [neueMoewe(0, 0.12, 0.7, true, env), neueMoewe(1, 0.35, 0.16, false, env)];
    muscheln = [[0.36, 0.76], [0.9, 0.8]].map(function (p) {
      return { x: p[0] * w, y: Math.round(p[1] * h) };
    });
    deko = [[0.06, 0.6], [0.8, 0.66]].map(function (p) {
      return { x: p[0] * w, y: Math.round(p[1] * h) };
    });
  }

  // ---------- Himmel, Meer und Sand / sky, sea and sand ----------
  function himmel(ctx, env) {
    var oben = horizontY(env);
    var verlauf = ctx.createLinearGradient(0, 0, 0, oben);
    verlauf.addColorStop(0, F.himmel);
    verlauf.addColorStop(1, F.horizont);
    ctx.fillStyle = verlauf;
    ctx.fillRect(0, 0, env.w, oben);

    // Wolken ziehen langsam vorbei / clouds drift by slowly
    var breite = bilder.wolke.width * S;
    wolken.forEach(function (wolke) {
      var strecke = env.w + breite * 2;
      var x = ((wolke.x + breite + env.t * wolke.tempo * S) % strecke) - breite;
      male(ctx, bilder.wolke, x, wolke.y);
    });

    // Bei Lärm wird der Himmel grau / the sky turns grey when it is loud
    var grau = (1 - env.ruhe) * 0.3;
    if (grau > 0.01) {
      ctx.fillStyle = 'rgba(60, 70, 90, ' + grau.toFixed(3) + ')';
      ctx.fillRect(0, 0, env.w, oben);
    }
  }

  function meerUndSand(ctx, env) {
    var oben = horizontY(env), ufer = uferY(env);
    var unruhe = 1 - env.ruhe; // 0 = glattes Meer, 1 = aufgewühlt / 0 = calm sea, 1 = rough

    // Sand mit Körnern / sand with grains
    ctx.fillStyle = F.sand;
    ctx.fillRect(0, ufer, env.w, env.h - ufer);
    ctx.fillStyle = F.sandPunkte;
    sandKoerner.forEach(function (k) { ctx.fillRect(k.x, k.y, S, S); });

    // Wasserkante in Blöcken, schwappt vor und zurück / blocky shoreline that washes in and out
    var block = 4 * S;
    var weite = (2 + 3 * unruhe) * S;
    var schwappen = (Math.sin(env.t * 0.8) * 0.5 + 0.5) * weite;
    for (var x = 0; x < env.w; x += block) {
      var zacke = Math.round(Math.sin(x * 0.045) * 1.5 + Math.sin(x * 0.011 + 1)) * S;
      var kante = Math.round(ufer + zacke + schwappen);
      ctx.fillStyle = F.nasserSand;
      ctx.fillRect(x, ufer - 3 * S, block, zacke + weite + 5 * S);
      ctx.fillStyle = F.meer;
      ctx.fillRect(x, oben, block, kante - oben);
      ctx.fillStyle = F.schaum;
      ctx.fillRect(x, kante - S, block, S);
    }

    // Wellen-Streifen: bei Lärm schneller und mit Schaumkronen / faster with white caps when loud
    var tempo = (3 + 14 * unruhe) * S;
    wellen.forEach(function (welle, i) {
      var strecke = env.w + welle.laenge;
      var wx = ((welle.x + env.t * tempo * welle.tempo) % strecke) - welle.laenge;
      var wy = Math.round(oben + 3 * S + welle.hoehe * (ufer - oben - 8 * S));
      ctx.fillStyle = unruhe > 0.6 && i % 3 === 0 ? F.schaum : F.wellen;
      ctx.fillRect(Math.round(wx), wy, welle.laenge, S);
    });
  }

  function ecken(ctx, env) {
    var halb = (bilder.ecke.width * S) / 2;
    male(ctx, bilder.ecke, halb + S, env.h);
    male(ctx, bilder.ecke, env.w - halb - S, env.h, { spiegeln: true });
  }

  function liegeUndSchirm(ctx, env) {
    var x = Math.round(env.w * 0.68), boden = Math.round(env.h * 0.78);
    huegel(ctx, x + 8 * S, boden + S, 22, 2, F.sandSchatten, S); // Schatten / shadow
    var wackeln = env.stufe === 3 && Math.floor(env.t * 8) % 2 ? S : 0; // zittert bei Lärm / shakes when loud
    male(ctx, bilder.schirm, x + 10 * S + wackeln, boden - 2 * S);
    male(ctx, bilder.liege, x, boden);
  }

  // ---------- Muscheln / shells ----------
  function zeichneMuscheln(ctx, env) {
    deko.forEach(function (d) { maleTier(ctx, bilder.jakobsmuschel, d.x, d.y); });

    muscheln.forEach(function (m, i) {
      // Jede Muschel traut sich etwas später auf / each clam opens a little later
      var offen = env.stufe === 0 && ruhigSeit > 2 + i;
      maleTier(ctx, offen ? bilder.muschelOffen : bilder.muschelZu, m.x, m.y);
      if (offen && Math.sin(env.t * 2 + i * 2) > 0.9) glitzern(ctx, m.x, m.y - 5 * T);
    });
  }

  // ---------- Krabben / crabs ----------
  function neueKrabbe(nr, links, rechts, y, env) {
    var x = zwischen(links, rechts) * env.w;
    return {
      nr: nr, x: x, y: Math.round(y * env.h), oben: 12,
      links: links * env.w, rechts: rechts * env.w, ziel: x, pause: zwischen(0, 2),
      blick: 1,
      tiefe: 0,  // 0 = auf dem Sand, 1 = ganz eingegraben / 0 = on the sand, 1 = fully buried
      sprung: 0, // Hüpfer beim Rauskommen / hop when coming out
      laeuft: false,
    };
  }

  function bewegeKrabbe(k, env) {
    k.laeuft = false;

    if (env.stufe === 3) {
      // Erst bei „zu laut“ eingraben / dig in only when it is too loud
      if (k.tiefe === 0) erschrecken(k);
      if (k.tiefe < 1) {
        k.tiefe = naeher(k.tiefe, 1, env.dt * 0.6);
        if (rnd() < env.dt * 30) sandWerfen(k.x, k.y, 1);
      }
    } else if (k.tiefe > 0 && ruhigSeit > 1.5 + k.nr) {
      // Nach etwas Ruhe mit einem Hüpfer raus / pop out with a hop after some quiet
      k.tiefe = 0;
      k.sprung = 1;
      sandWerfen(k.x, k.y, 14);
    }
    if (k.sprung > 0) k.sprung = Math.max(0, k.sprung - env.dt * 1.8);

    if (env.stufe === 0 && k.tiefe === 0) {
      // Seitwärts hin und her laufen / scuttle sideways back and forth
      if (k.pause > 0) {
        k.pause -= env.dt;
      } else {
        k.laeuft = true;
        k.blick = k.ziel >= k.x ? 1 : -1;
        k.x = naeher(k.x, k.ziel, env.dt * 10 * T);
        if (k.x === k.ziel) {
          k.pause = zwischen(0.8, 2.5);
          k.ziel = zwischen(k.links, k.rechts);
        }
      }
    } else if (env.stufe >= 1) {
      // Schaut sich um, bei „etwas laut“ hektisch / looks around, nervously at stage 2
      var tempo = env.stufe === 2 ? 5 : 1.3;
      k.blick = Math.sin(env.t * tempo + k.nr * 2) > 0 ? 1 : -1;
    }
  }

  function zeichneKrabbe(ctx, k, env) {
    var sinken = Math.round(k.tiefe * 10);
    var hoch = Math.round(Math.sin(k.sprung * Math.PI) * 8);
    var graebt = env.stufe === 3 && k.tiefe < 1;
    var nervoes = env.stufe >= 2 && k.tiefe < 1; // zittert bei „etwas laut“ und beim Graben / trembles
    var zappeln = nervoes ? (Math.floor(env.t * 16) % 2 ? T : -T) : 0;

    // Scheren klappern bei Ruhe gemütlich, beim Graben wild / claws clack slowly, wildly when digging
    var klappern = graebt ? Math.floor(env.t * 10) % 2 : env.stufe === 0 && Math.floor(env.t * 3 + k.nr) % 3 === 0;
    var schritt = k.laeuft && Math.floor(env.t * 8) % 2;
    var bild = bilder.krabbe[(klappern ? 'zu' : 'offen') + (schritt ? '2' : '1')];
    var mund = env.stufe === 0 ? bilder.mundFroh : env.stufe === 1 ? bilder.mundGerade : bilder.mundO;

    // Was unter dem Sand ist, wird abgeschnitten / everything below the sand is cut off
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, env.w, k.y);
    ctx.clip();
    aufSprite(ctx, k.x + zappeln, k.y + (sinken - hoch) * T, 16, 10, { tier: true }, function () {
      ctx.drawImage(bild, 0, 0);
      ctx.drawImage(mund, mund === bilder.mundGerade ? 6 : 5, 5);

      // Augen auf Stielen: je tiefer die Krabbe steckt, desto länger die Stiele.
      // Ganz eingegraben taucht sie ab und zu ab und guckt wieder.
      // Eyes on stalks that grow as the crab sinks; when fully buried it ducks now and then.
      var stiel = 2 + sinken;
      if (sinken === 10 && Math.sin(env.t * 1.7 + k.nr) > 0.8) stiel -= 4;
      var augeY = 4 - stiel - 2;
      [{ auge: 4, stiel: 5 }, { auge: 10, stiel: 10 }].forEach(function (a) {
        ctx.fillStyle = FARBEN.R;
        ctx.fillRect(a.stiel, 4 - stiel, 1, stiel);
        ctx.fillStyle = FARBEN.w;
        ctx.fillRect(a.auge, augeY, 2, 2);
        ctx.fillStyle = FARBEN.k;
        ctx.fillRect(a.auge + (k.blick > 0 ? 1 : 0), augeY, 1, 1); // Pupille / pupil
      });
    });
    ctx.restore();

    if (k.tiefe > 0) huegel(ctx, k.x, k.y, 6 + Math.round(4 * k.tiefe), 1 + 2 * k.tiefe, F.sandSchatten, T);
  }

  // ---------- Seesterne / starfish ----------
  function neuerSeestern(nr, x, y, env) {
    return {
      nr: nr, heimX: x * env.w, heimY: Math.round(y * env.h), x: x * env.w, y: Math.round(y * env.h), oben: 14,
      winkel: 0,
      modus: 'liegt', // liegt · flieht · weg · kommt  /  lying · fleeing · gone · returning
    };
  }

  function bewegeSeestern(s, env) {
    var wasser = uferY(env) + 2 * T;

    if (env.stufe >= 3 && (s.modus === 'liegt' || s.modus === 'kommt')) {
      if (s.modus === 'liegt') erschrecken(s);
      s.modus = 'flieht';
    }

    if (s.modus === 'flieht') {
      // Rad schlagen bis ins Meer / cartwheel into the sea
      s.y = naeher(s.y, wasser, env.dt * 22 * T);
      s.winkel -= env.dt * 9;
      if (s.y === wasser) {
        s.modus = 'weg';
        platschen(s.x, wasser, 10);
      }
    } else if (s.modus === 'weg') {
      if (ruhigSeit > 3 + s.nr * 1.5) {
        s.modus = 'kommt';
        platschen(s.x, wasser, 6);
      }
    } else if (s.modus === 'kommt') {
      s.y = naeher(s.y, s.heimY, env.dt * 16 * T);
      s.winkel += env.dt * 7;
      if (s.y === s.heimY) {
        s.modus = 'liegt';
        s.winkel = ((s.winkel % (2 * Math.PI)) + 3 * Math.PI) % (2 * Math.PI) - Math.PI; // auf −π … π
      }
    } else {
      // Liegt: tanzt bei Stille, sonst langsam zurück in die Ruhelage / dances when quiet
      var ziel = env.stufe === 0 ? Math.sin(env.t * 2.5 + s.nr) * 0.3 : 0;
      s.winkel += (ziel - s.winkel) * Math.min(1, env.dt * 6);
    }
  }

  function zeichneSeestern(ctx, s, env) {
    if (s.modus === 'weg') return;
    var liegt = s.modus === 'liegt';
    var zittern = liegt && env.stufe === 2 ? (Math.floor(env.t * 18) % 2 ? T : -T) : 0;
    var huepfen = liegt && env.stufe === 0 ? Math.round(Math.abs(Math.sin(env.t * 2.5 + s.nr)) * 2) * T : 0;

    var gesicht = bilder.gesichtFroh;
    if (!liegt || env.stufe >= 2) gesicht = bilder.gesichtAngst;
    else if (Math.sin(env.t * 0.9 + s.nr * 2) > 0.97) gesicht = bilder.gesichtBlinzeln;
    else if (env.stufe === 1) gesicht = bilder.gesichtRuhig;

    aufSprite(ctx, s.x + zittern, s.y - huepfen, 13, 13, { tier: true, winkel: s.winkel }, function () {
      ctx.drawImage(bilder.seestern, 0, 0);
      ctx.drawImage(gesicht, 3, 4);
    });
  }

  // ---------- Delfine / dolphins ----------
  function neuerDelfin(nr, env) {
    return {
      nr: nr, x: env.w * (0.15 + 0.4 * nr), y: 0, oben: 4,
      bahn: 0.4 + 0.35 * nr, // Höhe im Meer: 0 = Horizont, 1 = Ufer / lane: 0 = horizon, 1 = shore
      richtung: nr ? -1 : 1,
      modus: 'da',           // da · flieht · weg  /  here · fleeing · gone
      sprung: -1,            // −1 = schwimmt, 0 … 1 = mitten im Sprung / −1 = swimming, 0 … 1 = jumping
      bisSprung: 2 + nr * 2.5,
    };
  }

  function bewegeDelfin(d, env) {
    var oben = horizontY(env), ufer = uferY(env);
    d.y = Math.round(oben + (ufer - oben) * d.bahn);

    if (env.stufe === 3 && d.modus === 'da') {
      d.modus = 'flieht';
      d.sprung = -1;
      d.richtung = d.x < env.w / 2 ? -1 : 1; // zum näheren Rand / towards the nearer edge
      erschrecken(d);
    }

    if (d.modus === 'weg') {
      if (ruhigSeit > 4 + d.nr * 2) {
        d.modus = 'da';
        d.richtung = rnd() < 0.5 ? 1 : -1;
        d.x = d.richtung > 0 ? -20 * T : env.w + 20 * T;
      }
      return;
    }

    if (d.modus === 'flieht') {
      d.x += d.richtung * env.dt * 70 * T;
      if (rnd() < env.dt * 20) platschen(d.x - d.richtung * 8 * T, d.y, 1);
      if (d.x < -25 * T || d.x > env.w + 25 * T) d.modus = 'weg';
      return;
    }

    if (d.sprung >= 0) {
      d.sprung += env.dt / 1.3;
      d.x += d.richtung * env.dt * 24 * T;
      if (d.sprung >= 1) {
        d.sprung = -1;
        d.bisSprung = zwischen(2.5, 5);
        platschen(d.x, d.y, 10);
      }
      return;
    }

    d.x += d.richtung * env.dt * 9 * T;
    if (d.x > env.w * 0.85 && d.richtung > 0) d.richtung = -1;
    if (d.x < env.w * 0.08 && d.richtung < 0) d.richtung = 1;
    if (env.stufe === 0) {
      d.bisSprung -= env.dt;
      if (d.bisSprung <= 0) {
        d.sprung = 0;
        platschen(d.x, d.y, 8);
      }
    }
  }

  function zeichneDelfin(ctx, d, env) {
    if (d.modus === 'weg') return;

    // Nur was über dem Wasser ist, ist zu sehen / only what is above the water is visible
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, env.w, d.y);
    ctx.clip();
    if (d.sprung >= 0) {
      // Bogen: hoch und wieder runter, die Nase zeigt in Flugrichtung / arc with nose along the path
      var hoehe = 26 * T, weite = 24 * T * 1.3;
      var y = d.y - Math.sin(d.sprung * Math.PI) * hoehe + 5 * T;
      var winkel = Math.atan2(-Math.cos(d.sprung * Math.PI) * Math.PI * hoehe, weite);
      maleTier(ctx, bilder.delfin, d.x, y, { spiegeln: d.richtung < 0, winkel: winkel });
    } else {
      // Beim Schwimmen schaut nur die Rückenflosse raus / only the dorsal fin shows
      var wippen = Math.sin(env.t * 3 + d.nr) > 0 ? T : 0;
      maleTier(ctx, bilder.delfin, d.x, d.y + 7 * T + wippen, { spiegeln: d.richtung < 0 });
    }
    ctx.restore();
  }

  // ---------- Möwen / seagulls ----------
  function neueMoewe(nr, x, y, sitzt, env) {
    return {
      nr: nr, sitzt: sitzt, // sitzt = wohnt am Strand, sonst kreist sie am Himmel / lives on the sand or circles
      heimX: x * env.w, heimY: Math.round(y * env.h),
      x: x * env.w, y: Math.round(y * env.h), oben: sitzt ? 11 : 5,
      ziel: x * env.w, richtung: 1, kreis: rnd() * 6,
      modus: 'zuhause', // zuhause · flieht · weg · kommt  /  home · fleeing · gone · returning
      tun: 'stehen',    // am Boden: stehen · laufen · picken · rufen · strecken / on the ground
      tunZeit: zwischen(0.5, 2),
      tempo: 0, hops: 0, fluchtX: 0, fluchtY: 0,
    };
  }

  function kreisPunkt(m, env) {
    return { x: m.heimX + Math.cos(m.kreis) * env.w * 0.12, y: m.heimY + Math.sin(m.kreis) * env.h * 0.05 };
  }

  /** Fliegt geradeaus auf ein Ziel zu, true = angekommen. / Flies straight to a target, true = arrived. */
  function fliegeZu(m, zielX, zielY, tempo, dt) {
    var dx = zielX - m.x, dy = zielY - m.y;
    var abstand = Math.hypot(dx, dy);
    if (abstand <= tempo * dt) {
      m.x = zielX;
      m.y = zielY;
      return true;
    }
    m.x += (dx / abstand) * tempo * dt;
    m.y += (dy / abstand) * tempo * dt;
    if (Math.abs(dx) > 1) m.richtung = dx > 0 ? 1 : -1;
    return false;
  }

  function bewegeMoewe(m, env) {
    if (env.stufe === 3 && (m.modus === 'zuhause' || m.modus === 'kommt')) {
      if (m.modus === 'zuhause') erschrecken(m);
      m.modus = 'flieht';
      m.tempo = 15 * T; // startet langsam und wird schneller / starts slow, speeds up
      m.fluchtX = m.x < env.w / 2 ? -30 * T : env.w + 30 * T;
      m.fluchtY = -20 * T;
    }

    if (m.modus === 'flieht') {
      // Erst steil hoch, dann immer schneller weg / first steeply up, then away faster and faster
      m.tempo = Math.min(90 * T, m.tempo + env.dt * 120 * T);
      var steil = m.tempo < 50 * T;
      if (fliegeZu(m, steil ? m.x : m.fluchtX, m.fluchtY, m.tempo, env.dt)) m.modus = 'weg';
    } else if (m.modus === 'weg') {
      if (ruhigSeit > 5 + m.nr * 2) {
        m.modus = 'kommt';
        m.x = m.richtung > 0 ? env.w + 20 * T : -20 * T; // kommt von der Seite, zu der sie weg ist
        m.y = env.h * 0.1;
      }
    } else if (m.modus === 'kommt') {
      var ziel = m.sitzt ? { x: m.heimX, y: m.heimY } : kreisPunkt(m, env);
      // Kurz vor der Landung langsamer / slows down just before landing
      var nah = Math.hypot(ziel.x - m.x, ziel.y - m.y) < 20 * T;
      if (fliegeZu(m, ziel.x, ziel.y, (nah ? 18 : 35) * T, env.dt)) {
        m.modus = 'zuhause';
        m.ziel = m.x;
        m.tun = 'stehen';
        m.tunZeit = 1;
        if (m.sitzt) sandWerfen(m.x, m.y, 4);
      }
    } else if (m.sitzt) {
      amBoden(m, env);
    } else {
      // Kreist gemütlich am Himmel / circles lazily in the sky
      m.kreis += env.dt * 0.5;
      var p = kreisPunkt(m, env);
      m.x = p.x;
      m.y = p.y + Math.sin(env.t * 1.3 + m.nr) * 2 * T;
    }
  }

  /** Was die Möwe am Strand als Nächstes tut. / What the gull does next on the beach. */
  function naechsteTat(m, env) {
    var wurf = rnd();
    if (wurf < 0.35) {
      m.tun = 'laufen';
      m.ziel = m.heimX + zwischen(-20, 20) * T;
    } else if (wurf < 0.6) {
      m.tun = 'picken';
      m.tunZeit = zwischen(1, 2);
    } else if (wurf < 0.75) {
      m.tun = 'rufen';
      m.tunZeit = 1;
    } else if (wurf < 0.85) {
      m.tun = 'strecken';
      m.tunZeit = 0.8;
    } else {
      m.tun = 'stehen';
      m.tunZeit = zwischen(1, 2.5);
      if (rnd() < 0.5) m.richtung = -m.richtung; // dreht sich um / turns around
    }
  }

  function amBoden(m, env) {
    if (m.hops > 0) m.hops = Math.max(0, m.hops - env.dt * 5);

    if (env.stufe !== 0) {
      // Leise: steht und schaut sich um. Etwas laut: hektisch und hüpft nervös.
      // Quiet: stands and looks around. A bit loud: looks around hectically and hops nervously.
      m.tun = 'stehen';
      var tempo = env.stufe === 2 ? 4 : 0.9;
      m.richtung = Math.sin(env.t * tempo + m.nr * 2) > 0 ? 1 : -1;
      if (env.stufe === 2 && m.hops === 0 && rnd() < env.dt * 0.8) m.hops = 1;
      return;
    }

    if (m.tun === 'laufen') {
      m.richtung = m.ziel >= m.x ? 1 : -1;
      m.x = naeher(m.x, m.ziel, env.dt * 8 * T);
      if (m.x === m.ziel) naechsteTat(m, env);
      return;
    }
    m.tunZeit -= env.dt;
    if (m.tunZeit <= 0) naechsteTat(m, env);
  }

  function zeichneMoewe(ctx, m, env) {
    if (m.modus === 'weg') return;

    if (m.modus === 'zuhause' && m.sitzt) {
      var bild = bilder.moeweSteht;
      var y = m.y;
      if (m.tun === 'laufen') {
        var schritt = Math.floor(env.t * 6) % 2;
        bild = schritt ? bilder.moeweSchritt : bilder.moeweSteht;
        y -= schritt * T; // wippt beim Laufen / bobs while walking
      } else if (m.tun === 'picken') {
        bild = Math.floor(env.t * 4) % 2 ? bilder.moewePickt : bilder.moeweSteht;
      } else if (m.tun === 'rufen') {
        bild = Math.floor(env.t * 3) % 2 ? bilder.moeweRuft : bilder.moeweSteht;
      } else if (m.tun === 'strecken') {
        bild = bilder.moeweStreckt;
      }
      y -= Math.round(Math.sin(m.hops * Math.PI) * 3) * T;
      maleTier(ctx, bild, m.x, y, { spiegeln: m.richtung < 0 });
      return;
    }

    // In der Luft: auf der Flucht wild flattern, sonst meist gleiten
    // In the air: flap wildly when fleeing, otherwise mostly glide
    var schlaege = 0;
    if (m.modus === 'flieht') schlaege = 10;
    else if (m.modus === 'kommt' && Math.hypot(m.heimX - m.x, m.heimY - m.y) < 20 * T) schlaege = 8;
    else if (Math.sin(env.t * 0.8 + m.nr * 3) > 0.4) schlaege = 3;
    var fluegel = bilder.moeweGleitet;
    if (schlaege) fluegel = Math.floor(env.t * schlaege + m.nr) % 2 ? bilder.moeweOben : bilder.moeweUnten;
    maleTier(ctx, fluegel, m.x, m.y);
  }

  // ---------- Fliegende Teilchen und „!“ / flying particles and "!" ----------
  function zeichneTeilchen(ctx, env) {
    teilchen = teilchen.filter(function (t) {
      t.leben -= env.dt;
      t.vy += 160 * T * env.dt; // Schwerkraft / gravity
      t.x += t.vx * env.dt;
      t.y += t.vy * env.dt;
      ctx.fillStyle = t.farbe;
      ctx.fillRect(Math.round(t.x), Math.round(t.y), T, T);
      return t.leben > 0;
    });
  }

  function zeichneAusrufe(ctx, env) {
    ausrufe = ausrufe.filter(function (a) {
      a.zeit -= env.dt;
      var huepfen = Math.round(Math.abs(Math.sin(a.zeit * 8))) * T;
      maleTier(ctx, bilder.ausruf, a.tier.x, a.tier.y - (a.tier.oben + 1) * T - huepfen);
      return a.zeit > 0;
    });
  }

  // ---------- Anmelden / register ----------
  MM.welten.register('strand', {
    init: aufbauen,
    resize: aufbauen,

    draw: function (ctx, env) {
      if (env.stufe === 3) ruhigSeit = 0;
      else ruhigSeit += env.dt;

      krabben.forEach(function (k) { bewegeKrabbe(k, env); });
      seesterne.forEach(function (s) { bewegeSeestern(s, env); });
      delfine.forEach(function (d) { bewegeDelfin(d, env); });
      moewen.forEach(function (m) { bewegeMoewe(m, env); });

      // Von hinten nach vorne malen / paint from back to front
      himmel(ctx, env);
      meerUndSand(ctx, env);
      delfine.forEach(function (d) { zeichneDelfin(ctx, d, env); });
      ecken(ctx, env);
      zeichneMuscheln(ctx, env);
      seesterne.forEach(function (s) { zeichneSeestern(ctx, s, env); });
      liegeUndSchirm(ctx, env);
      krabben.forEach(function (k) { zeichneKrabbe(ctx, k, env); });
      moewen.forEach(function (m) { zeichneMoewe(ctx, m, env); });
      zeichneTeilchen(ctx, env);
      zeichneAusrufe(ctx, env);
    },
  });
})();
