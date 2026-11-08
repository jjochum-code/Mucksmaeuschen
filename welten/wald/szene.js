/*
 * Szene „Wald“ / Scene "Forest"
 *
 * Ein Pixel-Wald mit Bewohnern, die auf die Lautstärke reagieren.
 * A pixel forest whose residents react to the noise level.
 *
 *   Stufe          Eichhörnchen       Igel              Hase             Vögel            Schmetterlinge    Blumen
 *   0 still        flitzt, knabbert   schnüffelt herum  hoppelt herum    singen           flattern          offen
 *   1 leise        sitzt still        bleibt stehen     sitzt still      sitzen still     sitzen auf Blume  zu
 *   2 etwas laut   zittert, guckt     zittert           guckt hektisch   gucken hektisch  sitzen auf Blume  zu
 *   3 zu laut      klettert auf Baum  rollt sich ein    hoppelt weg      fliegen weg      fliegen weg       zu
 *
 * Verstecken tun sich alle erst bei „Zu laut!“. Danach kommen sie nach und nach zurück.
 * Everyone hides only at "too loud". Afterwards they come back one after another.
 */
'use strict';

(function () {
  var P = MM.welten.pixel;

  // ---------- Aufteilung / layout ----------
  var BODEN = 0.6; // Himmel → Wiese (Anteil der Höhe) / sky → meadow (share of the height)

  // ---------- Farben der Pixel-Bilder / sprite colours ----------
  // Jeder Buchstabe in den Pixel-Bildern unten steht für eine Farbe.
  // Each letter in the sprites below stands for one colour.
  var FARBEN = {
    k: '#2a2a35', // Augen, Nase / eyes, nose
    w: '#ffffff',
    c: '#f4fbff', // Wolke / cloud
    e: '#c8692c', // Eichhörnchen / squirrel
    E: '#7f3c14',
    i: '#e8924f', // Eichhörnchen hell / squirrel highlight
    x: '#4a1f08', // Eichhörnchen-Umriss vor dem Stamm / squirrel outline against the trunk
    b: '#f3d1a0', // Bauch / belly
    n: '#7a4a1f', // Nuss / nut
    s: '#8a7055', // Igel-Stacheln / hedgehog spines
    S: '#5a4632',
    q: '#b09272', // Stachelspitzen / spine tips
    f: '#e6c9a0', // Igel-Gesicht / hedgehog face
    g: '#b8aa98', // Hase / rabbit
    G: '#8a7f71',
    j: '#dcd3c6', // Hase hell / rabbit highlight
    O: '#5e554b', // Hase Umriss / rabbit outline
    p: '#f2a7b8', // rosa / pink
    d: '#7a5a3c', // Vogel / bird
    D: '#553c26',
    r: '#e8693c', // Rotkehlchen-Brust / robin breast
    y: '#f0b030', // Schnabel / beak
    m: '#ffd23f', // Schmetterling / butterfly
    M: '#f08a2a',
    R: '#d93a2b', // Fliegenpilz / toadstool
    B: '#8a5a2b', // Steinpilz / porcini
    z: '#b3804a',
    u: '#f3e6cc', // Pilzstiel / stem
    U: '#d8c8a4', // Lamellen / gills
    L: '#3f8f35', // Gras dunkel / dark grass
    l: '#a5dc6b', // Gras hell / light grass
    h: '#b07a45', // Holz / wood
    H: '#7d5530',
    t: '#e0b07a', // Baumstumpf oben / top of the stump
    T: '#a8743f',
  };

  // ---------- Pixel-Bilder / sprites ('.' = durchsichtig / transparent) ----------
  var WOLKE = [
    '.....cccc......',
    '...cccccccc....',
    '.cccccccccccc..',
    'ccccccccccccccc',
  ];

  // Drei Sorten Grasbüschel / three kinds of grass tufts
  var GRAS = [
    ['L...L', '.L.L.', '..L..'],
    ['..l..', 'l.l.l', '.lLl.', '..L..'],
    ['.l...l.', '..l.l..', 'L.lLl.L', '.LLLLL.'],
  ];

  var BAUMSTUMPF = [
    '..TTTTTTTT..',
    '.TttttttttT.',
    '.TtTTTTTTtT.',
    '.TttttttttT.',
    '.hHhhHhhHhh.',
    '.hhHhhHhhHh.',
    'hhHhhhhHhhhh',
    'HhhhHhhhhHhH',
  ];

  // Pilze / mushrooms
  var FLIEGENPILZ = [
    '...RRR...',
    '.RRwRRRR.',
    'RRRRRwRRR',
    'RwRRRRRwR',
    '.UUUUUUU.',
    '...uuu...',
    '...uwu...',
    '..uuuuu..',
  ];
  var STEINPILZ = [
    '..BBBB..',
    '.BzzBBB.',
    'BzBBBBBB',
    '.UUUUUU.',
    '..uuuu..',
    '..uuuu..',
    '.uuuuuu.',
  ];
  var PILZCHEN = ['.BBB.', 'BzBBB', '..u..', '.uuu.'];

  // Blumen: 'p' wird je Blume umgefärbt / 'p' gets a different colour per flower
  var BLUME_OFFEN = ['.ppp.', 'ppypp', '.ppp.', '..L..', '.LL..', '..L..', '..L..'];
  var BLUME_ZU = ['.....', '..p..', '.ppp.', '..L..', '.LL..', '..L..', '..L..'];
  var TULPE_OFFEN = ['p.p.p', 'ppppp', 'ppppp', '.ppp.', '..L..', '.LL..', '..LL.', '..L..'];
  var TULPE_ZU = ['.....', '..p..', '.ppp.', '.ppp.', '..L..', '.LL..', '..LL.', '..L..'];
  var GAENSEBLUEMCHEN_OFFEN = ['.w.w.', 'wwyww', '.w.w.', '..L..', '..L..'];
  var GAENSEBLUEMCHEN_ZU = ['.....', '..w..', '..w..', '..L..', '..L..'];

  // Blumensorten: offen bei Stille, sonst zu / kinds of flowers: open when quiet, otherwise closed
  var BLUMEN_ARTEN = {
    blume: { offen: BLUME_OFFEN, zu: BLUME_ZU },
    tulpe: { offen: TULPE_OFFEN, zu: TULPE_ZU },
    gaensebluemchen: { offen: GAENSEBLUEMCHEN_OFFEN, zu: GAENSEBLUEMCHEN_ZU },
  };

  // Eichhörnchen: Körper und Schwanz getrennt, damit der Schwanz wippen kann.
  // Squirrel: body and tail separate so the tail can swish.
  var EICHHOERNCHEN_SITZT = [
    '......E.E..',
    '.....EeeeE.',
    '.....Eiekee',
    '.....Eieeek',
    '....EEeeeE.',
    '...Eeibbe..',
    '...Eeibbbe.',
    '..Eeeibbee.',
    '..Eeeebbb..',
    '..Eeeeebb..',
    '..EEeeeeE..',
    '...EE..EEe.',
  ];
  var EICHHOERNCHEN_SCHWANZ = [
    '.EEEE...',
    'EiiieE..',
    'EieeeeE.',
    '.E..eeE.',
    '.....eE.',
    '....EeeE',
    '....EieE',
    '...EiieE',
    '...Eiee.',
    '..Eiiee.',
    '..Eieee.',
    '...EEEE.',
  ];
  // Springen: gestreckt in der Luft, gesammelt beim Aufkommen / bounding: stretched and gathered
  var EICHHOERNCHEN_GESTRECKT = [
    '.EEEE...........',
    'EiiiiE......E.E.',
    'EiEEiiE....EeeeE',
    '.E..EiiE..Eiekee',
    '.....EiiEEeieeek',
    '......EeeiiieebE',
    '.....EEeeeeeebE.',
    '....EeE....EeE..',
    '...EE.......EE..',
  ];
  var EICHHOERNCHEN_GESAMMELT = [
    '..EEE.........',
    '.EiiiE........',
    'EiEEiiE...E.E.',
    'E...EiE..EeeeE',
    '.....EiEEiekee',
    '.....EeEeieeek',
    '....EeeiiieebE',
    '....EeeeeeebE.',
    '.....EeEEeeE..',
    '....EE.EEEE...',
  ];
  // Am Stamm von hinten, Pfoten abwechselnd / on the trunk from behind, paws alternating
  var EICHHOERNCHEN_KLETTERT_1 = [
    '..x...x..',
    '..xiiix..',
    '.xiiiiix.',
    'x.xiiix.x',
    'xxxibixxx',
    '..xibix..',
    '..xiiix..',
    '.xxeeexx.',
    'x..xex..x',
    '...xix...',
  ];
  var EICHHOERNCHEN_KLETTERT_2 = [
    '..x...x..',
    '..xiiix..',
    '.xiiiiix.',
    '..xiiix..',
    'x.xibix.x',
    'xxxibixxx',
    '..xiiix..',
    'xxxeeexxx',
    '...xex...',
    '...xix...',
  ];
  // Schwanz hängt runter (beim Klettern und aus der Baumkrone) / hanging tail
  var EICHHOERNCHEN_SCHWANZ_HAENGT = ['.xix.', 'xiiex', 'xieex', 'xieex', 'xiiex', '.xiex', '.xex.', '..x..'];

  var IGEL_KOERPER = [
    '....S.S.S.S.....',
    '..SSqSsSqSsSS...',
    '.SqSsSqSsSqSsff.',
    'SsSqSsSqSsSfkff.',
    'SqSsSqSsSqSffffk',
    '.SsSqSsSqSsfff..',
  ];
  var IGEL_BEINE_1 = ['...ff.....ff....'];
  var IGEL_BEINE_2 = ['..ff.....ff.....'];
  var IGEL_KUGEL = [
    '..S.S.S...',
    '.SqSsSqS..',
    'SsSqSsSqS.',
    'qSsSqSsSqS',
    'SsSqSsSqSs',
    'sSqSsSqSsS',
    '.sSsSqSsS.',
    '..SsSsSs..',
  ];

  var HASE = [
    '........OO.OO...',
    '.......OjgOjgO..',
    '.......OpgOpgO..',
    '.......OpgOpgO..',
    '........OgOggO..',
    '........OjjjjjO.',
    '.......OjjgggwkO',
    '.......OjgggggGp',
    '..OOOOOOggggggGO',
    '.OjjjjjjgggggOO.',
    'OjjjgggggggggO..',
    'wjjgggggggggGO..',
    'wwgggggggggGGO..',
    'OwgggggGGggGO...',
    '.OGGGGGOOgGGO...',
    '..OOOOO..OOOO...',
  ];

  var VOGEL_SITZT = [
    '....ddd..',
    '...dddkyy',
    '..ddrrrd.',
    '.dDdrrrr.',
    'dDDdrrrw.',
    '.dDdwwww.',
    '...y..y..',
  ];
  var VOGEL_SINGT = [
    '....ddd.y',
    '...dddky.',
    '..ddrrrdy',
    '.dDdrrrr.',
    'dDDdrrrw.',
    '.dDdwwww.',
    '...y..y..',
  ];
  var VOGEL_FLUEGEL_OBEN = ['D.......D', '.dD...Dd.', '...ddry..', '.........'];
  var VOGEL_FLUEGEL_UNTEN = ['.........', '...ddry..', '.dD...Dd.', 'D.......D'];
  var NOTE = ['.kk', '.k.', 'kk.', 'kk.'];

  var FALTER_AUF = ['mm.mm', 'MmkmM', '.mkm.', 'Mm.mM'];
  var FALTER_ZU = ['.m.m.', '.MkM.', '..k..', '..k..'];

  // Sprechblase mit „!“, wenn sich ein Tier erschreckt / "!" bubble when an animal gets scared
  var AUSRUF = ['.www.', 'wwRww', 'wwRww', 'wwRww', 'wwwww', 'wwRww', '.www.'];

  /**
   * Macht aus einem Pixel-Bild (Text) ein kleines Canvas. ersatz färbt Buchstaben um.
   * Turns a text sprite into a canvas; ersatz overrides letter colours.
   */
  function sprite(zeilen, ersatz) {
    var farben = Object.assign({}, FARBEN, ersatz || {});
    var breite = Math.max.apply(null, zeilen.map(function (z) { return z.length; }));
    var cv = document.createElement('canvas');
    cv.width = breite;
    cv.height = zeilen.length;
    var c = cv.getContext('2d');
    zeilen.forEach(function (zeile, y) {
      for (var x = 0; x < zeile.length; x++) {
        var farbe = farben[zeile[x]];
        if (!farbe) continue;
        c.fillStyle = farbe;
        c.fillRect(x, y, 1, 1);
      }
    });
    return cv;
  }

  /** Blumenbild einer Sorte in einer Farbe, jedes nur einmal gemalt. / Flower sprite, made once per kind and colour. */
  var blumenBilder = {};
  function blumenBild(art, farbe) {
    var name = art + farbe;
    if (!blumenBilder[name]) {
      blumenBilder[name] = {
        offen: sprite(BLUMEN_ARTEN[art].offen, { p: farbe }),
        zu: sprite(BLUMEN_ARTEN[art].zu, { p: farbe }),
      };
    }
    return blumenBilder[name];
  }

  var bilder = {
    wolke: sprite(WOLKE),
    gras: GRAS.map(function (g) { return sprite(g); }),
    stumpf: sprite(BAUMSTUMPF),
    pilze: {
      fliegenpilz: sprite(FLIEGENPILZ),
      steinpilz: sprite(STEINPILZ),
      pilzchen: sprite(PILZCHEN),
    },
    hoernchenSitzt: sprite(EICHHOERNCHEN_SITZT),
    hoernchenSchwanz: sprite(EICHHOERNCHEN_SCHWANZ),
    hoernchenGestreckt: sprite(EICHHOERNCHEN_GESTRECKT),
    hoernchenGesammelt: sprite(EICHHOERNCHEN_GESAMMELT),
    hoernchenKlettert1: sprite(EICHHOERNCHEN_KLETTERT_1),
    hoernchenKlettert2: sprite(EICHHOERNCHEN_KLETTERT_2),
    hoernchenSchwanzHaengt: sprite(EICHHOERNCHEN_SCHWANZ_HAENGT),
    igel1: sprite(IGEL_KOERPER.concat(IGEL_BEINE_1)),
    igel2: sprite(IGEL_KOERPER.concat(IGEL_BEINE_2)),
    igelKugel: sprite(IGEL_KUGEL),
    hase: sprite(HASE),
    vogelSitzt: sprite(VOGEL_SITZT),
    vogelSingt: sprite(VOGEL_SINGT),
    vogelOben: sprite(VOGEL_FLUEGEL_OBEN),
    vogelUnten: sprite(VOGEL_FLUEGEL_UNTEN),
    note: sprite(NOTE),
    falter: [
      { auf: sprite(FALTER_AUF), zu: sprite(FALTER_ZU) },
      { auf: sprite(FALTER_AUF, { m: '#8fd3ff', M: '#3f8fd9' }), zu: sprite(FALTER_ZU, { m: '#8fd3ff', M: '#3f8fd9' }) },
    ],
    ausruf: sprite(AUSRUF),
  };

  // ---------- Zustand / state ----------
  var S = 2;            // Welt-Pixel pro Sprite-Pixel (Landschaft) / world pixels per sprite pixel (scenery)
  var T = 1;            // dasselbe für Tiere / the same for animals
  var F = {};           // Farben aus welt.json / colours from welt.json
  var ruhigSeit = 0;    // Sekunden seit es zuletzt zu laut war / seconds since it was last too loud
  var rnd = P.zufall(1);
  var wolken = [], hinten = [], grasBueschel = [], grasPunkte = [], baeume = [], buesche = [], pilze = [], blumen = [];
  var stumpf = null, hoernchen = null, igel = null, hase = null, voegel = [], falter = [];
  var teilchen = [];    // Blätter und Staub, die durch die Luft fliegen / flying leaves and dust
  var ausrufe = [];     // „!“ über erschrockenen Tieren / "!" over scared animals
  var noten = [];       // Musiknoten der Vögel / the birds' music notes

  // ---------- Kleine Helfer / small helpers ----------
  function bodenY(env) { return Math.round(env.h * BODEN); }
  function zwischen(a, b) { return a + rnd() * (b - a); }

  /** Bewegt wert höchstens um schritt in Richtung ziel. / Moves value towards target by at most step. */
  function naeher(wert, ziel, schritt) {
    if (Math.abs(ziel - wert) <= schritt) return ziel;
    return wert + Math.sign(ziel - wert) * schritt;
  }

  /** Zittern: abwechselnd links und rechts. / Trembling: alternating left and right. */
  function zittern(env) {
    return Math.floor(env.t * 16) % 2 ? T : -T;
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

  /** Runder Klecks aus Pixel-Blöcken, z. B. Baumkrone oder Busch. / Round blob made of pixel blocks. */
  function klecks(ctx, cx, cy, r, block, farbe) {
    ctx.fillStyle = farbe;
    for (var y = -r; y <= r; y += block) {
      for (var x = -r; x <= r; x += block) {
        if (x * x + y * y > r * r) continue;
        ctx.fillRect(Math.round((cx + x) / block) * block, Math.round((cy + y) / block) * block, block, block);
      }
    }
  }

  /** Dunkler Klecks mit hellem Fleck oben links – sieht aus wie Laub. / Dark blob with a light patch: foliage. */
  function laub(ctx, k) {
    klecks(ctx, k.x, k.y, k.r, 2 * S, F.blattDunkel);
    klecks(ctx, k.x - k.r * 0.2, k.y - k.r * 0.25, k.r * 0.7, 2 * S, F.blatt);
  }

  function erschrecken(tier) {
    ausrufe.push({ tier: tier, zeit: 1.2 });
  }

  function aufwirbeln(x, y, anzahl, farbe) {
    for (var i = 0; i < anzahl; i++) {
      teilchen.push({
        x: x, y: y,
        vx: zwischen(-25, 25) * T, vy: -zwischen(20, 50) * T,
        farbe: farbe, leben: zwischen(0.4, 0.8),
      });
    }
  }

  /** Fliegt geradeaus auf ein Ziel zu, true = angekommen. / Flies straight to a target, true = arrived. */
  function fliegeZu(tier, zielX, zielY, tempo, dt) {
    var dx = zielX - tier.x, dy = zielY - tier.y;
    var abstand = Math.hypot(dx, dy);
    if (abstand <= tempo * dt) {
      tier.x = zielX;
      tier.y = zielY;
      return true;
    }
    tier.x += (dx / abstand) * tempo * dt;
    tier.y += (dy / abstand) * tempo * dt;
    if (Math.abs(dx) > 1) tier.richtung = dx > 0 ? 1 : -1;
    return false;
  }

  // ---------- Aufbau / setup ----------
  function aufbauen(env) {
    var w = env.w, h = env.h;
    S = Math.max(1, Math.round(h / 110));
    T = Math.max(1, Math.round((h / 120) * 2) / 2); // Tiere in halben Schritten / animals in half steps
    F = env.welt.farben;
    rnd = P.zufall(20261108);
    ruhigSeit = 0;
    teilchen = [];
    ausrufe = [];
    noten = [];

    wolken = [
      { x: 0.3 * w, y: 0.14 * h, tempo: 1 },
      { x: 0.52 * w, y: 0.08 * h, tempo: 0.7 },
      { x: 0.66 * w, y: 0.22 * h, tempo: 1.3 },
    ];

    // Bäume im Dunst hinten / hazy trees in the background
    hinten = [0.14, 0.24, 0.72, 0.84].map(function (x, i) {
      return { x: x * w, krone: (i % 2 ? 0.06 : 0.09) * h, hoehe: (i % 2 ? 0.1 : 0.17) * h };
    });

    // Grasbüschel, helle und dunkle Halme, kleine Blüten / tufts, light and dark blades, tiny blossoms
    grasBueschel = [];
    for (var i = 0; i < Math.round(w / 12); i++) {
      grasBueschel.push({ x: rnd() * w, y: Math.round(zwischen(BODEN + 0.04, 0.99) * h), art: Math.floor(rnd() * GRAS.length) });
    }
    grasBueschel.sort(function (a, b) { return a.y - b.y; }); // hinten zuerst / back first
    grasPunkte = [];
    for (var k = 0; k < Math.round((w * h) / 300); k++) {
      var wurf = rnd();
      grasPunkte.push({
        x: Math.floor(rnd() * w), y: Math.floor(zwischen(BODEN + 0.02, 1) * h),
        farbe: wurf < 0.45 ? F.grasHell : wurf < 0.9 ? F.grasDunkel : wurf < 0.95 ? '#ffffff' : '#ffe066',
      });
    }

    baeume = [neuerBaum(env, false), neuerBaum(env, true)];
    buesche = [];
    [0.06, 0.94].forEach(function (x) {
      for (var j = 0; j < 4; j++) {
        buesche.push({ x: (x + zwischen(-0.05, 0.05)) * w, y: bodenY(env) + zwischen(-0.02, 0.03) * h, r: zwischen(0.04, 0.06) * h });
      }
    });

    // Positionen als Anteil von Breite und Höhe / positions as share of width and height
    stumpf = { x: 0.3 * w, y: Math.round(0.7 * h) };
    // Pilze: am Stumpf, unter den Bäumen, im Gras / mushrooms: at the stump, under the trees, in the grass
    var P_ = bilder.pilze;
    pilze = [
      [0.265, 0.705, P_.pilzchen], [0.335, 0.71, P_.steinpilz], [0.35, 0.715, P_.pilzchen],
      [0.08, 0.68, P_.fliegenpilz], [0.12, 0.69, P_.pilzchen],
      [0.9, 0.7, P_.steinpilz], [0.94, 0.71, P_.fliegenpilz],
      [0.2, 0.93, P_.fliegenpilz], [0.235, 0.94, P_.pilzchen],
      [0.84, 0.91, P_.steinpilz], [0.7, 0.95, P_.pilzchen],
    ].map(function (p) {
      return { x: p[0] * w, y: Math.round(p[1] * h), bild: p[2] };
    }).sort(function (a, b) { return a.y - b.y; });
    // Blumen auf der Wiese. Auf den ersten beiden ruhen sich die Schmetterlinge aus.
    // Flowers on the meadow. The butterflies rest on the first two.
    blumen = [
      [0.44, 0.75, 'blume', '#ff8fb8'], [0.53, 0.82, 'blume', '#b77cf0'], [0.62, 0.73, 'blume', '#ffffff'],
      [0.16, 0.8, 'tulpe', '#e8453c'], [0.19, 0.83, 'tulpe', '#ffd23f'], [0.13, 0.84, 'gaensebluemchen'],
      [0.38, 0.67, 'gaensebluemchen'], [0.405, 0.69, 'gaensebluemchen'], [0.47, 0.66, 'blume', '#ff9a3c'],
      [0.58, 0.67, 'tulpe', '#ff8fb8'], [0.67, 0.68, 'blume', '#8fd3ff'],
      [0.28, 0.84, 'gaensebluemchen'], [0.31, 0.86, 'blume', '#ffd23f'],
      [0.71, 0.86, 'tulpe', '#e8453c'], [0.74, 0.88, 'gaensebluemchen'], [0.77, 0.85, 'blume', '#b77cf0'],
      [0.88, 0.8, 'tulpe', '#ffd23f'], [0.08, 0.92, 'blume', '#ff8fb8'],
    ].map(function (b) {
      return {
        x: b[0] * w, y: Math.round(b[1] * h),
        bild: blumenBild(b[2], b[3] || '#ffffff'),
        warten: zwischen(1, 5), // so viele Sekunden Ruhe, bis sie aufgeht / seconds of quiet until it opens
      };
    });

    hoernchen = neuesHoernchen(env);
    igel = neuerIgel(env);
    hase = neuerHase(env);
    var ast = baeume[0].ast;
    voegel = [
      neuerVogel(0, ast.spitzeX, ast.spitzeY),
      neuerVogel(1, stumpf.x, stumpf.y - bilder.stumpf.height * T),
    ];
    falter = [neuerFalter(0, env), neuerFalter(1, env)];
  }

  // ---------- Himmel, Hintergrund, Wiese / sky, background, meadow ----------
  function hintergrund(ctx, env) {
    var boden = bodenY(env);
    var verlauf = ctx.createLinearGradient(0, 0, 0, boden);
    verlauf.addColorStop(0, F.himmel);
    verlauf.addColorStop(1, F.horizont);
    ctx.fillStyle = verlauf;
    ctx.fillRect(0, 0, env.w, boden);

    // Wolken ziehen langsam vorbei / clouds drift by slowly
    var breite = bilder.wolke.width * S;
    wolken.forEach(function (wolke) {
      var strecke = env.w + breite * 2;
      var x = ((wolke.x + breite + env.t * wolke.tempo * S) % strecke) - breite;
      male(ctx, bilder.wolke, x, wolke.y);
    });

    // Bäume und Hecke im Dunst / hazy trees and hedge
    hinten.forEach(function (b) {
      ctx.fillStyle = F.hinten;
      ctx.fillRect(Math.round(b.x - 2 * S), boden - b.hoehe, 4 * S, b.hoehe);
      klecks(ctx, b.x, boden - b.hoehe, b.krone, 2 * S, F.hinten);
    });
    var block = 4 * S;
    ctx.fillStyle = F.hinten;
    for (var x = 0; x < env.w; x += block) {
      var hoch = Math.round(3 + Math.sin(x * 0.02) * 1.5 + Math.sin(x * 0.07 + 1)) * 2 * S;
      ctx.fillRect(x, boden - hoch, block, hoch);
    }

    // Bei Lärm wird der Himmel grau / the sky turns grey when it is loud
    var grau = (1 - env.ruhe) * 0.3;
    if (grau > 0.01) {
      ctx.fillStyle = 'rgba(60, 70, 90, ' + grau.toFixed(3) + ')';
      ctx.fillRect(0, 0, env.w, boden);
    }

    // Wiese / meadow
    ctx.fillStyle = F.gras;
    ctx.fillRect(0, boden, env.w, env.h - boden);
    ctx.fillStyle = F.grasHell;
    ctx.fillRect(0, boden, env.w, S);
    grasPunkte.forEach(function (p) {
      ctx.fillStyle = p.farbe;
      ctx.fillRect(p.x, p.y, S, S);
    });
    grasBueschel.forEach(function (g) { male(ctx, bilder.gras[g.art], g.x, g.y); });
  }

  // ---------- Große Bäume links und rechts / big trees on both sides ----------
  function neuerBaum(env, rechts) {
    var w = env.w, h = env.h;
    var breite = Math.round(w * 0.055);
    var stammX = rechts ? w - breite : 0;
    var richtung = rechts ? -1 : 1;
    var astX = rechts ? stammX : stammX + breite;
    var astLaenge = Math.round(w * 0.08);
    var baum = {
      stammX: stammX, breite: breite, oben: Math.round(h * 0.1), unten: bodenY(env) + 3 * S,
      ast: {
        x: astX, y: Math.round(h * 0.44), laenge: astLaenge, richtung: richtung,
        spitzeX: astX + richtung * astLaenge, spitzeY: Math.round(h * 0.44 - astLaenge * 0.4),
      },
      rinde: [], krone: [],
    };
    for (var i = 0; i < 14; i++) {
      baum.rinde.push({ x: stammX + Math.floor(rnd() * (breite - 2 * S)), y: zwischen(baum.oben, baum.unten), h: Math.round(zwischen(2, 4)) * S });
    }
    // Krone: Kleckse in einem lockeren Raster, damit sie dicht wird / crown: blobs on a loose grid so it stays dense
    for (var reihe = 0; reihe < 3; reihe++) {
      for (var spalte = 0; spalte < 4 - reihe; spalte++) {
        var x = (0.03 + spalte * 0.075 + zwischen(-0.02, 0.02)) * w;
        var y = (0.02 + reihe * 0.1 + zwischen(-0.02, 0.02)) * h;
        baum.krone.push({ x: rechts ? w - x : x, y: y, r: zwischen(0.08, 0.11) * h });
      }
    }
    return baum;
  }

  function zeichneStamm(ctx, baum) {
    ctx.fillStyle = F.stamm;
    ctx.fillRect(baum.stammX, baum.oben, baum.breite, baum.unten - baum.oben);
    ctx.fillStyle = F.stammDunkel;
    baum.rinde.forEach(function (r) { ctx.fillRect(r.x, Math.round(r.y), 2 * S, r.h); });

    // Ast schräg nach oben / branch going up at an angle
    var ast = baum.ast;
    for (var i = 0; i <= ast.laenge; i += S) {
      ctx.fillStyle = F.stamm;
      ctx.fillRect(Math.round(ast.x + ast.richtung * i), Math.round(ast.y - i * 0.4), S, 3 * S);
      ctx.fillStyle = F.stammDunkel;
      ctx.fillRect(Math.round(ast.x + ast.richtung * i), Math.round(ast.y - i * 0.4) + 3 * S, S, S);
    }
  }

  function zeichneKrone(ctx, baum) {
    baum.krone.forEach(function (k) { laub(ctx, k); });
  }

  // ---------- Eichhörnchen / squirrel ----------
  function neuesHoernchen(env) {
    var x = 0.2 * env.w, y = Math.round(0.73 * env.h);
    return {
      x: x, y: y, bodenY: y, oben: 13,
      links: 0.12 * env.w, rechts: 0.36 * env.w, ziel: x, pause: 1, richtung: 1,
      sprung: 0,      // Takt der Sprünge beim Laufen / rhythm of the bounds while running
      zucken: 0,      // kurzes Schwanzzucken / quick tail flick
      knabbern: 0,    // knabbert gerade an der Nuss / currently nibbling the nut
      modus: 'boden', // boden · zumBaum · hoch · versteckt · runter  /  ground · to tree · up · hidden · down
    };
  }

  function bewegeHoernchen(e, env) {
    var baum = baeume[0];
    var stammMitte = baum.stammX + baum.breite / 2;
    var versteckY = Math.round(env.h * 0.2);
    var laeuft = false;
    if (e.zucken > 0) e.zucken -= env.dt;
    if (e.knabbern > 0) e.knabbern -= env.dt;

    if (env.stufe === 3 && (e.modus === 'boden' || e.modus === 'runter')) {
      if (e.modus === 'boden') erschrecken(e);
      e.modus = e.modus === 'runter' ? 'hoch' : 'zumBaum';
    }

    if (e.modus === 'zumBaum') {
      laeuft = true;
      e.richtung = stammMitte < e.x ? -1 : 1;
      e.x = naeher(e.x, stammMitte, env.dt * 50 * T);
      if (e.x === stammMitte) e.modus = 'hoch';
    } else if (e.modus === 'hoch') {
      // Ruckartig den Stamm hoch, in der Krone verstecken / jerkily up the trunk, hide in the crown
      var ruck = Math.floor(env.t * 8) % 2 ? 60 : 15;
      e.y = naeher(e.y, versteckY, env.dt * ruck * T);
      if (rnd() < env.dt * 4) aufwirbeln(e.x, e.y - 8 * T, 1, F.blatt);
      if (e.y === versteckY) {
        e.modus = 'versteckt';
        aufwirbeln(e.x, e.y - 8 * T, 6, F.blatt); // Blätter rascheln / leaves rustle
      }
    } else if (e.modus === 'versteckt') {
      if (ruhigSeit > 2) e.modus = 'runter';
    } else if (e.modus === 'runter') {
      var vorsichtig = Math.floor(env.t * 4) % 3 === 0 ? 0 : 30; // hält kurz an und guckt / pauses to look
      e.y = naeher(e.y, e.bodenY, env.dt * vorsichtig * T);
      if (e.y === e.bodenY) {
        e.modus = 'boden';
        e.ziel = zwischen(e.links, e.rechts);
        e.pause = 0;
      }
    } else if (env.stufe === 0) {
      // Hüpft in Sprüngen los, hält an, knabbert und zuckt mit dem Schwanz
      // Bounds off, stops, nibbles and flicks its tail
      if (e.pause > 0) {
        e.pause -= env.dt;
        if (e.knabbern <= 0 && rnd() < env.dt * 0.6) e.knabbern = zwischen(1, 2);
        if (e.zucken <= 0 && rnd() < env.dt * 0.5) e.zucken = 0.3;
      } else {
        laeuft = true;
        e.richtung = e.ziel >= e.x ? 1 : -1;
        e.x = naeher(e.x, e.ziel, env.dt * 32 * T);
        if (e.x === e.ziel) {
          e.pause = zwischen(1.5, 3.5);
          e.ziel = zwischen(e.links, e.rechts);
          e.zucken = 0.3;
        }
      }
    } else {
      // Sitzt und schaut sich um, bei „etwas laut“ hektisch mit zuckendem Schwanz
      // Sits and looks around; at stage 2 nervously, with a twitching tail
      var tempo = env.stufe === 2 ? 5 : 0.8;
      e.richtung = Math.sin(env.t * tempo) > 0 ? 1 : -1;
      if (env.stufe === 2 && e.zucken <= 0 && rnd() < env.dt * 2) e.zucken = 0.2;
    }

    e.laeuft = laeuft;
    e.sprung = laeuft ? e.sprung + env.dt * 11 : 0;
  }

  function zeichneHoernchen(ctx, e, env) {
    if (e.modus === 'versteckt') return;

    if (e.modus === 'hoch' || e.modus === 'runter') {
      // Von hinten am Stamm, Pfoten greifen abwechselnd, Schwanz baumelt
      // From behind on the trunk, paws grab in turn, tail dangles
      var klettert = Math.floor(env.t * 8) % 2 ? bilder.hoernchenKlettert1 : bilder.hoernchenKlettert2;
      var baumeln = Math.sin(env.t * 6) * 0.3;
      aufSprite(ctx, e.x, e.y, 9, 10, { tier: true, winkel: e.modus === 'runter' ? Math.PI : 0 }, function () {
        ctx.save();
        ctx.translate(4.5, 9);
        ctx.rotate(baumeln);
        ctx.drawImage(bilder.hoernchenSchwanzHaengt, -2.5, 0);
        ctx.restore();
        ctx.drawImage(klettert, 0, 0);
      });
      return;
    }

    if (e.laeuft) {
      // In Bögen springen: gestreckt in der Luft, gesammelt am Boden
      // Bounding in arcs: stretched in the air, gathered on the ground
      var luft = Math.abs(Math.sin(e.sprung));
      var bild = luft > 0.5 ? bilder.hoernchenGestreckt : bilder.hoernchenGesammelt;
      maleTier(ctx, bild, e.x, e.y - Math.round(luft * 4) * T, { spiegeln: e.richtung < 0 });
      return;
    }

    // Sitzen: Schwanz wippt sanft, zuckt manchmal; beim Knabbern nickt der Kopf
    // Sitting: the tail sways gently and flicks sometimes; the head bobs while nibbling
    var schwanz = Math.sin(env.t * 2) * 0.08;
    if (e.zucken > 0) schwanz = Math.sin(e.zucken * 30) * 0.35;
    var wackeln = env.stufe === 2 ? zittern(env) : 0;
    var nicken = e.knabbern > 0 && Math.floor(env.t * 8) % 2 ? 1 : 0;
    aufSprite(ctx, e.x + wackeln, e.y, 11, 12, { tier: true, spiegeln: e.richtung < 0 }, function () {
      ctx.save();
      ctx.translate(3, 11); // Schwanzansatz / base of the tail
      ctx.rotate(schwanz);
      ctx.drawImage(bilder.hoernchenSchwanz, -7, -12);
      ctx.restore();
      ctx.drawImage(bilder.hoernchenSitzt, 0, 0);
      if (env.stufe === 0) {
        ctx.fillStyle = FARBEN.n; // Nuss in den Pfoten / nut in its paws
        ctx.fillRect(9, 6 - nicken, 2, 2);
      }
    });
  }

  /** Aus der Krone hängt der Schwanz, ab und zu blitzen Augen. / Tail hangs from the crown, eyes peek. */
  function zeichneSchwanzImBaum(ctx, e, env) {
    if (e.modus !== 'versteckt') return;
    var baum = baeume[0];
    var x = baum.stammX + baum.breite + 6 * T;
    var y = Math.round(env.h * 0.28);
    aufSprite(ctx, x, y, 5, 8, { tier: true }, function () {
      ctx.save();
      ctx.translate(2.5, 0);
      ctx.rotate(Math.sin(env.t * 3) * 0.25);
      ctx.drawImage(bilder.hoernchenSchwanzHaengt, -2.5, 0);
      ctx.restore();
    });
    if (Math.sin(env.t * 1.1) > 0.6) {
      // Zwei Augen gucken aus dem Laub / two eyes peek out of the leaves
      var augenX = x + 6 * T, augenY = y - 5 * T;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(Math.round(augenX), Math.round(augenY), Math.ceil(2 * T), Math.ceil(T));
      ctx.fillRect(Math.round(augenX + 3 * T), Math.round(augenY), Math.ceil(2 * T), Math.ceil(T));
      ctx.fillStyle = FARBEN.k;
      ctx.fillRect(Math.round(augenX + T), Math.round(augenY), Math.ceil(T), Math.ceil(T));
      ctx.fillRect(Math.round(augenX + 4 * T), Math.round(augenY), Math.ceil(T), Math.ceil(T));
    }
  }

  // ---------- Igel / hedgehog ----------
  function neuerIgel(env) {
    var x = 0.5 * env.w;
    return {
      x: x, y: Math.round(0.85 * env.h), oben: 9,
      links: 0.4 * env.w, rechts: 0.62 * env.w, ziel: x, pause: 2, richtung: -1, laeuft: false,
      kugel: false,  // zusammengerollt / rolled up
      sprung: 0,     // Hüpfer beim Ausrollen / hop when unrolling
    };
  }

  function bewegeIgel(i, env) {
    i.laeuft = false;
    if (i.sprung > 0) i.sprung = Math.max(0, i.sprung - env.dt * 2.5);

    if (env.stufe === 3) {
      if (!i.kugel) {
        i.kugel = true;
        erschrecken(i);
      }
      return;
    }
    if (i.kugel) {
      if (ruhigSeit > 2.5) {
        i.kugel = false;
        i.sprung = 1;
      }
      return;
    }

    if (env.stufe === 0) {
      // Langsam schnüffelnd herumlaufen / waddle around sniffing
      if (i.pause > 0) {
        i.pause -= env.dt;
      } else {
        i.laeuft = true;
        i.richtung = i.ziel >= i.x ? 1 : -1;
        i.x = naeher(i.x, i.ziel, env.dt * 6 * T);
        if (i.x === i.ziel) {
          i.pause = zwischen(1.5, 3.5);
          i.ziel = zwischen(i.links, i.rechts);
        }
      }
    }
  }

  function zeichneIgel(ctx, i, env) {
    if (i.kugel) {
      // Stachelkugel, ab und zu guckt die Nase raus / spiky ball, the nose peeks out now and then
      var wackeln = Math.sin(env.t * 1.3) > 0.7 ? zittern(env) : 0;
      aufSprite(ctx, i.x + wackeln, i.y, 10, 8, { tier: true, spiegeln: i.richtung < 0 }, function () {
        ctx.drawImage(bilder.igelKugel, 0, 0);
        if (Math.sin(env.t * 0.9) > 0.8) {
          ctx.fillStyle = FARBEN.k;
          ctx.fillRect(9, 5, 1, 1);
        }
      });
      return;
    }
    var bild = i.laeuft && Math.floor(env.t * 5) % 2 ? bilder.igel2 : bilder.igel1;
    var schnueffeln = env.stufe === 0 && !i.laeuft && Math.floor(env.t * 5) % 2 ? T : 0;
    var wackeln = env.stufe === 2 ? zittern(env) : 0;
    var hoch = Math.round(Math.sin(i.sprung * Math.PI) * 5) * T;
    maleTier(ctx, bild, i.x + wackeln, i.y + schnueffeln - hoch, { spiegeln: i.richtung < 0 });
  }

  // ---------- Hase / rabbit ----------
  function neuerHase(env) {
    var x = 0.76 * env.w;
    return {
      x: x, y: Math.round(0.74 * env.h), heimX: x, oben: 17,
      links: 0.66 * env.w, rechts: 0.84 * env.w, ziel: x, pause: 1, richtung: -1,
      phase: 0,       // Hoppel-Takt / hopping rhythm
      modus: 'da',    // da · flieht · weg · kommt  /  here · fleeing · gone · returning
    };
  }

  function bewegeHase(a, env) {
    var hoppelt = false;

    if (env.stufe === 3 && (a.modus === 'da' || a.modus === 'kommt')) {
      if (a.modus === 'da') erschrecken(a);
      a.modus = 'flieht';
      a.richtung = 1;
    }

    if (a.modus === 'flieht') {
      // Mit großen Sprüngen ins Gebüsch / big leaps into the bushes
      hoppelt = true;
      a.x += env.dt * 55 * T;
      if (a.x > env.w + 20 * T) a.modus = 'weg';
    } else if (a.modus === 'weg') {
      if (ruhigSeit > 4) {
        a.modus = 'kommt';
        a.richtung = -1;
        a.x = env.w + 20 * T;
      }
    } else if (a.modus === 'kommt') {
      hoppelt = true;
      a.x = naeher(a.x, a.heimX, env.dt * 30 * T);
      if (a.x === a.heimX) {
        a.modus = 'da';
        a.pause = 1;
      }
    } else if (env.stufe === 0) {
      if (a.pause > 0) {
        a.pause -= env.dt;
      } else {
        hoppelt = true;
        a.richtung = a.ziel >= a.x ? 1 : -1;
        a.x = naeher(a.x, a.ziel, env.dt * 22 * T);
        if (a.x === a.ziel) {
          a.pause = zwischen(1, 3);
          a.ziel = zwischen(a.links, a.rechts);
        }
      }
    } else {
      var tempo = env.stufe === 2 ? 5 : 0.6;
      a.richtung = Math.sin(env.t * tempo + 1) > 0 ? 1 : -1;
    }

    a.hoppelt = hoppelt;
    a.phase = hoppelt ? a.phase + env.dt * 9 : 0;
  }

  function zeichneHase(ctx, a, env) {
    if (a.modus === 'weg') return;
    var luft = Math.abs(Math.sin(a.phase)); // 0 = am Boden, 1 = ganz oben / 0 = on the ground, 1 = top
    var hoch = Math.round(luft * (a.modus === 'flieht' ? 9 : 5)) * T;
    var wackeln = env.stufe === 2 && !a.hoppelt ? zittern(env) : 0;
    aufSprite(ctx, a.x + wackeln, a.y - hoch, 16, 16, { tier: true, spiegeln: a.richtung < 0, winkel: a.hoppelt ? -0.15 * luft : 0 }, function () {
      ctx.drawImage(bilder.hase, 0, 0);
      // Nase wackelt bei Ruhe / the nose wiggles when it is quiet
      if (env.stufe === 0 && !a.hoppelt && Math.floor(env.t * 8) % 2) {
        ctx.fillStyle = FARBEN.g;
        ctx.fillRect(15, 7, 1, 1);
      }
    });
  }

  // ---------- Vögel / birds ----------
  function neuerVogel(nr, x, y) {
    return {
      nr: nr, heimX: x, heimY: y, x: x, y: y, oben: 7, richtung: nr ? -1 : 1,
      singt: 0, fluchtX: 0,
      modus: 'sitzt', // sitzt · flieht · weg · kommt  /  perched · fleeing · gone · returning
    };
  }

  function bewegeVogel(v, env) {
    if (v.singt > 0) v.singt -= env.dt;

    if (env.stufe === 3 && (v.modus === 'sitzt' || v.modus === 'kommt')) {
      if (v.modus === 'sitzt') erschrecken(v);
      v.modus = 'flieht';
      v.singt = 0;
      v.fluchtX = v.x < env.w / 2 ? -20 * T : env.w + 20 * T;
    }

    if (v.modus === 'flieht') {
      if (fliegeZu(v, v.fluchtX, -20 * T, 70 * T, env.dt)) v.modus = 'weg';
    } else if (v.modus === 'weg') {
      if (ruhigSeit > 3 + v.nr * 2) v.modus = 'kommt';
    } else if (v.modus === 'kommt') {
      if (fliegeZu(v, v.heimX, v.heimY, 35 * T, env.dt)) v.modus = 'sitzt';
    } else if (env.stufe === 0) {
      // Singt ab und zu ein Lied / sings a song now and then
      if (v.singt <= 0 && rnd() < env.dt * 0.4) v.singt = zwischen(1.5, 3);
      if (v.singt > 0 && rnd() < env.dt * 3) noten.push({ x: v.x + v.richtung * 3 * T, y: v.y - 6 * T, leben: 1.6, phase: rnd() * 6 });
      if (rnd() < env.dt * 0.25) v.richtung = -v.richtung;
    } else if (env.stufe === 2) {
      v.richtung = Math.sin(env.t * 6 + v.nr) > 0 ? 1 : -1;
    }
  }

  function zeichneVogel(ctx, v, env) {
    if (v.modus === 'weg') return;
    if (v.modus === 'sitzt') {
      var bild = v.singt > 0 && Math.floor(env.t * 6) % 2 ? bilder.vogelSingt : bilder.vogelSitzt;
      var wackeln = env.stufe === 2 ? zittern(env) : 0;
      maleTier(ctx, bild, v.x + wackeln, v.y, { spiegeln: v.richtung < 0 });
    } else {
      var fluegel = Math.floor(env.t * 10 + v.nr) % 2 ? bilder.vogelOben : bilder.vogelUnten;
      maleTier(ctx, fluegel, v.x, v.y, { spiegeln: v.richtung < 0 });
    }
  }

  function zeichneNoten(ctx, env) {
    noten = noten.filter(function (n) {
      n.leben -= env.dt;
      n.y -= env.dt * 10 * T;
      maleTier(ctx, bilder.note, n.x + Math.sin(env.t * 3 + n.phase) * 2 * T, n.y);
      return n.leben > 0;
    });
  }

  // ---------- Schmetterlinge / butterflies ----------
  function neuerFalter(nr, env) {
    return {
      nr: nr, x: (0.45 + 0.12 * nr) * env.w, y: 0.68 * env.h, oben: 5,
      mitteX: (0.48 + 0.08 * nr) * env.w, mitteY: 0.68 * env.h, phase: nr * 2,
      sitzt: false,
      modus: 'da', // da · flieht · weg  /  here · fleeing · gone
    };
  }

  function bewegeFalter(f, env) {
    f.sitzt = false;

    if (env.stufe === 3 && f.modus === 'da') {
      f.modus = 'flieht';
      erschrecken(f);
    }

    if (f.modus === 'flieht') {
      f.y -= env.dt * 50 * T;
      f.x += Math.sin(env.t * 8 + f.phase) * env.dt * 30 * T;
      if (f.y < -10 * T) f.modus = 'weg';
      return;
    }
    if (f.modus === 'weg') {
      if (ruhigSeit > 4 + f.nr * 1.5) {
        f.modus = 'da';
        f.y = -10 * T;
      }
      return;
    }

    // Bei Stille wild herumflattern, sonst auf einer Blume ausruhen
    // Flutter around when quiet, otherwise rest on a flower
    var ziel;
    if (env.stufe === 0) {
      ziel = {
        x: f.mitteX + Math.cos(env.t * 0.7 + f.phase) * env.w * 0.08,
        y: f.mitteY + Math.sin(env.t * 1.3 + f.phase) * env.h * 0.06,
      };
    } else {
      var blume = blumen[f.nr];
      ziel = { x: blume.x, y: blume.y - 6 * T };
    }
    var schritt = env.dt * 25 * T;
    f.x = naeher(f.x, ziel.x, schritt);
    f.y = naeher(f.y, ziel.y, schritt);
    f.sitzt = env.stufe > 0 && f.x === ziel.x && f.y === ziel.y;
  }

  function zeichneFalter(ctx, f, env) {
    if (f.modus === 'weg') return;
    var bild = bilder.falter[f.nr];
    var schlaege = f.sitzt ? 1.2 : 10; // Flügelschläge pro Sekunde / wing beats per second
    var flattern = f.sitzt ? 0 : Math.round(Math.sin(env.t * 12 + f.phase)) * T;
    maleTier(ctx, Math.floor(env.t * schlaege + f.phase) % 2 ? bild.auf : bild.zu, f.x, f.y + flattern);
  }

  // ---------- Blumen, Pilze, Baumstumpf / flowers, toadstools, stump ----------
  function zeichneDeko(ctx, env) {
    maleTier(ctx, bilder.stumpf, stumpf.x, stumpf.y);
    pilze.forEach(function (p) { maleTier(ctx, p.bild, p.x, p.y); });
    blumen.forEach(function (b) {
      // Jede Blume öffnet sich zu ihrer eigenen Zeit / each flower opens in its own time
      var offen = env.stufe === 0 && ruhigSeit > b.warten;
      maleTier(ctx, offen ? b.bild.offen : b.bild.zu, b.x, b.y);
    });
  }

  // ---------- Fliegende Teilchen und „!“ / flying particles and "!" ----------
  function zeichneTeilchen(ctx, env) {
    teilchen = teilchen.filter(function (t) {
      t.leben -= env.dt;
      t.vy += 120 * T * env.dt; // Schwerkraft / gravity
      t.x += t.vx * env.dt;
      t.y += t.vy * env.dt;
      ctx.fillStyle = t.farbe;
      ctx.fillRect(Math.round(t.x), Math.round(t.y), Math.ceil(T), Math.ceil(T));
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
  MM.welten.register('wald', {
    init: aufbauen,
    resize: aufbauen,

    draw: function (ctx, env) {
      if (env.stufe === 3) ruhigSeit = 0;
      else ruhigSeit += env.dt;

      bewegeHoernchen(hoernchen, env);
      bewegeIgel(igel, env);
      bewegeHase(hase, env);
      voegel.forEach(function (v) { bewegeVogel(v, env); });
      falter.forEach(function (f) { bewegeFalter(f, env); });

      // Von hinten nach vorne malen / paint from back to front
      hintergrund(ctx, env);
      baeume.forEach(function (b) { zeichneStamm(ctx, b); });
      if (hoernchen.modus !== 'boden' && hoernchen.modus !== 'zumBaum') zeichneHoernchen(ctx, hoernchen, env);
      baeume.forEach(function (b) { zeichneKrone(ctx, b); });
      zeichneSchwanzImBaum(ctx, hoernchen, env);
      buesche.forEach(function (b) { laub(ctx, b); });
      zeichneDeko(ctx, env);
      zeichneIgel(ctx, igel, env);
      zeichneHase(ctx, hase, env);
      if (hoernchen.modus === 'boden' || hoernchen.modus === 'zumBaum') zeichneHoernchen(ctx, hoernchen, env);
      falter.forEach(function (f) { zeichneFalter(ctx, f, env); });
      voegel.forEach(function (v) { zeichneVogel(ctx, v, env); });
      zeichneNoten(ctx, env);
      zeichneTeilchen(ctx, env);
      zeichneAusrufe(ctx, env);
    },
  });
})();
