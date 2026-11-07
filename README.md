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

## Entwickeln
```bash
npm install
npm run dev
```

Stufen und Phasen stehen in `src/config/levels.ts`, die Mess- und Glättungslogik in `src/audio/`.

## Lizenz
MIT
