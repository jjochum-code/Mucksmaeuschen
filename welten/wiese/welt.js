/*
 * Daten der Welt „Wiese“: Name, Beschreibung, Farben, Items und Kreaturen.
 * Als .js statt .json, damit die App auch ohne Webserver (Doppelklick auf index.html) läuft.
 */
'use strict';

MM.welten.daten('wiese', {
  "name": "Wiese",
  "beschreibung": "Blumen, Gras und summende Bienen",
  "status": "platzhalter",
  "vorschau": "vorschau.svg",
  "farben": {
    "himmel": "#9fd3ff",
    "horizont": "#f0f8ff",
    "boden": "#7cc456"
  },
  "items": [
    {
      "id": "blumenbeet",
      "name": "Blumenbeet",
      "preis": 8,
      "beschreibung": "Bunte Blumen"
    },
    {
      "id": "bienenstock",
      "name": "Bienenstock",
      "preis": 20,
      "beschreibung": "Ein Zuhause für Bienen"
    }
  ],
  "kreaturen": [
    {
      "id": "biene",
      "name": "Biene",
      "braucht": [
        "blumenbeet"
      ],
      "beschreibung": "Kommt, wenn Blumen blühen"
    }
  ]
});
