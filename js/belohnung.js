/*
 * Mucksmäuschen – Belohnungen: die Sternenwiese.
 *
 * Ursprünglich von Vera (Branch „Belohnungssystem“) in TypeScript gebaut und beim
 * Zusammenführen in die Vanilla-JS-Struktur übertragen – Verhalten und Texte unverändert:
 *   - Jede Minute auf „Mucksmäuschenstill“ bringt einen Stern und lässt eine Blume wachsen.
 *   - Bei anderen Stufen pausiert der Fortschritt (es wird nichts abgezogen).
 *   - Mit Sternen schaltet die Klasse Tiere frei.
 * Der Stand wird im Browser gespeichert (localStorage, Schlüssel „mm.rewards“).
 */
'use strict';

window.MM = window.MM || {};

(function () {
  var QUIET_STAR_MS = 60000; // eine Minute Ruhe = ein Stern

  var ANIMALS = [
    { id: 'rabbit', name: 'Hoppel', kind: 'Hase', emoji: '🐰', cost: 3 },
    { id: 'fox', name: 'Fuchs', kind: 'Fuchs', emoji: '🦊', cost: 5 },
    { id: 'owl', name: 'Oskar', kind: 'Eule', emoji: '🦉', cost: 8 },
  ];

  function $(id) {
    return document.getElementById(id);
  }

  var rewardsOpen = $('rewards-open');
  var rewardsClose = $('rewards-close');
  var rewardScreen = $('reward-screen');
  var starBadge = $('star-badge');
  var starCount = $('star-count');
  var rewardMessage = $('reward-message');
  var flowerCount = $('flower-count');
  var quietTimer = $('quiet-timer');
  var meadow = $('meadow');
  var rewardProgress = $('reward-progress');
  var rewardProgressFill = $('reward-progress-fill');
  var animalGrid = $('animal-grid');

  // ---------- Zustand ----------
  function istGanzzahl(v) {
    return typeof v === 'number' && Number.isSafeInteger(v) && v >= 0;
  }

  function loadRewards() {
    try {
      var saved = JSON.parse(localStorage.getItem('mm.rewards') || 'null');
      if (saved && typeof saved === 'object') {
        return {
          stars: istGanzzahl(saved.stars) ? saved.stars : 0,
          flowers: istGanzzahl(saved.flowers) ? saved.flowers : 0,
          unlocked: Array.isArray(saved.unlocked)
            ? saved.unlocked.filter(function (id) {
                return ANIMALS.some(function (a) { return a.id === id; });
              })
            : [],
        };
      }
    } catch (e) {
      /* Speicher kann im privaten Modus oder bei defekten Daten fehlen. */
    }
    return { stars: 0, flowers: 0, unlocked: [] };
  }

  function saveRewards() {
    try {
      localStorage.setItem('mm.rewards', JSON.stringify(rewards));
    } catch (e) {
      /* Belohnungen funktionieren auch ohne dauerhaften Speicher. */
    }
  }

  var rewards = loadRewards();
  var quietMs = 0;
  var lastRewardRender = 0;

  // ---------- Aufbau ----------
  function buildRewardPanel() {
    for (var i = 0; i < 12; i++) {
      var flower = document.createElement('span');
      flower.className = 'flower';
      flower.textContent = '🌱';
      flower.setAttribute('aria-hidden', 'true');
      meadow.appendChild(flower);
    }

    ANIMALS.forEach(function (animal) {
      var card = document.createElement('article');
      card.className = 'animal-card';
      card.dataset.animal = animal.id;

      var icon = document.createElement('span');
      icon.className = 'animal-icon';
      icon.textContent = animal.emoji;
      icon.setAttribute('aria-hidden', 'true');

      var details = document.createElement('div');
      details.className = 'animal-details';
      var name = document.createElement('h4');
      name.textContent = animal.name;
      var kind = document.createElement('p');
      kind.textContent = animal.kind;
      details.append(name, kind);

      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'btn animal-unlock';
      button.addEventListener('click', function () {
        if (rewards.stars < animal.cost || rewards.unlocked.indexOf(animal.id) >= 0) return;
        rewards.stars -= animal.cost;
        rewards.unlocked.push(animal.id);
        saveRewards();
        renderRewards();
      });

      card.append(icon, details, button);
      animalGrid.appendChild(card);
    });
  }

  function renderRewards() {
    starBadge.textContent = rewards.stars + ' ⭐';
    starCount.textContent = String(rewards.stars);
    var grownFlowers = Math.min(rewards.flowers, meadow.children.length);
    var blumen = meadow.querySelectorAll('.flower');
    for (var i = 0; i < blumen.length; i++) {
      var grown = i < grownFlowers;
      blumen[i].classList.toggle('grown', grown);
      blumen[i].textContent = grown ? (i % 2 === 0 ? '🌼' : '🌷') : '🌱';
    }
    meadow.setAttribute(
      'aria-label',
      'Eine Wiese mit ' + rewards.flowers + ' gewachsenen Blumen' +
        (rewards.flowers > 12 ? ', mindestens zwölf sind zu sehen' : '')
    );
    flowerCount.textContent =
      rewards.flowers === 0
        ? 'Noch keine Blumen – die erste wächst bald!'
        : rewards.flowers + ' ' + (rewards.flowers === 1 ? 'Blume' : 'Blumen') + ' wachsen auf eurer Wiese.';

    ANIMALS.forEach(function (animal) {
      var card = animalGrid.querySelector('[data-animal="' + animal.id + '"]');
      var button = card && card.querySelector('.animal-unlock');
      var unlocked = rewards.unlocked.indexOf(animal.id) >= 0;
      if (card) card.classList.toggle('unlocked', unlocked);
      if (button) {
        button.disabled = unlocked || rewards.stars < animal.cost;
        button.textContent = unlocked ? 'Freigeschaltet ✓' : 'Freischalten · ' + animal.cost + ' ⭐';
      }
    });
  }

  /**
   * Wird von der Messschleife in js/app.js jedes Bild aufgerufen.
   * stufe: aktuelle Ampelstufe (0 = Mucksmäuschenstill), aktiv: Mikrofon- oder Handbetrieb läuft.
   */
  function tick(t, dt, stufe, aktiv) {
    if (stufe === 0 && aktiv) {
      quietMs += dt;
      while (quietMs >= QUIET_STAR_MS) {
        quietMs -= QUIET_STAR_MS;
        rewards.stars++;
        rewards.flowers++;
        saveRewards();
        renderRewards();
        rewardMessage.textContent = 'Eine neue Blume ist gewachsen – ihr habt einen Stern verdient!';
      }
    }

    if (t - lastRewardRender < 150) return;
    lastRewardRender = t;
    var seconds = Math.floor(quietMs / 1000);
    quietTimer.textContent = '🌱 ' + Math.floor(seconds / 60) + ':' + ('0' + (seconds % 60)).slice(-2) + ' / 1:00';
    rewardProgressFill.style.width = (quietMs / QUIET_STAR_MS) * 100 + '%';
    rewardProgress.setAttribute('aria-valuenow', String(seconds));
    rewardMessage.textContent =
      stufe === 0
        ? 'Toll, ihr seid mucksmäuschenstill – eure nächste Blume wächst!'
        : 'Werdet wieder mucksmäuschenstill, damit eure Blume weiterwächst.';
  }

  // ---------- Fenster öffnen/schließen ----------
  function schliessen() {
    rewardScreen.hidden = true;
    rewardsOpen.focus();
  }

  rewardsOpen.addEventListener('click', function () {
    rewardScreen.hidden = false;
    rewardsClose.focus();
  });
  rewardsClose.addEventListener('click', schliessen);
  rewardScreen.addEventListener('click', function (event) {
    if (event.target === rewardScreen) schliessen();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !rewardScreen.hidden) schliessen();
  });

  buildRewardPanel();
  renderRewards();

  MM.belohnung = {
    tick: tick,
    get offen() {
      return !rewardScreen.hidden;
    },
  };
})();
