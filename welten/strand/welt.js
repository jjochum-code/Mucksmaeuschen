/*
 * Daten der Welt „Strand“: Name, Beschreibung, Farben, Items und Kreaturen.
 * Als .js statt .json, damit die App auch ohne Webserver (Doppelklick auf index.html) läuft.
 */
'use strict';

MM.welten.daten('strand', {
  "name": "Strand",
  "beschreibung": "Krabben, Seesterne, Delfine und Möwen am Meer",
  "status": "spielbar",
  "vorschau": "vorschau.svg",
  "farben": {
    "himmel": "#8dd0fb",
    "horizont": "#b9e3fc",
    "meer": "#2c9ae6",
    "wellen": "#7cc6f3",
    "schaum": "#e8f6ff",
    "sand": "#fad991",
    "sandPunkte": "#eab36b",
    "sandSchatten": "#e6bf78",
    "nasserSand": "#eac47f"
  },
  "items": [
    {
      "id": "liege",
      "name": "Liege",
      "preis": 10,
      "beschreibung": "Mit rot-weißem Handtuch"
    },
    {
      "id": "sonnenschirm",
      "name": "Sonnenschirm",
      "preis": 12,
      "beschreibung": "Rot-weiß gestreift"
    },
    {
      "id": "muschel",
      "name": "Muschel",
      "preis": 6,
      "beschreibung": "Öffnet sich, wenn es still ist"
    }
  ],
  "kreaturen": [
    {
      "id": "krabbe",
      "name": "Krabbe",
      "braucht": [],
      "beschreibung": "Gräbt sich ein, wenn es laut wird"
    },
    {
      "id": "seestern",
      "name": "Seestern",
      "braucht": [],
      "beschreibung": "Tanzt bei Stille, rollt bei Lärm ins Meer"
    },
    {
      "id": "delfin",
      "name": "Delfin",
      "braucht": [],
      "beschreibung": "Springt, wenn es ganz ruhig ist"
    },
    {
      "id": "moewe",
      "name": "Möwe",
      "braucht": [],
      "beschreibung": "Fliegt weg, wenn es laut wird"
    }
  ]
});
