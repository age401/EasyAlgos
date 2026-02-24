(function () {
  'use strict';

  /* ═══════════════════════════════════════════════
     CONFIGURATION  — edit these to tweak behaviour
     ═══════════════════════════════════════════════ */

  const CFG = {
    // Viewport breakpoints (px)
    DESKTOP_WIDTH: 1920,
    MOBILE_BREAKPOINT: 800,

    // Card positions at the 1920 design width.
    //   deskCenterX : offset (px) from the horizontal center of the cards container
    //   top         : px from top of the cards area (same at all >800 breakpoints)
    //   medSide     : which edge the card snaps to at 800 px ('left' | 'right')
    CARDS: [
      { id: '01', top: 0,   deskCenterX: -331.5, medSide: 'left'  },
      { id: '02', top: 113, deskCenterX: -137,   medSide: 'left'  },
      { id: '03', top: 0,   deskCenterX:  325.5, medSide: 'right' },
      { id: '04', top: 153, deskCenterX:  288,   medSide: 'right' },
      { id: '05', top: 279, deskCenterX: -398.5, medSide: 'left'  },
      { id: '06', top: 439, deskCenterX: -234,   medSide: 'right' },
      { id: '07', top: 275, deskCenterX:  455,   medSide: 'right' },
      { id: '08', top: 439, deskCenterX:  267,   medSide: 'left'  },
    ],

    // Rock layer initial vertical positions (px from section top).
    // Lower value = higher on the page = appears in front sooner.
    ROCK_TOPS: {
      '01': 600,
      '02': 700,
      '03': 600,
    },

    // Parallax scroll-speed multipliers per rock layer.
    // Higher = moves faster on scroll (appears closer).
    PARALLAX: {
      '01': 0.20,
      '02': 0.50,
      '03': 1.20,
    },

    // Card reveal — scroll-driven triggering
    TRIGGER_VH_OFFSET: 0.80,   // fraction of viewport-height below which a card triggers
    STAGGER_DELAY_MS: 90,     // delay between cards that trigger on the same frame

    // Card animation timing
    FLICKER_COUNT: 3,          // on/off cycles before typing starts
    FLICKER_INTERVAL_MS: 70,   // ms per half-cycle
    TYPE_SPEED_MS: 15,         // ms per character
    CURSOR_FADE_MS: 300,       // ms to fade cursor after typing completes
  };

  /* ═══════════════════════════════════════════════
     DOM REFERENCES
     ═══════════════════════════════════════════════ */

  let section, cardsContainer, rockLayers, cardEls;
  let cardWidths = {};         // measured final widths (keyed by card id)
  let untriggered = new Set(); // card elements not yet animated
  let animQueue = [];
  let animRunning = false;

  /* ═══════════════════════════════════════════════
     CARD MEASUREMENT
     Temporarily render full text + padding so we
     can read offsetWidth for positioning maths.
     ═══════════════════════════════════════════════ */

  function measureCardWidths() {
    cardEls.forEach(function (el) {
      // Already finished animating — text is live in the DOM, just read width
      if (el.classList.contains('problem-card--complete')) {
        cardWidths[el.dataset.card] = el.offsetWidth;
        return;
      }

      // Currently mid-animation — don't touch, keep previous measurement
      if (el.classList.contains('problem-card--visible')) {
        return;
      }

      // Not yet triggered — temporarily render full text for measurement
      var text = el.dataset.text;
      var textSpan = el.querySelector('.problem-card__text');

      el.style.visibility = 'hidden';
      el.style.opacity = '0';
      el.classList.add('problem-card--visible');
      textSpan.textContent = text;

      cardWidths[el.dataset.card] = el.offsetWidth;

      textSpan.textContent = '';
      el.classList.remove('problem-card--visible');
      el.style.removeProperty('visibility');
      el.style.removeProperty('opacity');
    });
  }

  /* ═══════════════════════════════════════════════
     CARD POSITIONING  (desktop / tablet)
     Interpolates between the 1920 design offsets
     and the 800 edge-aligned positions.
     ═══════════════════════════════════════════════ */

  function positionCards() {
    var vw = window.innerWidth;

    if (vw < CFG.MOBILE_BREAKPOINT) {
      cardEls.forEach(function (el) {
        el.style.removeProperty('left');
        el.style.removeProperty('top');
      });
      return;
    }

    var cw = cardsContainer.clientWidth;
    var t = Math.min(1, Math.max(0,
      (vw - CFG.MOBILE_BREAKPOINT) / (CFG.DESKTOP_WIDTH - CFG.MOBILE_BREAKPOINT)
    ));

    CFG.CARDS.forEach(function (c) {
      var el = document.querySelector('[data-card="' + c.id + '"]');
      if (!el) return;

      var w = cardWidths[c.id] || 200;
      var desktopLeft = cw / 2 + c.deskCenterX - w / 2;
      var edgeLeft = (c.medSide === 'left') ? 0 : cw - w;
      var finalLeft = edgeLeft + (desktopLeft - edgeLeft) * t;

      el.style.left = finalLeft + 'px';
      el.style.top = c.top + 'px';
    });
  }

  /* ═══════════════════════════════════════════════
     CARD ANIMATION
     Phase 1 – cursor flicker
     Phase 2 – card unfold + typewriter
     Phase 3 – cursor fade
     ═══════════════════════════════════════════════ */

  function animateCard(el, done) {
    var fullText = el.dataset.text;
    var textSpan = el.querySelector('.problem-card__text');
    var cursor   = el.querySelector('.problem-card__cursor');

    textSpan.textContent = '';
    el.classList.add('problem-card--visible');

    // Phase 1: flicker cursor
    var flickCount = 0;
    var flickTotal = CFG.FLICKER_COUNT * 2;
    el.classList.add('problem-card--cursor-on');

    var flickTimer = setInterval(function () {
      flickCount++;
      if (flickCount % 2 === 0) {
        el.classList.add('problem-card--cursor-on');
      } else {
        el.classList.remove('problem-card--cursor-on');
      }
      if (flickCount >= flickTotal) {
        clearInterval(flickTimer);
        el.classList.add('problem-card--cursor-on');
        startTyping();
      }
    }, CFG.FLICKER_INTERVAL_MS);

    function startTyping() {
      el.classList.add('problem-card--unfolding');

      var idx = 0;
      var typeTimer = setInterval(function () {
        idx++;
        textSpan.textContent = fullText.substring(0, idx);

        if (idx >= fullText.length) {
          clearInterval(typeTimer);
          finishCard();
        }
      }, CFG.TYPE_SPEED_MS);
    }

    function finishCard() {
      cursor.style.transition = 'opacity ' + CFG.CURSOR_FADE_MS + 'ms ease-out';
      cursor.style.opacity = '0';
      el.classList.add('problem-card--complete');
      setTimeout(done, 80);
    }
  }

  /* ═══════════════════════════════════════════════
     CARD TRIGGER QUEUE
     Cards enter a queue when their scroll-trigger
     fires; animations play sequentially.
     ═══════════════════════════════════════════════ */

  function enqueueCard(el) {
    animQueue.push(el);
    processQueue();
  }

  function processQueue() {
    if (animRunning || animQueue.length === 0) return;
    animRunning = true;
    var el = animQueue.shift();
    animateCard(el, function () {
      animRunning = false;
      processQueue();
    });
  }

  /* ═══════════════════════════════════════════════
     SCROLL HANDLER
     — triggers cards based on viewport position
     — applies rock parallax
     ═══════════════════════════════════════════════ */

  var ticking = false;

  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(tick);
    }
  }

  function tick() {
    ticking = false;
    checkCardTriggers();
    applyParallax();
  }

  function checkCardTriggers() {
    var vh = window.innerHeight;
    var threshold = vh * CFG.TRIGGER_VH_OFFSET;
    var batch = [];

    untriggered.forEach(function (el) {
      var rect = el.getBoundingClientRect();
      if (rect.top < threshold) {
        batch.push(el);
      }
    });

    batch.sort(function (a, b) {
      return a.getBoundingClientRect().top - b.getBoundingClientRect().top;
    });

    batch.forEach(function (el, i) {
      untriggered.delete(el);
      setTimeout(function () { enqueueCard(el); }, i * CFG.STAGGER_DELAY_MS);
    });
  }

  /* ═══════════════════════════════════════════════
     ROCK POSITIONS
     Applies the CFG.ROCK_TOPS values so they can
     be tweaked from a single place in the config.
     ═══════════════════════════════════════════════ */

  function applyRockPositions() {
    rockLayers.forEach(function (layer) {
      var id = layer.dataset.rock;
      var top = CFG.ROCK_TOPS[id];
      if (top !== undefined) {
        layer.style.top = top + 'px';
      }
    });
  }

  /* ═══════════════════════════════════════════════
     ROCK PARALLAX
     Each layer translates vertically based on
     how far the section has scrolled past.
     ═══════════════════════════════════════════════ */

  function applyParallax() {
    var sectionRect = section.getBoundingClientRect();
    var vh = window.innerHeight;
    var offset = vh - sectionRect.top;
    if (offset < 0) return;

    rockLayers.forEach(function (layer) {
      var id = layer.dataset.rock;
      var speed = CFG.PARALLAX[id] || 0;
      var ty = -(offset * speed);
      layer.style.transform = 'translateX(-50%) translateY(' + ty + 'px)';
    });
  }

  /* ═══════════════════════════════════════════════
     RESIZE
     ═══════════════════════════════════════════════ */

  function onResize() {
    applyRockPositions();
    measureCardWidths();
    positionCards();
    checkCardTriggers();
    applyParallax();
  }

  /* ═══════════════════════════════════════════════
     INIT
     ═══════════════════════════════════════════════ */

  function init() {
    section        = document.getElementById('the-problem');
    cardsContainer = document.getElementById('problem-cards');
    rockLayers     = Array.from(document.querySelectorAll('.problem__rock-layer'));
    cardEls        = Array.from(document.querySelectorAll('.problem-card'));

    cardEls.forEach(function (el) { untriggered.add(el); });

    applyRockPositions();
    measureCardWidths();
    positionCards();

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);

    // Re-measure once web fonts finish loading (widths depend on Poppins metrics)
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () {
        measureCardWidths();
        positionCards();
      });
    }

    checkCardTriggers();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
