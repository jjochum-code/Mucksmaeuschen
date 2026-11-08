# Mucksmäuschen

Kostenloses Open-Source-Ruhespiel für Grundschulklassen (Smartboard, Beamer, Tablet):
Ist die Klasse ruhig, wird eine Spielwelt lebendig – wird es laut, zieht sie sich zurück.
Die Lautstärke wird **nur lokal** im Browser ausgewertet – nichts wird aufgezeichnet,
gespeichert oder übertragen.

> Entstanden am Wochenende des **[Saar Hackathon 2026](https://www.what-the-hack.saarland/)**
> (7./8. November 2026, Saarbrücken).

## Starten – ohne Server

1. Repository herunterladen (oder klonen).
2. **`index.html` doppelklicken** – fertig. Kein Server, keine Installation, kein Internet nötig.
3. Welt wählen, dann „Mikrofon starten“ (oder „Ohne Mikrofon“ und mit den Tasten 1–4 steuern).

Empfohlen: aktuelles **Chrome, Edge oder Firefox**. Beim Öffnen als Datei fragt der Browser
bei jedem Start nach dem Mikrofon.

## Stand
- Mikrofonpegel (Web Audio, RMS → dBFS, ohne Echo-/Rauschunterdrückung und Auto-Gain)
- Kalibrierung des Grundpegels (4 s, Median), Glättung + Verzögerung (Stufe steigt erst
  nach 1,5 s, fällt nach 1,2 s) – Husten oder Stühlerücken lösen nichts aus
- 4 Stufen: Mucksmäuschenstill · Leise · Etwas laut · Zu laut! – als farbiger Rahmen,
  Schild und Pegelmesser über der Spielwelt
- Phasen Stillarbeit / Unterricht / Gruppenarbeit mit eigenen Schwellen
- Schieberegler am Pegelmesser: Grenze zu „Zu laut!“ live verschieben (0–40 dB über
  Grundpegel), wird je Phase gemerkt
- Spielwelten über den ganzen Bildschirm, Auswahl beim Start:
  - **Wasser** – Pixel-Fische (nach [Pixelquarium](https://github.com/jjochum-code/Pixelquarium)), Krebse, Schnecken
  - **Dschungel** – Orang-Utan an den Lianen, Tukan, Schlange, Schmetterlinge
  - **Strand** – Krabben, Seesterne, Delfine, Möwen
  - **Wald**, **Wiese** – im Aufbau
- Handbetrieb ohne Mikrofon (Stufe antippen oder Tasten 1–4), Vollbild, Bildschirm bleibt an
- Messwerte zum Einstellen: Taste **D** oder `?debug` in der Adresse

## Aufbau
Reines HTML, CSS und JavaScript – kein Build-Schritt, keine Abhängigkeiten.
Alles wird über normale `<script>`-Dateien geladen, deshalb läuft die App auch per Doppelklick.

```
index.html           Seite
css/style.css        Gestaltung
js/config.js         Stufen, Phasen, Grenzwerte (Daten)
js/loudness.js       Glättung und Stufenlogik
js/mic.js            Mikrofon → Pegel (Web Audio)
js/welten.js         lädt und zeigt die Spielwelten
js/app.js            Oberfläche und Ablauf
img/                 Logo und Icons
welten/liste.js      welche Welten es gibt (Reihenfolge der Auswahl)
welten/<welt>/       je Welt: welt.js (Daten), szene.js (Zeichnung), Vorschau, assets/
nginx/, docker-compose.yml   optional: lokaler Webserver
```

Eine eigene Welt bauen: siehe [welten/README.md](welten/README.md).

## Optional: mit Webserver (nginx)
Für Tests wie im späteren Betrieb (oder damit das Mikrofon nur einmal erlaubt werden muss):

```bash
docker compose up -d
```

Dann http://localhost:8080 öffnen, stoppen mit `docker compose down`.

## Roadmap / ToDos

**Als Nächstes**
- [ ] Team-Branches zusammenführen (`welt-wald`, `Belohnungssystem`) – Weltdaten dabei
      von `welt.json` auf `welt.js` umstellen
- [ ] Mit echtem Mikrofon in einer Klasse testen und die Standard-Schwellen der Phasen anpassen
- [ ] Wiese ausbauen

**Das eigentliche Aufbauspiel**
- [ ] Ruhe-Runden: Dauer festlegen (z. B. 10 min), am Ende Belohnung je nach Ruhe
- [ ] Währung (z. B. „Mucks-Münzen“) und Shop je Welt – die Items stehen schon in `welt.js`
- [ ] Gekaufte Items in der Szene anzeigen; Kreaturen kommen von selbst, wenn ihre
      Bedingungen (`braucht`) erfüllt sind
- [ ] Spielstand speichern (localStorage/IndexedDB) und als JSON-Datei exportieren/importieren
- [ ] Mehrere Klassen auf einem Gerät (eigener Spielstand je Klasse)

**Für Lehrkräfte**
- [ ] Einstellungsseite (Phasen, Rundendauer, Schwellen) statt Code
- [ ] Kurze Anleitung im Startbildschirm, Hinweise zu Mikrofon und Datenschutz

**Später**
- [ ] Hosting (z. B. GitLab Pages) mit HTTPS
- [ ] PWA: Service Worker (offline nach erstem Besuch) und Manifest (installierbar)
- [ ] Leistung auf älteren Smartboards prüfen (Bildgrößen, Pixelgröße je Welt)
- [ ] Herkunft/Lizenz aller Grafiken dokumentieren
- [ ] Automatische Tests für die Lautstärke-Logik (`js/loudness.js`)

## Lizenz
MIT – entstanden beim [Saar Hackathon 2026](https://www.what-the-hack.saarland/).
