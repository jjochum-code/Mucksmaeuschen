/*
 * Szene „Dschungel“ – erste Fassung mit Bild-Ebenen.
 *
 * Ebenen (von hinten nach vorn):
 *   1. assets/hintergrund.webp   Dschungel mit zwei Ästen und Waldboden
 *   2. assets/lianen.webp        Ast mit herabhängenden Lianen (schwingt leicht)
 *      assets/affe.webp          Orang-Utan, hangelt sich an den Lianen (LIANEN_PUNKTE)
 *   3. Tiere                     Schlange am Boden, Tukan auf den Ästen
 *   4. assets/pflanzen-*.webp    Pflanzen links/rechts im Vordergrund (wiegen sich)
 *
 * Verhalten: Bei Ruhe kommt die Schlange hinter den Pflanzen hervor und der Tukan
 * fliegt ein und landet abwechselnd auf den Ästen. Wird es laut, verschwindet die
 * Schlange hinter den Pflanzen, der Tukan fliegt davon und der Dschungel wird dunkler.
 *
 * Animation: Der Tukan hat Bildstreifen fürs Fliegen (3 Flügelstellungen) und
 * Sitzen (normal / Kopf geneigt). Die Schlange ist ein Einzelbild; sie schlängelt
 * sich, indem das Bild in schmale Streifen geschnitten und wellenförmig verschoben wird.
 */
'use strict';

