# Roadmap

Mucksmäuschen soll eine Lärmampel mit **langfristigem gemeinsamen Ziel** werden:
Ruhige Phasen bringen Punkte, mit denen die Klasse ihre Spielwelt Stück für Stück
belebt – und später ihr eigenes **Klassentier** (z. B. die „Affenklasse“) großzieht.

| Milestone | Wann | Ziel |
|---|---|---|
| **1 – Spielwelten** | ✅ Saar Hackathon, 7./8. November 2026 | Lautstärke messen, Welten reagieren auf Ruhe |
| **2 – Ruhe lohnt sich** | Saar Hackathon, 1./2. Mai 2027 | Ruhe-Blöcke, Punkte, Itemstore, Spielstand |
| **3 – Unser Klassentier** | danach | Klassentier als Maskottchen, das mit der Klasse wächst |

---

## Milestone 1 – Spielwelten ✅

*Saar Hackathon, 7./8. November 2026*

**Lautstärke**
- [x] Mikrofonpegel lokal im Browser (Web Audio, keine Aufnahme, keine Übertragung)
- [x] Kalibrierung des Grundpegels, Glättung und Verzögerung gegen Husten/Stühlerücken
- [x] 4 Stufen (Mucksmäuschenstill · Leise · Etwas laut · Zu laut!), Phasen Stillarbeit /
      Unterricht / Gruppenarbeit
- [x] Pegelmesser mit Schieberegler zur Live-Kalibrierung, je Phase gemerkt
- [x] Handbetrieb ohne Mikrofon (Tasten 1–4), Vollbild, Bildschirm bleibt an

**Spielwelten**
- [x] Weltauswahl beim Start, Welt über den ganzen Bildschirm
- [x] Ordnerstruktur, damit das Team Welten unabhängig bauen kann (`welten/<welt>/`)
- [x] **Wasser** – Pixel-Fische, Krebse, Schnecken
- [x] **Dschungel** – Orang-Utan an Lianen (klettern, pendeln, hangeln), Tukan, Schlange,
      Schmetterlinge; Bild-Ebenen mit Animationsbildern
- [x] **Strand** – Krabben, Seesterne, Delfine, Möwen (Team)
- [ ] **Wald** – liegt im Branch `welt-wald`, noch nicht zusammengeführt
- [ ] **Wiese** – Platzhalter

**Technik**
- [x] Reines HTML/CSS/JavaScript, startet per Doppelklick ohne Server
- [x] Optional nginx (Docker) mit Sicherheits-Headern
- [x] Logo, Icon, Hinweis auf den Saar Hackathon

---

## Milestone 2 – Ruhe lohnt sich

*Ziel für den Saar Hackathon am 1./2. Mai 2027.*
Kern: **Ruhe-Blöcke → Punkte → Itemstore → die Welt wird lebendiger.**

### Entscheidungen
| Frage | Entscheidung |
|---|---|
| Punkte | **Anteilig**: Punkte je ruhiger Minute, Bonus bei 100 % – **nie Abzug**. Laut-Sein bringt nur nichts. |
| Startzustand | **Karg starten**: Landschaft + 1 Starttier. Alles Weitere wird gekauft bzw. freigeschaltet – der Fortschritt ist sichtbar. |
| Welten | **Eine Welt pro Klasse**: Die Klasse wählt am Anfang ihre Welt und baut sie auf (passt zum späteren Klassentier). Weitere Welten später als große Belohnung. |
| Store | **Die Klasse stimmt ab**: Die App zeigt 2–3 bezahlbare Vorschläge, die Klasse stimmt per Handzeichen ab, die Lehrkraft tippt das Ergebnis an. |

### Beispiel: ein Ruhe-Block
1. Lehrkraft wählt „15 Minuten Stillarbeit“ und startet.
2. Über der Welt läuft die Restzeit; ein Balken zeigt, wie viel bisher ruhig war.
3. Ist es zu laut, zieht sich die Welt wie gewohnt zurück – diese Zeit zählt nur nicht mit.
4. Nach 15 Minuten: 13 ruhige Minuten → **13 Punkte**. Kleine Feier in der Welt.
5. Reicht der Punktestand, zeigt der Store 2–3 Vorschläge (z. B. „Blüten 10 · Lianen 15 ·
   Tukan-Nest 20“). Die Klasse stimmt ab, die Lehrkraft tippt den Gewinner an.
6. Das Gekaufte erscheint sofort in der Welt; passt die Bedingung, kommt ein neues Tier
   (Blüten → Schmetterlinge).

