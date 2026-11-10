# Welt: Wald

Ein Pixel-Wald mit zwei großen Bäumen, Baumstumpf, vielen Blumen (Tulpen, Gänseblümchen …), vielen Pilzen (Fliegenpilze, Steinpilze) und Bewohnern,
die auf die Lautstärke reagieren.
A pixel forest with two big trees, a stump, flowers, toadstools and residents that react to the noise level.

Status: **spielbar**

## Wer wohnt hier? / Who lives here?

| Stufe | Eichhörnchen | Igel | Hase | Vögel | Schmetterlinge | Blumen |
|---|---|---|---|---|---|---|
| 0 still | springt in Bögen herum, knabbert eine Nuss, wippt und zuckt mit dem Schwanz | schnüffelt herum | hoppelt herum, wackelt mit der Nase | singen (Noten fliegen) | flattern herum | öffnen sich nach und nach |
| 1 leise | sitzt still, schaut sich um | bleibt stehen | sitzt still | sitzen still | ruhen sich auf den Blumen aus | zu |
| 2 etwas laut | zittert, schaut sich hektisch um | zittert | zittert, schaut sich hektisch um | zittern, gucken hektisch | ruhen sich auf den Blumen aus | zu |
| 3 zu laut | klettert ruckartig auf den Baum, Schwanz hängt raus, Augen gucken aus dem Laub | rollt sich zur Stachelkugel | hoppelt weg ins Gebüsch | fliegen weg | fliegen weg | zu |

Verstecken tun sich alle erst bei „Zu laut!“. Wird es wieder ruhig, kommen sie nach und nach zurück.
Wer sich erschreckt, bekommt ein „!“.

Ausprobieren: „Ohne Mikrofon“ starten und mit den Tasten **1–4** die Stufe wechseln.

## Dateien

| Datei | Wofür |
|---|---|
| `welt.js` | Name, Farben (Himmel, Gras, Laub, Stamm …), Items und Kreaturen |
| `szene.js` | Zeichnung und Verhalten aller Bewohner |
| `vorschau.svg` | Bild für die Auswahl im Startbildschirm |
| `assets/` | (noch leer) |

## Selbst ändern / Make changes

- **Farben** von Himmel, Gras, Laub und Stämmen stehen in `welt.js`.
- **Tiere und Gegenstände** sind in `szene.js` als Text-Pixelbilder gemalt: jeder Buchstabe
  ist ein Pixel, `.` ist durchsichtig. Welche Farbe ein Buchstabe hat, steht in `FARBEN`.
- **Wo** etwas steht, steht in `aufbauen()` als Anteil von Breite und Höhe (0 … 1).
- Wo die Wiese anfängt, steuert `BODEN` oben in `szene.js`.

Das Aussehen ist an `img/wald.png` angelehnt, aber alles ist im Code selbst gemalt.
