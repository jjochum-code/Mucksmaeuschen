# Mucksmäuschen

Kostenlose Open-Source-Lautstärkeanzeige für Grundschulklassen (Smartboard, Beamer, Tablet).
Die Lautstärke wird **nur lokal** im Browser ausgewertet – nichts wird aufgezeichnet, gespeichert oder übertragen.

## Stand (v0.1)
- Mikrofonpegel (Web Audio, RMS → dBFS, ohne Echo-/Rauschunterdrückung und Auto-Gain)
- Kalibrierung des Grundpegels (4 s, Median)
- 4 Farbstufen: Mucksmäuschenstill · Leise · Etwas laut · Zu laut!
- Glättung + Verzögerung (Stufe steigt erst nach 1,5 s, fällt nach 1,2 s)
- Phasen Stillarbeit / Unterricht / Gruppenarbeit mit eigenen Schwellen
- Vertikaler Pegelmesser neben der Ampel mit Schieberegler: Der Griff markiert die
  Grenze zu „Zu laut!“ und lässt sich über die ganze Höhe (0–40 dB über Grundpegel)
  ziehen oder per Pfeiltasten verschieben; die Grenzen zu „Leise“ und „Etwas laut“
  wachsen im gleichen Verhältnis mit. Wird je Phase gemerkt.
- Spielwelten zur Auswahl beim Start: Wald, Wiese, Wasser, Strand, Dschungel.
  Ruhe belebt die Welt, Lärm lässt sie sich zurückziehen. Wasser ist als Beispiel
  ausgebaut (Pixel-Fische nach [Pixelquarium](https://github.com/jjochum-code/Pixelquarium)),
  die anderen sind Platzhalter zum Füllen → [welten/README.md](welten/README.md)
- Handbetrieb ohne Mikrofon (Stufe antippen oder Tasten 1–4), Vollbild, Bildschirm bleibt an

## Aufbau
Reines HTML, CSS und JavaScript – kein Build-Schritt, keine Abhängigkeiten.

```
index.html           Seite
css/style.css        Gestaltung
js/config.js         Stufen, Phasen, Grenzwerte (Daten)
js/loudness.js       Glättung und Stufenlogik
js/mic.js            Mikrofon → Pegel (Web Audio)
js/welten.js         lädt und zeigt die Spielwelten
js/app.js            Oberfläche und Ablauf
welten/              eine Unterordner je Spielwelt (Daten, Zeichnung, Vorschau)
nginx/default.conf   nginx-Konfiguration (Sicherheits-Header, Mikrofon-Freigabe)
docker-compose.yml   startet nginx lokal
```

## Lokal starten (nginx)
Das Mikrofon braucht `https` oder `localhost`. Mit Docker (z. B. Docker Desktop oder Colima):

```bash
docker compose up -d
```

Dann http://localhost:8080 öffnen. Änderungen an HTML/CSS/JS sind nach einem Neuladen
sofort sichtbar. Stoppen mit `docker compose down`.

Ohne Docker lässt sich `nginx/default.conf` auch in eine vorhandene nginx-Installation
übernehmen – dann `root` auf den Projektordner setzen.

## Lizenz
MIT
