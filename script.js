/* ═══════════════════════════════════════════════════
   HERO — Rock entrance animation & parallax
   ═══════════════════════════════════════════════════ */

(function () {
  'use strict';

  var STAGGER_MS = 60;
  var ANIM_DURATION_MS = 1200;
  var EASING = 'cubic-bezier(0.16, 1.11, 0.36, 1)';

  var CRATER_CENTER = {
    '2560': { x: 1660, y: 755 },
    '1440': { x: 920,  y: 760 },
    '768':  { x: 570,  y: 570 },
  };

  var PARALLAX_RATIOS = {
    1: 2.00,
    2: 1.60,
    3: 1.00,
    4: 0.70,
    5: 0.40,
    6: 0.20,
  };

  var entranceComplete = false;
  var parallaxEnabled = false;
  var heroTop = 0;
  var heroHeight = 0;

  function getActiveBreakpoint() {
    var w = window.innerWidth;
    if (w >= 1440) return '2560';
    if (w >= 768) return '1440';
    return '768';
  }

  function getRockGroups() {
    var visibleSvg = document.querySelector('.hero__rocks-svg:not([style*="display: none"])');
    if (!visibleSvg) return [];
    return Array.from(visibleSvg.querySelectorAll('.rock-group'));
  }

  function applyCraterOrigin(groups) {
    var bp = getActiveBreakpoint();
    var center = CRATER_CENTER[bp];
    groups.forEach(function (g) {
      g.style.transformOrigin = center.x + 'px ' + center.y + 'px';
    });
  }

  function getGroupNumber(el) {
    var match = el.id.match(/(\d+)$/);
    return match ? parseInt(match[1], 10) : 0;
  }

  function initEntrance() {
    var groups = getRockGroups();
    applyCraterOrigin(groups);
    groups.forEach(function (g) {
      g.classList.add('rock-group--hidden');
      g.style.transition = 'none';
    });
  }

  function runEntrance() {
    var groups = getRockGroups();
    var sorted = groups.slice().sort(function (a, b) {
      return getGroupNumber(b) - getGroupNumber(a);
    });

    sorted.forEach(function (g, i) {
      var delay = i * STAGGER_MS;
      setTimeout(function () {
        g.style.transition = 'transform ' + ANIM_DURATION_MS + 'ms ' + EASING + ', opacity ' + (ANIM_DURATION_MS * 0.6) + 'ms ease-out';
        g.classList.remove('rock-group--hidden');
        g.style.opacity = '1';
        g.style.transform = 'scale(1)';
      }, delay);
    });

    var totalTime = (sorted.length - 1) * STAGGER_MS + ANIM_DURATION_MS;
    setTimeout(function () {
      entranceComplete = true;
      parallaxEnabled = true;
      sorted.forEach(function (g) {
        g.style.transition = 'none';
      });
      recalcLayout();
    }, totalTime + 50);
  }

  function recalcLayout() {
    var hero = document.querySelector('.hero');
    if (!hero) return;
    var rect = hero.getBoundingClientRect();
    heroTop = rect.top + window.scrollY;
    heroHeight = rect.height;
  }

  var entranceTriggered = false;

  function checkEntrance() {
    if (entranceTriggered) return;
    var hero = document.querySelector('.hero');
    if (!hero) return;
    var rect = hero.getBoundingClientRect();
    var visible = rect.top < window.innerHeight && rect.bottom > 0;
    if (visible) {
      entranceTriggered = true;
      runEntrance();
    }
  }

  var heroTicking = false;

  function onHeroScroll() {
    checkEntrance();
    if (!parallaxEnabled) return;
    if (!heroTicking) {
      heroTicking = true;
      requestAnimationFrame(applyHeroParallax);
    }
  }

  function applyHeroParallax() {
    heroTicking = false;
    if (!parallaxEnabled) return;
    var scrollY = window.scrollY;
    var offsetFromHeroTop = scrollY - heroTop;
    if (offsetFromHeroTop < 0) return;

    var groups = getRockGroups();
    groups.forEach(function (g) {
      var num = getGroupNumber(g);
      var ratio = PARALLAX_RATIOS[num] || 0;
      var ty = -(offsetFromHeroTop * ratio);
      g.style.transform = 'translateY(' + ty + 'px)';
    });
  }

  function updateRocksSvgVisibility() {
    var wrappers = document.querySelectorAll('.hero__rocks-svg');
    var width = window.innerWidth;

    wrappers.forEach(function (svg) {
      var bp = svg.dataset.breakpoint;
      var show = false;
      if (bp === '2560' && width >= 1440) show = true;
      if (bp === '1440' && width >= 768 && width < 1440) show = true;
      if (bp === '768' && width < 768) show = true;
      svg.style.display = show ? '' : 'none';
    });
  }

  function updateBgVisibility() {
    var imgs = document.querySelectorAll('.hero__bg-img');
    var width = window.innerWidth;

    imgs.forEach(function (img) {
      var bp = img.dataset.breakpoint;
      var show = false;
      if (bp === '2560' && width >= 1440) show = true;
      if (bp === '1440' && width >= 768 && width < 1440) show = true;
      if (bp === '768' && width < 768) show = true;
      img.style.display = show ? 'block' : 'none';
    });
  }

  function onHeroResize() {
    recalcLayout();
    updateRocksSvgVisibility();
    updateBgVisibility();

    var groups = getRockGroups();
    applyCraterOrigin(groups);
    if (entranceComplete) {
      groups.forEach(function (g) {
        g.classList.remove('rock-group--hidden');
        g.style.opacity = '1';
        g.style.transition = 'none';
        if (!parallaxEnabled) g.style.transform = 'scale(1)';
      });
    } else if (!entranceTriggered) {
      initEntrance();
    }
  }

  function initHero() {
    updateRocksSvgVisibility();
    updateBgVisibility();
    initEntrance();
    recalcLayout();
    checkEntrance();

    window.addEventListener('scroll', onHeroScroll, { passive: true });
    window.addEventListener('resize', onHeroResize);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHero);
  } else {
    initHero();
  }
})();


