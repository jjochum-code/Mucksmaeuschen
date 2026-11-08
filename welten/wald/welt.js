/*
 * Daten der Welt „Wald“: Name, Beschreibung, Farben, Items und Kreaturen.
 * Als .js statt .json, damit die App auch ohne Webserver (Doppelklick auf index.html) läuft.
 */
'use strict';

MM.welten.daten('wald', {
  "name": "Wald",
  "beschreibung": "Bäume, Pilze und scheue Waldtiere",
  "status": "platzhalter",
  "vorschau": "vorschau.svg",
  "farben": {
    "himmel": "#a8d8ff",
    "horizont": "#e3f3ff",
    "boden": "#3f7d3a"
  },
  "items": [
    {
      "id": "tanne",
      "name": "Tanne",
      "preis": 10,
      "beschreibung": "Ein Nadelbaum"
    },
    {
      "id": "pilzkreis",
      "name": "Pilzkreis",
      "preis": 15,
      "beschreibung": "Ein Ring aus Pilzen"
    }
  ],
  "kreaturen": [
    {
      "id": "eichhoernchen",
      "name": "Eichhörnchen",
      "braucht": [
        "tanne"
      ],
      "beschreibung": "Kommt, wenn es Bäume gibt"
    }
  ]
});
