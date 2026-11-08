/*
 * Daten der Welt „Dschungel“: Name, Beschreibung, Farben, Items und Kreaturen.
 * Als .js statt .json, damit die App auch ohne Webserver (Doppelklick auf index.html) läuft.
 */
'use strict';

MM.welten.daten('dschungel', {
  "name": "Dschungel",
  "beschreibung": "Riesige Bäume, Lianen, ein Orang-Utan, ein Tukan, eine Schlange und Schmetterlinge",
  "status": "spielbar",
  "vorschau": "vorschau.webp",
  "pixel": 2,
  "farben": {
    "himmel": "#8fd6b0",
    "horizont": "#d9f5c8",
    "boden": "#2f6b2a"
  },
  "items": [
    {
      "id": "liane",
      "name": "Liane",
      "preis": 9,
      "beschreibung": "Zum Schwingen"
    },
    {
      "id": "riesenblatt",
      "name": "Riesenblatt",
      "preis": 14,
      "beschreibung": "Ein Blatt so groß wie ein Schirm"
    }
  ],
  "kreaturen": [
    {
      "id": "tukan",
      "name": "Tukan",
      "braucht": [
        "liane"
      ],
      "beschreibung": "Landet auf den Ästen, wenn es ruhig ist"
    },
    {
      "id": "schlange",
      "name": "Schlange",
      "braucht": [
        "riesenblatt"
      ],
      "beschreibung": "Schlängelt über den Waldboden und versteckt sich bei Lärm"
    },
    {
      "id": "affe",
      "name": "Orang-Utan",
      "braucht": [
        "liane"
      ],
      "beschreibung": "Hangelt sich an den Lianen entlang, wenn es ganz ruhig ist"
    },
    {
      "id": "schmetterling",
      "name": "Schmetterling",
      "braucht": [
        "riesenblatt"
      ],
      "beschreibung": "Flattert umher und landet auf den Blüten"
    }
  ]
});