/* ═══════════════════════════════════════════════════
   THE PROBLEM — Card animations & rock parallax
   ═══════════════════════════════════════════════════ */

(function () {
  'use strict';

  var CFG = {
    DESKTOP_WIDTH: 1920,
    MOBILE_BREAKPOINT: 800,

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

    ROCK_TOPS: {
      '01': 600,
      '02': 700,
      '03': 600,
    },

    PARALLAX: {
      '01': 0.20,
      '02': 0.50,
      '03': 1.20,
    },

    TRIGGER_VH_OFFSET: 0.80,
    STAGGER_DELAY_MS: 90,

    FLICKER_COUNT: 3,
    FLICKER_INTERVAL_MS: 70,
    TYPE_SPEED_MS: 15,
    CURSOR_FADE_MS: 300,
  };

  var section, cardsContainer, rockLayers, cardEls;
  var cardWidths = {};
  var untriggered = new Set();
  var animQueue = [];
  var animRunning = false;

  function measureCardWidths() {
    cardEls.forEach(function (el) {
      if (el.classList.contains('problem-card--complete')) {
        cardWidths[el.dataset.card] = el.offsetWidth;
        return;
      }
      if (el.classList.contains('problem-card--visible')) {
        return;
      }
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

  function animateCard(el, done) {
    var fullText = el.dataset.text;
    var textSpan = el.querySelector('.problem-card__text');
    var cursor   = el.querySelector('.problem-card__cursor');

    textSpan.textContent = '';
    el.classList.add('problem-card--visible');

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

  var problemTicking = false;

  function onProblemScroll() {
    if (!problemTicking) {
      problemTicking = true;
      requestAnimationFrame(problemTick);
    }
  }

  function problemTick() {
    problemTicking = false;
    checkCardTriggers();
    applyProblemParallax();
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

  function applyRockPositions() {
    rockLayers.forEach(function (layer) {
      var id = layer.dataset.rock;
      var top = CFG.ROCK_TOPS[id];
      if (top !== undefined) {
        layer.style.top = top + 'px';
      }
    });
  }

  function applyProblemParallax() {
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

  function onProblemResize() {
    applyRockPositions();
    measureCardWidths();
    positionCards();
    checkCardTriggers();
    applyProblemParallax();
  }

  function initProblem() {
    section        = document.getElementById('the-problem');
    cardsContainer = document.getElementById('problem-cards');
    rockLayers     = Array.from(document.querySelectorAll('.problem__rock-layer'));
    cardEls        = Array.from(document.querySelectorAll('.problem-card'));

    cardEls.forEach(function (el) { untriggered.add(el); });

    applyRockPositions();
    measureCardWidths();
    positionCards();

    window.addEventListener('scroll', onProblemScroll, { passive: true });
    window.addEventListener('resize', onProblemResize);

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () {
        measureCardWidths();
        positionCards();
      });
    }

    checkCardTriggers();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProblem);
  } else {
    initProblem();
  }
})();


/* ═══════════════════════════════════════════════════
   SECTION HEADER — Entrance animation
   ═══════════════════════════════════════════════════ */

(function () {
  'use strict';

  var TRIGGER_OFFSET    = '-180px';
  var TRIGGER_THRESHOLD = 0;
  var ENTER_CLASS       = 'sh-entered';

  function initSectionHeaderEntrance() {
    var headers = document.querySelectorAll('[data-section-header]');
    if (!headers.length) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var el = entry.target;

        if (entry.isIntersecting) {
          if (!el.classList.contains(ENTER_CLASS)) {
            el.classList.add(ENTER_CLASS);
          }
          return;
        }

        if (!el.classList.contains(ENTER_CLASS)) return;

        var rect = el.getBoundingClientRect();
        var exitedBelow = rect.top >= window.innerHeight;

        if (exitedBelow) {
          resetHeader(el);
        }
      });
    }, {
      threshold: [0, TRIGGER_THRESHOLD],
      rootMargin: '0px 0px ' + TRIGGER_OFFSET + ' 0px'
    });

    headers.forEach(function (header) {
      observer.observe(header);
    });
  }

  function resetHeader(el) {
    var children = el.querySelectorAll('[data-sh-badge],[data-sh-title],[data-sh-subtitle]');
    children.forEach(function (child) {
      child.style.transition = 'none';
    });

    el.classList.remove(ENTER_CLASS);

    void el.offsetHeight;

    children.forEach(function (child) {
      child.style.removeProperty('transition');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSectionHeaderEntrance);
  } else {
    initSectionHeaderEntrance();
  }
})();