(function () {
  var ORDNER = 'welten/dschungel/assets/';

  function bild(name) {
    var img = new Image();
    img.src = ORDNER + name;
    return img;
  }

  var B = {
    hintergrund: bild('hintergrund.webp'),
    links: bild('pflanzen-links.webp'),
    rechts: bild('pflanzen-rechts.webp'),
    lianen: bild('lianen.webp'),
    affe: bild('affe.webp'), // 4 Felder: hängt, schwingt, beide Arme oben, Beine angezogen
    affePendel: bild('affe-pendel.webp'), // 8 Felder: ein Pendelschwung (Mitte – rechts – Mitte – links)
    affeHangeln: bild('affe-hangeln.webp'), // 3 Felder: greift nach vorn, beide Hände, hängt an der anderen Hand
    affeKlettern: bild('affe-klettern.webp'), // 2 Felder: A gestreckt, B zusammengezogen
    falter: bild('schmetterling.webp'), // 6 Flügelstellungen × 2 Farben (Zeile 1 blau, Zeile 2 orange)
    falterSitzt: bild('schmetterling-sitzt.webp'), // 4 Stellungen beim Sitzen × 2 Farben
    tukanFlug: bild('tukan-flug.webp'), // 3 Felder: Flügel oben, Mitte, unten
    tukanSitzt: bild('tukan-sitzt.webp'), // 2 Felder: normal, Kopf geneigt
    schlange: bild('schlange.webp'),
  };

  function geladen(img) {
    return img.complete && img.naturalWidth > 0;
  }

  // Wo der Hintergrund gerade liegt (er füllt die Fläche, unten bündig)
  var bg = { x: 0, y: 0, w: 1, h: 1 };

  function hintergrundRahmen(env) {
    var iw = B.hintergrund.naturalWidth || 960, ih = B.hintergrund.naturalHeight || 540;
    var s = Math.max(env.w / iw, env.h / ih);
    bg.w = iw * s;
    bg.h = ih * s;
    bg.x = (env.w - bg.w) / 2;
    bg.y = env.h - bg.h;
  }

  /** Punkt im Hintergrundbild (Anteile 0…1) → Welt-Koordinaten. */
  function imBild(u, v) {
    return { x: bg.x + u * bg.w, y: bg.y + v * bg.h };
  }

  // Sitzplätze für den Tukan: Oberkante der Äste im Hintergrundbild
  var AESTE = [
    { u: 0.7, v: 0.365 }, // rechter Ast
    { u: 0.2, v: 0.215 }, // linker Ast (tiefer, damit er nicht unter der Kopfzeile sitzt)
  ];

  // ---------- Tukan ----------
  var tukan = {
    zustand: 'weg', // 'weg' | 'fliegt' | 'sitzt' | 'flieht'
    x: -50,
    y: 20,
    ziel: null, // Index in AESTE
    zielX: 0,
    zielY: 0,
    blick: -1, // -1 = nach links (wie im Bild), 1 = nach rechts
    sitzZeit: 0,
    kopfNeigen: 0,
    mut: 0.45,
  };

  // Bildstreifen: gleich große Felder nebeneinander. anker = Fußpunkt im Feld (Anteile),
  // damit der Tukan beim Wechsel zwischen Fliegen und Sitzen nicht springt.
  var FLUG = { felder: 3, anker: [0.461, 0.732], folge: [0, 1, 2, 1] };
  var SITZ = { felder: 2, anker: [0.545, 0.835] };

  /** Pixel-Maßstab: ein sitzender Tukan ist 13 % der Welthöhe hoch (gilt auch fürs Fliegen). */
  function tukanMassstab(env) {
    return (env.h * 0.13) / (B.tukanSitzt.naturalHeight || 206);
  }

  function zeichneFeld(ctx, img, info, feld, x, y, k, blick) {
    var fw = img.naturalWidth / info.felder, fh = img.naturalHeight;
    var w = fw * k, h = fh * k;
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    ctx.scale(-blick, 1); // Bilder schauen nach links
    ctx.drawImage(img, feld * fw, 0, fw, fh, -info.anker[0] * w, -info.anker[1] * h, w, h);
    ctx.restore();
  }

  function tukanZielSetzen(i) {
    tukan.ziel = i;
    var p = imBild(AESTE[i].u, AESTE[i].v);
    tukan.zielX = p.x;
    tukan.zielY = p.y;
    tukan.zustand = 'fliegt';
  }

  function bewegeTukan(env) {
    var t = tukan;
    var ruhig = env.ruhe > t.mut + 0.04;
    var laut = env.ruhe < t.mut - 0.04;

    if (laut && t.zustand !== 'weg' && t.zustand !== 'flieht') {
      t.zustand = 'flieht';
      t.zielX = t.x < env.w / 2 ? -env.w * 0.25 : env.w * 1.25;
      t.zielY = -env.h * 0.2;
    }
    if (ruhig && t.zustand === 'weg') {
      // von einer Seite oben einfliegen
      var vonLinks = Math.random() < 0.5;
      t.x = vonLinks ? -env.w * 0.2 : env.w * 1.2;
      t.y = env.h * 0.1;
      tukanZielSetzen(Math.random() < 0.5 ? 0 : 1);
    }
    if (t.zustand === 'sitzt') {
      // Sitzplatz folgt dem Bild (z. B. nach Größenänderung)
      var p = imBild(AESTE[t.ziel].u, AESTE[t.ziel].v);
      t.x = p.x;
      t.y = p.y;
      t.sitzZeit -= env.dt;
      // ab und zu den Kopf neigen
      t.kopfNeigen -= env.dt;
      if (t.kopfNeigen < -(2 + Math.random() * 4)) t.kopfNeigen = 0.8 + Math.random() * 0.8;
      if (t.sitzZeit <= 0) tukanZielSetzen(1 - t.ziel); // zum anderen Ast fliegen
    }
    if (t.zustand === 'fliegt' || t.zustand === 'flieht') {
      var dx = t.zielX - t.x, dy = t.zielY - t.y;
      var d = Math.sqrt(dx * dx + dy * dy);
      // Geschwindigkeit relativ zur Weltbreite (unabhängig von der Pixelgröße)
      var tempo = (t.zustand === 'flieht' ? 0.375 : 0.17) * env.w * env.dt;
      if (Math.abs(dx) > 1) t.blick = dx > 0 ? 1 : -1;
      if (d <= tempo) {
        t.x = t.zielX;
        t.y = t.zielY;
        if (t.zustand === 'flieht') t.zustand = 'weg';
        else {
          t.zustand = 'sitzt';
          t.sitzZeit = 5 + Math.random() * 6;
        }
      } else {
        t.x += (dx / d) * tempo;
        t.y += (dy / d) * tempo;
      }
    }
  }

  function zeichneTukan(ctx, env) {
    var t = tukan;
    if (t.zustand === 'weg' || !geladen(B.tukanFlug) || !geladen(B.tukanSitzt)) return;
    var k = tukanMassstab(env);
    if (t.zustand === 'sitzt') {
      // meist ruhig sitzen, ab und zu kurz den Kopf neigen
      var feld = t.kopfNeigen > 0 ? 1 : 0;
      zeichneFeld(ctx, B.tukanSitzt, SITZ, feld, t.x, t.y, k, t.blick);
    } else {
      // Flügelschlag: oben – Mitte – unten – Mitte, auf der Flucht schneller
      var takt = t.zustand === 'flieht' ? 16 : 10;
      var schritt = FLUG.folge[Math.floor(env.t * takt) % FLUG.folge.length];
      var wippen = Math.sin(env.t * takt * Math.PI * 0.5) * env.h * 0.0075;
      zeichneFeld(ctx, B.tukanFlug, FLUG, schritt, t.x, t.y + wippen, k, t.blick);
    }
  }

  // ---------- Schlange ----------
  var schlange = {
    x: -100,
    richtung: 1,
    ziel: 0,
    phase: 0,
    pause: 0,
    mut: 0.3,
  };

  function schlangenGroesse(env) {
    var w = env.w * 0.14; // Länge der Schlange als Anteil der Bildbreite
    return { w: w, h: (w * B.schlange.naturalHeight) / B.schlange.naturalWidth };
  }

  function bewegeSchlange(env) {
    var s = schlange;
    var g = schlangenGroesse(env);
    var draussen = env.ruhe > s.mut;
    if (!draussen) {
      // hinter die nächste Pflanzenseite zurückziehen
      s.ziel = s.x < env.w / 2 ? -g.w * 0.2 : env.w + g.w * 0.2;
    } else if (Math.abs(s.ziel - s.x) < 2 || s.ziel < g.w * 0.3 || s.ziel > env.w - g.w * 0.3) {
      if (s.pause > 0) s.pause -= env.dt;
      else {
        s.ziel = env.w * (0.3 + Math.random() * 0.4);
        s.pause = 1 + Math.random() * 3;
      }
    }
    var dx = s.ziel - s.x;
    var tempo = (draussen ? 0.07 : 0.125) * env.w * env.dt;
    if (Math.abs(dx) > 0.5) {
      s.richtung = dx > 0 ? 1 : -1;
      s.x += Math.sign(dx) * Math.min(Math.abs(dx), tempo);
      s.phase += env.dt * (draussen ? 6 : 12);
    }
  }

  function zeichneSchlange(ctx, env) {
    if (!geladen(B.schlange)) return;
    var s = schlange;
    var g = schlangenGroesse(env);
    var boden = imBild(0.5, 0.855).y; // auf dem Waldboden, über der Stufen-Leiste
    var img = B.schlange;
    var STREIFEN = 4; // Breite eines Streifens im Quellbild (px)
    var faktor = g.w / img.naturalWidth;
    ctx.save();
    ctx.translate(Math.round(s.x), Math.round(boden));
    ctx.scale(s.richtung, 1); // Bild schaut nach rechts
    for (var sx = 0; sx < img.naturalWidth; sx += STREIFEN) {
      var k = sx / img.naturalWidth; // 0 = Schwanz, 1 = Kopf
      // Welle: am Schwanz stark, zum Kopf hin ruhiger
      var welle = Math.sin(s.phase - k * 9) * g.h * 0.12 * (1 - k * 0.8);
      ctx.drawImage(
        img,
        sx, 0, STREIFEN, img.naturalHeight,
        -g.w / 2 + sx * faktor, -g.h + welle, STREIFEN * faktor + 0.6, g.h
      );
    }
    ctx.restore();
  }

  // ---------- Lianen ----------
  // Ast mit Lianen oben in der Mitte. Er ragt oben etwas aus dem Bild, damit es wirkt,
  // als hingen die Lianen aus dem Blätterdach. Schwingt leicht um den Ast als Drehpunkt.
  // Das Bild ist farblich an das Dschungel-Licht angepasst (blaugrüner Dunst).
  var LIANEN = { breite: 0.55, mitteX: 0.5, oben: -0.06, drehpunktY: 0.22 };
  var lianen = { x: 0, y: 0, w: 0, h: 0, winkel: 0 }; // aktuelle Lage (für den Affen)

  /**
   * Haltepunkte für einen Affen (Anteile 0…1 des Lianen-Bildes):
   * ende links = unteres Ende der langen Liane, schlaufe = tiefster Punkt der
   * Schlaufe in der Mitte, ranke = Ende der eingerollten Ranke rechts, ast = Mitte des Astes.
   */
  var LIANEN_PUNKTE = {
    endeLinks: { u: 0.22, v: 0.97 },
    schlaufe: { u: 0.5, v: 0.64 },
    ranke: { u: 0.8, v: 0.6 },
    ast: { u: 0.5, v: 0.24 },
  };

  /** Haltepunkt der Lianen in Welt-Koordinaten – inklusive Schwingen. */
  function lianenPunkt(name) {
    var p = LIANEN_PUNKTE[name];
    var px = lianen.w * (p.u - 0.5), py = lianen.h * (p.v - LIANEN.drehpunktY);
    var c = Math.cos(lianen.winkel), s = Math.sin(lianen.winkel);
    return { x: lianen.x + px * c - py * s, y: lianen.y + px * s + py * c };
  }

  // Mit ?debug in der Adresse werden die Haltepunkte als pinke Kästchen angezeigt
  var DEBUG = /[?&]debug\b/.test(location.search);

  function zeichneHaltepunkte(ctx) {
    ctx.fillStyle = '#ff2fb0';
    Object.keys(LIANEN_PUNKTE).forEach(function (name) {
      var p = lianenPunkt(name);
      ctx.fillRect(Math.round(p.x) - 1, Math.round(p.y) - 1, 3, 3);
    });
  }

  function zeichneLianen(ctx, env) {
    if (!geladen(B.lianen)) return;
    var img = B.lianen;
    lianen.w = env.w * LIANEN.breite;
    lianen.h = (lianen.w * img.naturalHeight) / img.naturalWidth;
    // Drehpunkt = Ast
    lianen.x = env.w * LIANEN.mitteX;
    lianen.y = env.h * LIANEN.oben + lianen.h * LIANEN.drehpunktY;
    // sanftes Schwingen, bei Unruhe etwas stärker
    lianen.winkel = Math.sin(env.t * 0.7) * (0.008 + (1 - env.ruhe) * 0.012);
    ctx.save();
    ctx.translate(lianen.x, lianen.y);
    ctx.rotate(lianen.winkel);
    ctx.drawImage(img, -lianen.w / 2, -lianen.h * LIANEN.drehpunktY, lianen.w, lianen.h);
    ctx.restore();
  }

  // ---------- Affe (Orang-Utan) an den Lianen ----------
  // Alle Felder sind an der greifenden Faust ausgerichtet (anker). Der Affe hängt an
  // einem Haltepunkt der Lianen, schwingt um die Faust und hangelt sich von Punkt zu Punkt.
  var AFFE = {
    felder: 4,
    anker: [0.479, 0.057],
    HAENGT: 0,
    SCHWINGT: 1,
    ARME_OBEN: 2,
    BEINE_AN: 3,
    hoehe: 0.3, // Höhe eines Feldes von affe.webp als Anteil der Welthöhe
  };
  // Pendel-Streifen: gleicher Pixel-Maßstab wie affe.webp, Anker = Faust
  var PENDEL = { felder: 8, anker: [0.485, 0.101], dauer: 1.8 /* Sekunden pro Schwung */ };
  // Hangel-Streifen: Anker = Griffstelle (haltende Faust bzw. Mitte zwischen beiden Fäusten),
  // Bewegung nach rechts; nach links wird gespiegelt.
  var HANGELN = { felder: 3, anker: [0.476, 0.099], grenzen: [0.33, 0.66], blende: 0.08 };
  // Kletter-Streifen: Pose A (gestreckt) und B (zusammengezogen), Anker = Liane auf Augenhöhe.
  // handA = Abstand der oberen Hand über dem Anker in Pose A, schritt = wie weit sich der Kopf
  // pro Halbschritt bewegt (beides als Anteil der Feldhöhe). Pro Halbschritt bleibt ein
  // Kontaktpunkt an der Liane fest – abwechselnd Füße und Hände –, dadurch wirkt es geschmeidig.
  var KLETTERN = { felder: 2, anker: [0.844, 0.289], handA: 0.253, schritt: 0.231, halbRunter: 0.45, halbHoch: 0.22 };
  var POSE_A = 0, POSE_B = 1;
  var UEBERGANG = 0.35; // Sekunden Überblendung zwischen Klettern und Hängen
  var FLUCHT_HANGELN = 0.8; // Sekunden pro Liane beim eiligen Zurückhangeln (sonst 1,5)
  var HALTEPUNKTE = ['endeLinks', 'schlaufe', 'ranke'];

  var affe = {
    zustand: 'weg', // 'weg' | 'kommt' | 'haengt' | 'wechselt' | 'flieht'
    x: 0,
    y: 0,
    halt: 0, // Index in HALTEPUNKTE
    richtung: 1, // 1 = nächster Punkt rechts, -1 = links
    zeit: 0, // Zeit im aktuellen Zustand
    dauer: 0,
    vonX: 0,
    vonY: 0,
    blick: 1,
    mut: 0.55,
    kopfY: 0, // beim Klettern: Ankerhöhe (Augen) an der Liane
    kl: null, // Kletter-Plan (Ziel, Anzahl Halbschritte …)
    poseVon: 0,
    poseNach: 1,
    p: 0,
    uebergang: 0,
    pendelFeld: 0,
    flucht: false, // true = will wegen Lärm über die lange Liane nach oben
  };

  function affeZustand(z, dauer) {
    affe.zustand = z;
    affe.zeit = 0;
    affe.dauer = dauer || 0;
    affe.vonX = affe.x;
    affe.vonY = affe.y;
  }

  /** gemeinsamer Pixel-Maßstab aller Affen-Streifen (ein Feld von affe.webp = AFFE.hoehe der Welthöhe) */
  function affenMassstab(env) {
    return (env.h * AFFE.hoehe) / (B.affe.naturalHeight || 334);
  }

  function kletterMasse(env) {
    var fh = (B.affeKlettern.naturalHeight || 260) * affenMassstab(env);
    return { schritt: KLETTERN.schritt * fh, hand: KLETTERN.handA * fh, feld: fh };
  }

  /** weich an- und auslaufen */
  function glatt(p) {
    return p * p * (3 - 2 * p);
  }

  /** Halbschritt j mit Fortschritt p (0…1) aus der Zeit im Zustand */
  function halbschritt(zeit, dauer) {
    var j = Math.floor(zeit / dauer);
    return { j: j, p: zeit / dauer - j };
  }

  function bewegeAffe(env) {
    var a = affe;
    a.zeit += env.dt;
    if (a.uebergang > 0) a.uebergang -= env.dt;
    var ruhig = env.ruhe > a.mut + 0.04;
    var laut = env.ruhe < a.mut - 0.04;
    var m = kletterMasse(env);
    var h, ziel, k;

    // Flucht: Nur die lange Liane führt nach oben. Hängt der Affe woanders, hangelt er
    // erst zügig dorthin zurück und klettert dann hoch.
    if (laut && !a.flucht && a.zustand !== 'weg' && a.zustand !== 'flieht') {
      a.flucht = true;
      if (a.zustand === 'kommt') {
        hochklettern(a, m, true); // ist schon an der langen Liane
      } else if (a.zustand === 'wechselt' && a.richtung > 0) {
        // war gerade unterwegs weg von der langen Liane: mitten im Schwung umkehren
        a.halt -= 1;
        a.richtung = -1;
        a.blick = -1;
        affeZustand('wechselt', FLUCHT_HANGELN);
      }
    }
    // wird es unterwegs wieder ruhig, bricht er die Flucht ab
    if (ruhig && a.flucht && a.zustand !== 'flieht') a.flucht = false;

    if (a.zustand === 'weg') {
      if (ruhig) {
        // an der langen Liane von oben herabklettern, bis die obere Hand an ihrem Ende ist
        var ende = lianenPunkt('endeLinks');
        var zielKopf = ende.y + m.hand;
        a.kl = { n: Math.ceil((zielKopf + m.feld) / m.schritt), zielKopf: zielKopf };
        a.halt = 0;
        a.richtung = 1;
        a.blick = 1;
        affeZustand('kommt'); // gleich unten weiterrechnen, damit schon das erste Bild stimmt
      } else {
        return;
      }
    }

    if (a.zustand === 'kommt') {
      h = halbschritt(a.zeit, KLETTERN.halbRunter);
      var ende2 = lianenPunkt('endeLinks');
      if (h.j >= a.kl.n) {
        a.x = ende2.x;
        a.y = ende2.y;
        a.uebergang = UEBERGANG;
        affeZustand('haengt', 3 + Math.random() * 3);
        return;
      }
      a.x = ende2.x;
      a.kopfY = a.kl.zielKopf - (a.kl.n - h.j) * m.schritt + m.schritt * glatt(h.p);
      // runter: am Ziel ist Pose A (obere Hand am Lianenende), davor abwechselnd
      a.poseVon = (a.kl.n - h.j) % 2 === 0 ? POSE_A : POSE_B;
      a.poseNach = 1 - a.poseVon;
      a.p = h.p;
    } else if (a.zustand === 'haengt') {
      ziel = lianenPunkt(HALTEPUNKTE[a.halt]); // folgt dem Schwingen der Lianen
      a.x = ziel.x;
      a.y = ziel.y;
      if (a.flucht) {
        if (a.halt === 0) {
          hochklettern(a, m, false); // an der langen Liane angekommen: hoch ins Blätterdach
        } else {
          a.halt -= 1; // eine Liane weiter Richtung lange Liane
          a.richtung = -1;
          a.blick = -1;
          affeZustand('wechselt', FLUCHT_HANGELN);
        }
        return;
      }
      if (a.zeit >= a.dauer) {
        // zum Nachbarpunkt hangeln, an den Enden umkehren
        var naechster = a.halt + a.richtung;
        if (naechster < 0 || naechster >= HALTEPUNKTE.length) {
          a.richtung *= -1;
          naechster = a.halt + a.richtung;
        }
        a.blick = a.richtung;
        a.halt = naechster;
        affeZustand('wechselt', 1.5);
      }
    } else if (a.zustand === 'wechselt') {
      ziel = lianenPunkt(HALTEPUNKTE[a.halt]);
      k = Math.min(1, a.zeit / a.dauer);
      var e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; // weich an- und abschwingen
      a.x = a.vonX + (ziel.x - a.vonX) * e;
      // Bogen nach unten wie beim Schwingen
      a.y = a.vonY + (ziel.y - a.vonY) * e + Math.sin(Math.PI * k) * env.h * 0.06;
      if (k >= 1) affeZustand('haengt', a.flucht ? 0 : 4 + Math.random() * 4);
    } else if (a.zustand === 'flieht') {
      // zügig an der langen Liane hochklettern; abwechselnd strecken (Füße fest) und nachziehen (Hände fest)
      h = halbschritt(a.zeit, KLETTERN.halbHoch);
      a.x = lianenPunkt('endeLinks').x; // bleibt an der (schwingenden) Liane
      a.kopfY = a.kl.startKopf - h.j * m.schritt - m.schritt * glatt(h.p);
      a.poseVon = h.j % 2 === 0 ? POSE_A : POSE_B;
      a.poseNach = 1 - a.poseVon;
      a.p = h.p;
      if (a.kopfY < -m.feld) {
        a.zustand = 'weg';
        a.flucht = false;
      }
    }
  }

  /** Von der aktuellen Position an der langen Liane nach oben klettern. */
  function hochklettern(a, m, kletterteSchon) {
    a.kl = {
      startKopf: kletterteSchon ? a.kopfY : a.y + m.hand,
      ausblend: kletterteSchon ? 0 : UEBERGANG, // vom Hängen ins Klettern überblenden
      fx: a.x,
      fy: a.y,
      pendelFeld: a.pendelFeld || 0,
    };
    affeZustand('flieht');
  }

  /** Ein Feld eines Affen-Streifens zeichnen; k = gemeinsamer Pixel-Maßstab aller Streifen. */
  function affenFeld(ctx, img, felder, anker, feld, k, alpha) {
    var fw = img.naturalWidth / felder, fh = img.naturalHeight;
    var w = fw * k, h = fh * k;
    ctx.globalAlpha = alpha;
    ctx.drawImage(img, feld * fw, 0, fw, fh, -anker[0] * w, -anker[1] * h, w, h);
  }

  /** Kletter-Pose am Anker (Liane/Augenhöhe); Wechsel A↔B mitten im Halbschritt weich überblendet. */
  function zeichneKletterPose(ctx, a, k, alpha) {
    var bl = glatt(Math.min(1, Math.max(0, (a.p - 0.35) / 0.3)));
    affenFeld(ctx, B.affeKlettern, KLETTERN.felder, KLETTERN.anker, a.poseVon, k, alpha);
    if (bl > 0) affenFeld(ctx, B.affeKlettern, KLETTERN.felder, KLETTERN.anker, a.poseNach, k, alpha * bl);
  }

  function zeichnePendel(ctx, a, k, alpha) {
    var phase = (a.zeit / PENDEL.dauer) * PENDEL.felder;
    var feld = Math.floor(phase) % PENDEL.felder;
    var rest = phase - Math.floor(phase);
    a.pendelFeld = feld;
    // nur kurz vor dem Bildwechsel überblenden – sonst sieht man zu lange ein Doppelbild
    var blende = Math.max(0, (rest - 0.7) / 0.3);
    affenFeld(ctx, B.affePendel, PENDEL.felder, PENDEL.anker, feld, k, alpha);
    if (blende > 0) affenFeld(ctx, B.affePendel, PENDEL.felder, PENDEL.anker, (feld + 1) % PENDEL.felder, k, alpha * blende);
  }

  function zeichneAffe(ctx, env) {
    var a = affe;
    if (a.zustand === 'weg' || !geladen(B.affe)) return;
    var k = affenMassstab(env);
    var m = kletterMasse(env);
    var alleDa = geladen(B.affePendel) && geladen(B.affeHangeln) && geladen(B.affeKlettern);

    ctx.save();
    // nicht auf ganze Pixel runden – sonst ruckelt die Bewegung
    if (alleDa && (a.zustand === 'kommt' || a.zustand === 'flieht')) {
      var einblend = a.zustand === 'flieht' && a.kl.ausblend > 0 ? Math.min(1, a.zeit / a.kl.ausblend) : 1;
      if (einblend < 1) {
        // vom Hängen ins Klettern überblenden
        ctx.save();
        ctx.translate(a.kl.fx, a.kl.fy);
        ctx.rotate(lianen.winkel);
        ctx.scale(a.blick, 1);
        affenFeld(ctx, B.affePendel, PENDEL.felder, PENDEL.anker, a.kl.pendelFeld, k, 1 - einblend);
        ctx.restore();
      }
      ctx.translate(a.x, a.kopfY);
      ctx.rotate(lianen.winkel);
      ctx.scale(a.blick, 1);
      zeichneKletterPose(ctx, a, k, einblend);
    } else if (alleDa && a.zustand === 'haengt') {
      ctx.translate(a.x, a.y);
      ctx.rotate(lianen.winkel);
      ctx.scale(a.blick, 1);
      zeichnePendel(ctx, a, k, 1);
      if (a.uebergang > 0) {
        // gerade erst angekommen: Kletter-Pose A (obere Hand an der Faust) weich ausblenden
        ctx.translate(0, m.hand);
        a.poseVon = POSE_A;
        a.p = 0;
        zeichneKletterPose(ctx, a, k, a.uebergang / UEBERGANG);
      }
    } else if (alleDa && a.zustand === 'wechselt') {
      // Hand über Hand: greift vor – hält mit beiden Händen – hängt an der anderen Hand
      var t = Math.min(1, a.zeit / a.dauer);
      var g = HANGELN.grenzen, bl = HANGELN.blende;
      var h1 = t < g[0] ? 0 : t < g[1] ? 1 : 2;
      var naechste = h1 < 2 ? g[h1] : 2;
      var ueber = h1 < 2 ? Math.max(0, (t - (naechste - bl)) / bl) : 0;
      ctx.translate(a.x, a.y);
      ctx.rotate(Math.sin(Math.PI * t) * -0.12 * a.blick + lianen.winkel);
      ctx.scale(a.blick, 1);
      affenFeld(ctx, B.affeHangeln, HANGELN.felder, HANGELN.anker, h1, k, 1);
      if (ueber > 0) affenFeld(ctx, B.affeHangeln, HANGELN.felder, HANGELN.anker, h1 + 1, k, ueber);
    } else {
      // Notlösung, solange die Bildstreifen noch laden: Grundbilder aus affe.webp
      var y = a.zustand === 'kommt' || a.zustand === 'flieht' ? a.kopfY - m.hand : a.y;
      ctx.translate(a.x, y);
      ctx.rotate(lianen.winkel);
      ctx.scale(a.blick, 1);
      affenFeld(ctx, B.affe, AFFE.felder, AFFE.anker, AFFE.HAENGT, k, 1);
    }
    ctx.restore();
  }

  // ---------- Schmetterlinge ----------
  // Draufsicht, 6 Flügelstellungen pro Farbe (alle am Körper ausgerichtet):
  // 0 offen, 1 halb hoch, 2 fast zu, 3 halb, 4 weit offen, 5 leicht nach unten.
  // Sie flattern umher, landen ab und zu auf den roten Blüten im Vordergrund und
  // fliegen bei Lärm davon.
  var FALTER = {
    felder: 6,
    zeilen: 2, // Farbvarianten
    anker: [0.499, 0.548], // Körpermitte
    breite: 0.1, // Spannweite (voll offen) als Anteil der Welthöhe
    bildBreite: 160, // so breit ist die voll geöffnete Stellung im Bild (px)
    schlaegeProSekunde: 3,
  };
  // Sitzen: 0 offen, 1 halb, 2 zu, 3 halb (öffnet wieder) – gleicher Pixel-Maßstab und Körperpunkt
  var FALTER_SITZ = {
    felder: 4,
    zeilen: 2,
    anker: [0.502, 0.542],
    klappen: [1, 2, 2, 3], // alle paar Sekunden langsam zu- und wieder aufklappen
    takt: 0.4, // Sekunden pro Stellung beim Klappen
    periode: 4.5, // so oft wird geklappt
  };
  // Blüten in den Vordergrund-Pflanzen (Anteile des jeweiligen Bildes, v = Oberkante der Blüte)
  var BLUETEN = [
    { links: true, u: 0.454, v: 0.614 },
    { links: true, u: 0.534, v: 0.725 },
    { links: false, u: 0.642, v: 0.501 },
    // die untere Blüte rechts (u 0.278, v 0.741) liegt neben der Stufen-Leiste – bewusst kein Landeplatz
  ];
  var falter = [
    { variante: 0, mut: 0.35 },
    { variante: 1, mut: 0.45 },
    { variante: 0, mut: 0.55 },
  ].map(function (f, i) {
    return {
      variante: f.variante,
      mut: f.mut,
      zustand: 'weg', // 'weg' | 'fliegt' | 'sitzt' | 'flieht'
      warten: i * 1.5, // nicht alle gleichzeitig erscheinen lassen
      x: 0, y: 0, zx: 0, zy: 0, vx: 0,
      phase: Math.random() * 6,
      bluete: -1,
      sitzZeit: 0,
    };
  });

  function pflanzenMasse(env, img) {
    var w = env.w * 0.42;
    var h = (w * (img.naturalHeight || 422)) / (img.naturalWidth || 640);
    return { w: w, h: h };
  }

  function bluetenPunkt(env, i) {
    var b = BLUETEN[i];
    var m = pflanzenMasse(env, b.links ? B.links : B.rechts);
    var x0 = b.links ? 0 : env.w - m.w;
    return { x: x0 + b.u * m.w, y: env.h + m.h * 0.04 - m.h + b.v * m.h };
  }

  function freieBluete() {
    var belegt = falter.map(function (f) { return f.bluete; });
    var frei = BLUETEN.map(function (_, i) { return i; }).filter(function (i) { return belegt.indexOf(i) < 0; });
    return frei.length ? frei[Math.floor(Math.random() * frei.length)] : -1;
  }

  function neuesFlugziel(f, env) {
    f.bluete = -1;
    if (Math.random() < 0.4) {
      var i = freieBluete();
      if (i >= 0) {
        f.bluete = i;
        var p = bluetenPunkt(env, i);
        f.zx = p.x;
        f.zy = p.y;
        return;
      }
    }
    f.zx = env.w * (0.15 + Math.random() * 0.7);
    f.zy = env.h * (0.25 + Math.random() * 0.45);
  }

  function bewegeFalter(env) {
    falter.forEach(function (f) {
      var ruhig = env.ruhe > f.mut + 0.04;
      var laut = env.ruhe < f.mut - 0.04;
      f.phase += env.dt;

      if (laut && (f.zustand === 'fliegt' || f.zustand === 'sitzt')) {
        f.zustand = 'flieht';
        f.bluete = -1;
        f.zx = f.x < env.w / 2 ? -env.w * 0.1 : env.w * 1.1;
        f.zy = -env.h * 0.1;
      }
      if (f.zustand === 'weg') {
        if (!ruhig) return;
        f.warten -= env.dt;
        if (f.warten > 0) return;
        var vonLinks = Math.random() < 0.5;
        f.x = vonLinks ? -env.w * 0.05 : env.w * 1.05;
        f.y = env.h * (0.3 + Math.random() * 0.3);
        f.zustand = 'fliegt';
        neuesFlugziel(f, env);
      }
      if (f.zustand === 'sitzt') {
        var p = bluetenPunkt(env, f.bluete);
        f.x = p.x;
        f.y = p.y;
        f.sitzZeit -= env.dt;
        if (f.sitzZeit <= 0) {
          f.zustand = 'fliegt';
          neuesFlugziel(f, env);
        }
        return;
      }
      // fliegen: auf das Ziel zu, mit Taumeln quer zur Flugrichtung
      var dx = f.zx - f.x, dy = f.zy - f.y;
      var d = Math.sqrt(dx * dx + dy * dy) || 1;
      var tempo = (f.zustand === 'flieht' ? 0.35 : 0.12) * env.w;
      var taumel = Math.sin(f.phase * 5) * 0.6;
      var vx = (dx / d) * tempo - (dy / d) * tempo * taumel;
      var vy = (dy / d) * tempo + (dx / d) * tempo * taumel + Math.sin(f.phase * 7) * env.h * 0.08;
      var schritt = Math.min(d, tempo * env.dt);
      f.x += (vx / tempo) * schritt;
      f.y += (vy / tempo) * schritt;
      f.vx = vx;
      if (d < env.h * 0.015) {
        if (f.zustand === 'flieht') {
          f.zustand = 'weg';
          f.warten = 1 + Math.random() * 2;
        } else if (f.bluete >= 0) {
          f.zustand = 'sitzt';
          f.sitzZeit = 3 + Math.random() * 4;
          f.phase = FALTER_SITZ.periode - 1.2; // erst kurz offen sitzen, dann zum ersten Mal klappen
        } else {
          neuesFlugziel(f, env);
        }
      }
    });
  }

  function zeichneFalter(ctx, env) {
    if (!geladen(B.falter)) return;
    var k = (env.h * FALTER.breite) / FALTER.bildBreite; // gleicher Maßstab für Flug- und Sitzbilder
    falter.forEach(function (f) {
      if (f.zustand === 'weg') return;
      var img = B.falter, info = FALTER, feld, kipp = 0;
      if (f.zustand === 'sitzt' && geladen(B.falterSitzt)) {
        // sitzend: meist offen, alle paar Sekunden langsam zu- und wieder aufklappen
        img = B.falterSitzt;
        info = FALTER_SITZ;
        var t = f.phase % FALTER_SITZ.periode;
        var schritt = Math.floor(t / FALTER_SITZ.takt);
        feld = schritt < FALTER_SITZ.klappen.length ? FALTER_SITZ.klappen[schritt] : 0;
      } else if (f.zustand === 'sitzt') {
        feld = 0;
      } else {
        // fliegend: Flügelschlag aus 6 Bildern, auf der Flucht schneller; leicht in Flugrichtung geneigt
        var takt = FALTER.schlaegeProSekunde * FALTER.felder * (f.zustand === 'flieht' ? 1.6 : 1);
        feld = Math.floor(f.phase * takt) % FALTER.felder;
        kipp = Math.max(-0.45, Math.min(0.45, f.vx / (env.w * 0.3)));
      }
      var fw = img.naturalWidth / info.felder, fh = img.naturalHeight / info.zeilen;
      var w = fw * k, h = fh * k;
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.rotate(kipp);
      ctx.drawImage(img, feld * fw, f.variante * fh, fw, fh, -info.anker[0] * w, -info.anker[1] * h, w, h);
      ctx.restore();
    });
  }

  // ---------- Pflanzen im Vordergrund ----------
  function zeichnePflanze(ctx, env, img, links) {
    if (!geladen(img)) return;
    var w = env.w * 0.42;
    var h = (w * img.naturalHeight) / img.naturalWidth;
    // leichtes Wiegen im Wind: Scherung um den Fußpunkt, bei Ruhe sanfter
    var wind = Math.sin(env.t * 0.9 + (links ? 0 : 1.7)) * (0.012 + (1 - env.ruhe) * 0.02);
    ctx.save();
    ctx.translate(links ? 0 : env.w, env.h + h * 0.04);
    ctx.transform(1, 0, wind, 1, 0, 0);
    ctx.drawImage(img, links ? 0 : -w, -h, w, h);
    ctx.restore();
  }

  // Im Debug-Modus Zustand der Tiere zum Nachsehen in der Browser-Konsole freigeben
  if (DEBUG) window.dschungel = { affe: affe, tukan: tukan, schlange: schlange, falter: falter };

  MM.welten.register('dschungel', {
    init: function (env) {
      tukan.zustand = 'weg';
      affe.zustand = 'weg';
      affe.flucht = false;
      falter.forEach(function (f, i) {
        f.zustand = 'weg';
        f.bluete = -1;
        f.warten = 0.5 + i * 1.5;
      });
      schlange.x = -50;
      schlange.ziel = env.w * 0.4;
    },

    draw: function (ctx, env) {
      // Die Bilder sind größer als die Welt: weich verkleinern statt Pixel zu verschlucken
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      if (!geladen(B.hintergrund)) {
        MM.welten.platzhalter(ctx, env);
        return;
      }
      hintergrundRahmen(env);
      ctx.drawImage(B.hintergrund, bg.x, bg.y, bg.w, bg.h);
      zeichneLianen(ctx, env);
      bewegeAffe(env);
      zeichneAffe(ctx, env);
      if (DEBUG) zeichneHaltepunkte(ctx);

      bewegeSchlange(env);
      bewegeTukan(env);
      zeichneSchlange(ctx, env);
      zeichneTukan(ctx, env);

      zeichnePflanze(ctx, env, B.links, true);
      zeichnePflanze(ctx, env, B.rechts, false);

      // Schmetterlinge vor den Pflanzen, damit sie auf den Blüten sitzen können
      bewegeFalter(env);
      zeichneFalter(ctx, env);

      // Wird es laut, wird es im Dschungel dunkler
      var dunkel = (1 - env.ruhe) * 0.4;
      if (dunkel > 0.01) {
        ctx.fillStyle = 'rgba(5, 20, 12, ' + dunkel.toFixed(3) + ')';
        ctx.fillRect(0, 0, env.w, env.h);
      }
    },
  });
})();
