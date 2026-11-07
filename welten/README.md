# Spielwelten

Hier liegen die Welten, aus denen die Lehrkraft beim Start auswählt. Jede Welt hat
einen eigenen Ordner. **Ihr könnt eure Welt bauen, ohne irgendetwas außerhalb eures
Ordners anzufassen.**

| Ordner | Welt | Stand |
|---|---|---|
| `wald/` | Wald | Platzhalter |
| `wiese/` | Wiese | Platzhalter |
| `wasser/` | Wasser | **ausgebautes Beispiel** (Pixel-Fische nach Pixelquarium) |
| `strand/` | Strand | Platzhalter |
| `dschungel/` | Dschungel | Platzhalter |

## Was in einem Welt-Ordner liegt

```
welten/wald/
  welt.json      Daten: Name, Beschreibung, Farben, Items, Kreaturen
  szene.js       Zeichnung und Bewegung der Welt
  vorschau.svg   Bild für die Auswahl (160 × 100)
  assets/        eigene Bilder, Sprites usw.
  README.md      Notizen zur Welt
```

## Loslegen

1. Seite starten: `docker compose up -d`, dann http://localhost:8080 öffnen.
2. Im Startbildschirm eure Welt wählen und „Ohne Mikrofon“ starten.
   Mit den Tasten **1–4** schaltet ihr die Ampel von „still“ bis „zu laut“ und seht,
   wie eure Welt reagiert.
3. In `szene.js` die Zeile `MM.welten.platzhalter(ctx, env);` durch eure eigene
   Zeichnung ersetzen. Speichern, Seite neu laden – fertig.

`welten/wasser/szene.js` ist ein komplettes Beispiel zum Abgucken.

## So sieht `szene.js` aus

```js
'use strict';

MM.welten.register('wald', {
  // einmal beim Anzeigen der Welt (z. B. Bäume verteilen)
  init: function (env) {},

  // optional: wenn sich die Größe ändert
  resize: function (env) {},

  // jedes Bild, ca. 60× pro Sekunde
  draw: function (ctx, env) {
    var P = env.pixel;
    P.verlauf(ctx, env, '#a8d8ff', '#e3f3ff');         // Himmel
    ctx.fillStyle = '#3f7d3a';
    ctx.fillRect(0, env.h * 0.7, env.w, env.h);        // Boden
  },
});
```

Die id in `register('…')` muss genau dem Ordnernamen entsprechen.

### Was in `env` steht

| Feld | Bedeutung |
|---|---|
| `env.w`, `env.h` | Größe der Welt in **Welt-Pixeln** (1 Welt-Pixel = 4 Bildschirm-Pixel → Pixel-Look) |
| `env.ruhe` | **0 = laut … 1 = ganz ruhig**, sanft geglättet. Damit steuert ihr, wie lebendig die Welt ist. |
| `env.stufe` | Ampelstufe 0 (still) bis 3 (zu laut) |
| `env.t`, `env.dt` | Zeit seit Start und seit dem letzten Bild (Sekunden) – für Animationen |
| `env.welt` | Inhalt eurer `welt.json` (z. B. `env.welt.farben.boden`) |
| `env.pixel` | Hilfsfunktionen (siehe unten) |

Idee: **Ruhe belebt die Welt** (Tiere kommen heraus, Blumen öffnen sich, Sonne geht auf),
**Lärm lässt sie sich zurückziehen** (Tiere verstecken sich, Himmel wird grau).

### Hilfsfunktionen `env.pixel`

| Funktion | Wofür |
|---|---|
| `verlauf(ctx, env, oben, unten)` | Farbverlauf über die ganze Fläche (Himmel, Wasser) |
| `schattiere(farbe, f)` | Farbe dunkler (`f < 1`) oder heller (`f > 1`) |
| `zufall(seed)` | Zufallszahlen, die bei gleichem Startwert immer gleich sind |
| `mische(a, b, t)` | Zwischen zwei Zahlen überblenden (`t` = 0 … 1) |

Eigene Bilder aus `assets/` ladet ihr so:

```js
var baum = new Image();
baum.src = 'welten/wald/assets/baum.png';
// in draw():  ctx.drawImage(baum, x, y);
```

## `welt.json`

```json
{
  "name": "Wald",
  "beschreibung": "Bäume, Pilze und scheue Waldtiere",
  "status": "platzhalter",
  "vorschau": "vorschau.svg",
  "farben": { "himmel": "#a8d8ff", "horizont": "#e3f3ff", "boden": "#3f7d3a" },
  "items": [
    { "id": "tanne", "name": "Tanne", "preis": 10, "beschreibung": "Ein Nadelbaum" }
  ],
  "kreaturen": [
    { "id": "eichhoernchen", "name": "Eichhörnchen", "braucht": ["tanne"], "beschreibung": "Kommt, wenn es Bäume gibt" }
  ]
}
```

- `status`: `"platzhalter"` zeigt in der Auswahl „im Aufbau“, `"spielbar"` blendet das aus.
- `items` sind Landschaftselemente, die die Klasse später mit ihrer Ruhe-Währung kauft.
- `kreaturen` kommen von selbst, wenn alles aus `braucht` vorhanden ist.
  Items und Kreaturen sind schon als Daten angelegt, das Kaufen kommt in einem späteren Schritt.

## Neue Welt hinzufügen

1. Einen vorhandenen Ordner kopieren, z. B. `wald/` → `berge/`.
2. In `berge/szene.js` die id ändern: `MM.welten.register('berge', …)`.
3. `berge/welt.json` anpassen.
4. In `welten/welten.json` die id `"berge"` in die Liste eintragen.

## Regeln

- Keine Dateien aus dem Internet laden (keine CDNs, keine Web-Fonts) – die App läuft offline
  und verspricht, nichts nach außen zu schicken. Alles gehört in `assets/`.
- Nur Bilder verwenden, die ihr selbst gemacht habt oder die eine freie Lizenz haben
  (z. B. CC0). Herkunft bitte in die README eures Ordners schreiben.
- Ein Fehler in eurer `szene.js` legt die App nicht lahm: Die Welt zeigt dann den
  Platzhalter, und der Fehler steht in der Browser-Konsole (F12).
