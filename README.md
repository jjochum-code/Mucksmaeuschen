# Mucksmäuschen

Kostenlose Open-Source-Lautstärkeanzeige für Grundschulklassen (Smartboard, Beamer, Tablet).
Die Lautstärke wird **nur lokal** im Browser ausgewertet – nichts wird aufgezeichnet, gespeichert oder übertragen.

## Stand (v0.1)
- Mikrofonpegel (Web Audio, RMS → dBFS, ohne Echo-/Rauschunterdrückung und Auto-Gain)
- Kalibrierung des Grundpegels (4 s, Median)
- 4 Farbstufen: Mucksmäuschenstill · Leise · Etwas laut · Zu laut!
- Glättung + Verzögerung (Stufe steigt erst nach 1,5 s, fällt nach 1,2 s)
- Phasen Stillarbeit / Unterricht / Gruppenarbeit mit eigenen Schwellen
- Vertikaler Pegelmesser neben der Ampel mit Schieberegler: Die Grenze zu „Zu laut!“
  lässt sich live verschieben (ziehen, antippen oder Pfeiltasten), die anderen Grenzen
  wandern mit; wird je Phase gemerkt
- Handbetrieb ohne Mikrofon (Stufe antippen oder Tasten 1–4), Vollbild, Bildschirm bleibt an

## Aufbau
Reines HTML, CSS und JavaScript – kein Build-Schritt, keine Abhängigkeiten.

```
index.html        Seite
css/style.css     Gestaltung
js/config.js      Stufen, Phasen, Grenzwerte (Daten)
js/loudness.js    Glättung und Stufenlogik
js/mic.js         Mikrofon → Pegel (Web Audio)
js/app.js         Oberfläche und Ablauf
```

## Lokal starten
Das Mikrofon braucht `https` oder `localhost`, deshalb über einen kleinen Webserver öffnen:

```bash
python3 -m http.server 5173
```

Dann http://localhost:5173 im Browser öffnen. Zum Veröffentlichen genügt es, die Dateien
auf einen statischen Webspace (z. B. GitLab/GitHub Pages) zu legen.

## Lizenz
MIT
