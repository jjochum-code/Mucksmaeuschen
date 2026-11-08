/*
 * Szene „Dschungel“ – noch ein Platzhalter.
 *
 * Ersetzt draw() durch eure eigene Zeichnung. Wie das geht und was in env steht,
 * steht in welten/README.md. Als ausgebautes Beispiel siehe welten/wasser/szene.js.
 */
'use strict';

MM.welten.register('dschungel', {
  // Einmal beim Anzeigen der Welt: z. B. Bäume oder Tiere zufällig verteilen.
  init: function (env) {},

  // Jedes Bild (~60× pro Sekunde). env.ruhe: 0 = laut … 1 = ganz ruhig.
  draw: function (ctx, env) {
    MM.welten.platzhalter(ctx, env); // ← durch eigene Zeichnung ersetzen
  },
});
