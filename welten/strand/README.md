# Welt: Strand

Ein Pixel-Strand mit Liege, rot-weißem Sonnenschirm und Bewohnern, die auf die Lautstärke reagieren.
A pixel beach with a sun lounger, an umbrella and residents that react to the noise level.

Status: **spielbar**

## Wer wohnt hier? / Who lives here?

| Stufe | Krabben | Seesterne | Delfine | Möwen | Muscheln |
|---|---|---|---|---|---|
| 0 still | laufen seitwärts, klappern mit den Scheren | tanzen und lächeln | springen aus dem Wasser | laufen herum, picken, rufen „Kriiäh!“, strecken die Flügel; die zweite gleitet am Himmel | öffnen sich, Perle glitzert |
| 1 leise | bleiben stehen, schauen sich um | liegen still | schwimmen, nur die Flosse ist zu sehen | stehen, schauen sich um | zu |
| 2 etwas laut | zittern und schauen sich hektisch um | zittern | schwimmen, nur die Flosse ist zu sehen | schauen sich hektisch um, hüpfen nervös | zu |
| 3 zu laut | graben sich ein, nur die Augen gucken raus | rollen ins Meer | hauen ab | flattern steil hoch und hauen ab | zu |

Verstecken tun sich alle erst bei „Zu laut!“. Wird es wieder ruhig, kommen sie nach und nach zurück. Wer sich erschreckt, bekommt ein „!“.

Ausprobieren: „Ohne Mikrofon“ starten und mit den Tasten **1–4** die Stufe wechseln.

## Dateien

| Datei | Wofür |
|---|---|
| `welt.js` | Name, Farben (Himmel, Meer, Sand …), Items und Kreaturen |
| `szene.js` | Zeichnung und Verhalten aller Bewohner |
| `vorschau.svg` | Bild für die Auswahl im Startbildschirm |
| `assets/` | (noch leer) |

## Selbst ändern / Make changes

- **Farben** von Himmel, Meer und Sand stehen in `welt.js`.
- **Tiere und Gegenstände** sind in `szene.js` als Text-Pixelbilder gemalt: jeder Buchstabe
  ist ein Pixel, `.` ist durchsichtig. Welche Farbe ein Buchstabe hat, steht in `FARBEN`.
- **Wo** etwas steht, steht in `aufbauen()` als Anteil von Breite und Höhe (0 … 1).
- Die Aufteilung Himmel / Meer / Sand steuern `HORIZONT` und `UFER` oben in `szene.js`.

Alle Bilder sind selbst gemalt (Pixel für Pixel im Code), es gibt keine fremden Grafiken.