### Vorbereitung (vor dem Hackathon)
- [ ] Branch `welt-wald` zusammenführen (Weltdaten auf `welt.js` umstellen), Wiese ausbauen
- [ ] Mit echtem Mikrofon in einer Klasse testen, Standard-Schwellen anpassen
- [ ] Je Welt festlegen: **Starttier**, kaufbare Pflanzen/Items mit Preisen, freischaltbare Tiere
      mit Bedingung (`braucht`) – z. B. Dschungel: Start mit Schlange; Blüten → Schmetterlinge,
      Lianen → Orang-Utan, Äste/Nest → Tukan
- [ ] Preise so wählen, dass etwa **alle 1–2 Blöcke** etwas Neues kommt (sonst verpufft die Motivation)
- [ ] Bilder für kaufbare Items/Tiere erstellen (Prompts wie beim Affen)

### 1. Ruhe-Blöcke
- [ ] Lehrkraft startet einen Block: **10, 15 oder 30 Minuten** (einstellbar)
- [ ] Fortschrittsanzeige über der Welt (Restzeit, wie viel bisher ruhig war)
- [ ] Pausieren / abbrechen (z. B. für Durchsagen oder Fragen)
- [ ] Bewertung: Zeit, in der die Klasse unter der „Zu laut!“-Grenze der Phase blieb
- [ ] Abschluss mit kleiner Feier in der Welt und der Punktevergabe

### 2. Punkte
- [ ] Punkte = ruhige Minuten des Blocks, **+ Bonus bei 100 %** (z. B. +3) – kein Abzug
- [ ] Abgebrochene Blöcke: bisher ruhige Minuten zählen trotzdem
- [ ] Punktestand dauerhaft sichtbar, aber unaufdringlich
- [ ] Lehrkraft kann Punkte korrigieren (z. B. Block wegen Störung von außen werten)

### 3. Itemstore
- [ ] Store je Welt mit Kategorien **Pflanzen · Items · Tiere** – Daten kommen aus `welt.js`
      (`items`, `kreaturen` mit `preis` und `braucht`)
- [ ] **Abstimmungsmodus**: 2–3 bezahlbare Vorschläge groß anzeigen (fürs Smartboard),
      Lehrkraft tippt den Gewinner an
- [ ] Welten starten karg: `welt.js` bekommt `start` (was von Anfang an da ist)
- [ ] Gekaufte Pflanzen/Items erscheinen an festen Plätzen in der Szene
- [ ] Tiere werden freigeschaltet, wenn ihre Bedingung erfüllt ist
      (z. B. Schmetterlinge brauchen Blüten, Tukan braucht Lianen)
- [ ] Szenen-Schnittstelle erweitern: `env.besitz` sagt der `szene.js`, was gekauft wurde

### 4. Spielstand
- [ ] Klasse anlegen: **Name + gewählte Welt** (Grundlage fürs Klassentier in Milestone 3)
- [ ] Speichern im Browser (localStorage/IndexedDB): Punkte, Gekauftes, Verlauf der Blöcke
- [ ] Export/Import als JSON-Datei (Gerätewechsel, Sicherung)
- [ ] Zurücksetzen (nur Lehrkraft)

### 5. Lehrkraft-Bereich
- [ ] Einstellungen: Blocklängen, Phasen, Schwellen
- [ ] Geschützt, damit Kinder nicht versehentlich Punkte ausgeben oder löschen
      (z. B. lang drücken oder kleine Rechenaufgabe)

---

## Milestone 3 – Unser Klassentier (Ausblick)

- [ ] Klassentier wählen – passend zur Welt der Klasse (Affenklasse → Dschungel, Fischklasse → Wasser …)
- [ ] Das Klassentier ist in jeder Welt dabei und reagiert besonders deutlich auf Ruhe und Lärm
      (z. B. freut sich, hält sich die Ohren zu)
- [ ] Es wächst mit der Klasse: neue Fähigkeiten, Zubehör, ein Zuhause in der Welt
- [ ] Abzeichen/Meilensteine für lange Ruhe-Serien
- [ ] Weitere Welten als große Belohnung freischalten
- [ ] Mehrere Klassen auf einem Gerät

## Später / technisch
- [ ] Hosting mit HTTPS (z. B. GitLab Pages), PWA (offline nach erstem Besuch, installierbar)
- [ ] Leistung auf älteren Smartboards prüfen
- [ ] Herkunft und Lizenz aller Grafiken dokumentieren
- [ ] Automatische Tests für die Lautstärke- und Punkte-Logik
