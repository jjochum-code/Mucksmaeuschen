# Welt: Dschungel

Riesige Bäume, Lianen, ein Tukan und eine Schlange.

Status: **spielbar (erste Fassung)**

## Ebenen

| Ebene | Datei | Verhalten |
|---|---|---|
| Hintergrund | `assets/hintergrund.webp` | füllt den Bildschirm, unten bündig |
| Lianen | `assets/lianen.webp` | Ast mit Lianen oben aus dem Blätterdach, schwingt leicht (Haltepunkte `LIANEN_PUNKTE`, mit `?debug` pink sichtbar) |
| Affe | `assets/affe.webp` | Orang-Utan: klettert an der langen Liane herab, pendelt und hangelt sich zwischen den Haltepunkten (lange Liane → Schlaufe → Ranke und zurück) |
| Tiere | `assets/schlange.webp`, `assets/tukan-flug.webp`, `assets/tukan-sitzt.webp` | Schlange schlängelt über den Waldboden, Tukan landet abwechselnd auf den beiden Ästen |
| Schmetterlinge | `assets/schmetterling.webp` | 3 Falter (blau/orange) flattern umher, landen auf den roten Blüten (`BLUETEN`) und fliegen bei Lärm davon |
| Vordergrund | `assets/pflanzen-links.webp`, `assets/pflanzen-rechts.webp` | wiegen sich im Wind; die Schlange versteckt sich dahinter |

Bei Lärm: Affe klettert ins Blätterdach, Tukan fliegt davon, Schlange zieht sich hinter die Pflanzen zurück,
der Dschungel wird dunkler. Der Affe ist am scheuesten (kommt erst bei viel Ruhe), die Schlange am mutigsten.

Die Sitzplätze des Tukans stehen in `szene.js` unter `AESTE` (Anteile 0…1 der Bildbreite/-höhe).
Bei einem neuen Hintergrundbild müssen sie angepasst werden.

## Animationen

| Tier | Bilder | Stand |
|---|---|---|
| Tukan fliegt | 3 (oben – Mitte – unten, abgespielt als oben–Mitte–unten–Mitte) | ✅ `tukan-flug.webp` |
| Tukan sitzt | 2 (normal, Kopf geneigt) | ✅ `tukan-sitzt.webp` |
| Affe pendelt | 8 (ein Schwung Mitte – rechts – Mitte – links), weich überblendet | ✅ `affe-pendel.webp` |
| Affe hangelt | 3 (greift vor, beide Hände, hängt an der anderen Hand) – am Griff ausgerichtet | ✅ `affe-hangeln.webp` |
| Affe klettert | 2 Posen (gestreckt, zusammengezogen) – an Liane und Augenhöhe ausgerichtet | ✅ `affe-klettern.webp` |

**Wie das Klettern geschmeidig wird:** Pro Halbschritt bleibt ein Kontaktpunkt an der Liane fest –
beim Strecken die Füße, beim Nachziehen die Hände. Der Kopf bewegt sich dabei um genau eine
Schrittlänge (`KLETTERN.schritt`) weich nach oben bzw. unten, die Pose wird in der Mitte des Schritts
übergeblendet. Beim Herabklettern endet der Affe so, dass seine obere Hand genau am Lianenende sitzt,
und blendet dann ins Pendeln über (`UEBERGANG`).
| Schmetterling fliegt | 6 Flügelstellungen (Draufsicht), am Körper ausgerichtet, blau + orange umgefärbt | ✅ `schmetterling.webp` |
| Schmetterling sitzt | 4 (offen, halb, zu, halb) – an die Größe der Flugbilder angeglichen | ✅ `schmetterling-sitzt.webp` |
| Schlange | 1 – das Schlängeln macht der Code; optional 2 für Zunge drin/draußen | Einzelbild |
| Pflanzen | 1 – Wiegen macht der Code | Einzelbild |

Animationen liegen als **Bildstreifen** vor: alle Felder gleich groß nebeneinander in einer Datei.
In `szene.js` stehen dazu Anzahl der Felder und der **Ankerpunkt** (die Füße, als Anteil des Feldes),
damit der Tukan beim Wechsel zwischen Fliegen und Sitzen nicht springt. Die Einzelbilder wurden
dafür auf gleiche Größe gebracht und am Auge (Flug) bzw. an den Füßen (Sitzen) ausgerichtet.

Für neue Animationsbilder gilt:

- alle Bilder einer Animation **gleich groß**, das Tier an **derselben Stelle** und in derselben Größe
- **gleiche Blickrichtung** (Tukan nach links, Schlange nach rechts – gespiegelt wird per Code)
- **transparenter Hintergrund**, gleicher Pixel-Stil wie die bisherigen Bilder
- Dateinamen durchnummeriert, z. B. `tukan-flug-1.png` … `tukan-flug-4.png`

## Herkunft der Bilder

Vom Team bereitgestellt (Hackathon 2026). Für die App verkleinert, freigestellt und als WebP gespeichert.
