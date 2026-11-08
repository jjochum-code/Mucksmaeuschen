/*
 * Daten der Welt „Wasser“: Name, Beschreibung, Farben, Items und Kreaturen.
 * Als .js statt .json, damit die App auch ohne Webserver (Doppelklick auf index.html) läuft.
 */
'use strict';

MM.welten.daten('wasser', {
  "name": "Wasser",
  "beschreibung": "Ein Unterwasser-Riff mit bunten Fischen",
  "status": "spielbar",
  "vorschau": "vorschau.svg",
  "farben": {
    "oben": "#4fb3e8",
    "unten": "#0b3a6e",
    "sand": "#e8cf8f"
  },
  "items": [
    {
      "id": "seegras",
      "name": "Seegras",
      "preis": 6,
      "beschreibung": "Wiegt sich in der Strömung"
    },
    {
      "id": "koralle",
      "name": "Koralle",
      "preis": 18,
      "beschreibung": "Bunte Riff-Koralle"
    }
  ],
  "kreaturen": [
    {
      "id": "fische",
      "name": "Fischschwarm",
      "braucht": [
        "seegras"
      ],
      "beschreibung": "Schwimmt herbei, wenn es ruhig ist"
    },
    {
      "id": "krebs",
      "name": "Krebs",
      "braucht": [
        "koralle"
      ],
      "beschreibung": "Läuft seitwärts über den Sand und gräbt sich bei Lärm ein"
    },
    {
      "id": "schnecke",
      "name": "Schnecke",
      "braucht": [
        "seegras"
      ],
      "beschreibung": "Kriecht langsam über den Boden und zieht sich bei Lärm ins Haus zurück"
    }
  ]
});
