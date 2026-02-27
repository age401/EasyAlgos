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
      svg.style.display = show ? 'block' : 'none';
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
      '03': 0.80,
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


/* ═══════════════════════════════════════════════════
   HOW IT WORKS — Scroll-lock card stacking
   (Lazy-initialised via IntersectionObserver,
    per-card Lottie loading, scroll-container aware)
   ═══════════════════════════════════════════════════ */

(function () {
  'use strict';

  var SETTLE_PAUSE      = 20;
  var HOLD_PX           = 200;
  var TRANSITION_PX     = 600;
  var ROCK_ANIM_DURATION = 1520;

  var LOTTIE_PATHS = [
    'animations/hiw-01.json',
    'animations/hiw-02.json',
    'animations/hiw-03.json',
    'animations/hiw-04.json'
  ];

  var ROCK_DATA = {
    0: {
      25: [-324, 106, -16.8, 673, 798, 0],
      24: [-230, 107, 13.55, 319, 910, 30],
      23: [-254, 366, 15.88, 617, 641, 60],
      22: [-273, 175, -55.33, 1393, 865, 90],
      20: [-170, 291, -32.37, 817, 584, 20],
      19: [-271, 261, -14.14, 836, 820, 40],
      18: [-342, 258, 0, 823, 467, 70],
      17: [-296, 61, 0, 841, 772, 100],
      16: [-150, 85, 0, 912, 911, 80],
      15: [-262, -76, -13.4, 312, 612, 50],
      14: [-121, -101, 40.54, 713, 1005, 110],
      13: [-3, 194, 16.81, 697, 778, 120],
      12: [-293, 352, -26.7, 654, 479, 10],
      11: [-366, 376, 0, 883, 242, 55],
      10: [-94, 130, 0, 478, 561, 85],
      9:  [-285, 316, 0, 497, 443, 45],
      8:  [38, 79, -6.69, 331, 895, 95],
      7:  [6, 166, 29.73, 1236, 869, 35],
      5:  [-704, 374, 0, 776, 335, 65],
      4:  [-304, 227, -22.24, 466, 707, 25],
      3:  [-49, 131, 52.12, 340, 504, 75],
      2:  [-402, 396, 0, 650, 394, 105],
      1:  [36, 98, 55.11, 583, 912, 15]
    },
    1: {
      16: [106, 295, 32.99, 503, 723, 0],
      15: [-18, 276, 0, 811, 624, 30],
      14: [-144, 4, 16.3, 237, 443, 60],
      13: [-134, 364, -50.38, 1168, 799, 90],
      12: [-134, 143, -10.6, 722, 817, 20],
      11: [-147, 264, 0, 423, 224, 40],
      10: [-599, 397, 0, 1053, 351, 70],
      9:  [-364, 428, -18.07, 491, 347, 100],
      8:  [-238, 289, -32.1, 415, 503, 80],
      7:  [-245, 193, 20.63, 629, 388, 50],
      6:  [-308, 213, 33.78, 714, 526, 110],
      5:  [-138, 315, 0, 288, 197, 120],
      4:  [-646, 396, -18.52, 771, 290, 10],
      3:  [-212, 237, 41.9, 520, 444, 55],
      2:  [-151, 330, -33.15, 271, 733, 85],
      1:  [-117, 57, -44.69, 302, 427, 45]
    },
    2: {
      14: [-133, 228, 19.32, 475, 770, 0],
      13: [-244, 280, -33.62, 279, 722, 30],
      12: [-209, 307, 11.45, 748, 537, 60],
      11: [-196, 188, 11.25, 269, 417, 90],
      10: [-215, 292, 0, 828, 349, 20],
      9:  [-102, 199, -12.92, 1130, 872, 40],
      8:  [-52, 347, -24.36, 570, 866, 70],
      7:  [-155, 190, 0, 408, 402, 100],
      6:  [-83, 268, -36.05, 798, 796, 80],
      5:  [-134, 231, 0, 389, 561, 50],
      4:  [-50, 96, 0, 572, 430, 110],
      3:  [-245, 236, 0, 612, 207, 120],
      2:  [-167, 355, 0, 943, 649, 10],
      1:  [-91, 90, 0, 889, 768, 55]
    },
    3: {
      18: [-181, 198, 0, 431, 842, 0],
      17: [-378, 162, -9.56, 338, 556, 30],
      16: [6, 237, -29.3, 549, 913, 60],
      15: [-366, 244, 0, 284, 812, 90],
      14: [-265, 286, 29.14, 445, 423, 20],
      13: [-252, 181, -25.26, 593, 679, 40],
      12: [-75, 346, 17.16, 265, 488, 70],
      11: [51, 132, 20, 838, 885, 100],
      10: [-78, 116, 0, 518, 564, 80],
      9:  [-418, 441, -17.32, 728, 239, 50],
      8:  [-361, 327, 7.11, 796, 647, 110],
      7:  [-215, 38, 0, 720, 447, 120],
      6:  [-70, 131, 0, 998, 845, 10],
      5:  [-176, 183, 0, 408, 245, 55],
      4:  [-180, 252, -15.35, 556, 339, 85],
      3:  [-841, 523, 13.83, 1356, 247, 45],
      2:  [-144, 105, 0, 747, 567, 75],
      1:  [-72, 122, -32.01, 674, 770, 15]
    }
  };

  var io = null;
  var hiwInitialized = false;
  var teardown = null;

  function findScrollContainer(el) {
    var current = el.parentElement;
    while (current) {
      var style = window.getComputedStyle(current);
      var overflowY = style.overflowY;
      if ((overflowY === 'auto' || overflowY === 'scroll') && current.scrollHeight > current.clientHeight) {
        return current;
      }
      current = current.parentElement;
    }
    return window;
  }

  function mountHowItWorks(section) {
    var cards = Array.from(section.querySelectorAll('[data-hiw-card]'));
    var stickyEl = section.querySelector('.hiw__sticky');
    var headerEl = section.querySelector('[data-hiw-header]');
    if (cards.length < 2) return null;

    var activatedCards = {};
    var cardFadeActive = [];
    var lottieAnims = [];
    var lottiePlayingState = [];
    var lottieLoadingSet = {};
    var scrollContainer = window;
    var animateRocks = window.innerWidth > 1024;
    var raf1 = 0;
    var raf2 = 0;
    var scrollTicking = false;
    var isSnapping = false;
    var lastScrolledForSnap = -Infinity;
    var snapReady = false;
    var SNAP_DURATION = 700;

    function isWindowContainer() {
      return scrollContainer === window;
    }

    function getScrollTop() {
      if (isWindowContainer()) {
        return window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
      }
      return scrollContainer.scrollTop || 0;
    }

    function getViewportHeight() {
      if (isWindowContainer()) return window.innerHeight;
      return scrollContainer.clientHeight;
    }

    function getSectionTop() {
      var rect = section.getBoundingClientRect();
      if (isWindowContainer()) return rect.top;
      return rect.top - scrollContainer.getBoundingClientRect().top;
    }

    function computeScrolled() {
      var hh = headerEl ? headerEl.offsetHeight : 0;
      var s = -(getSectionTop() + hh);
      return s < 0 ? 0 : s;
    }

    function preventScrollDefault(e) { e.preventDefault(); }

    function lockUserScroll() {
      document.documentElement.style.overscrollBehavior = 'none';
      window.addEventListener('wheel', preventScrollDefault, { passive: false });
      window.addEventListener('touchmove', preventScrollDefault, { passive: false });
    }

    function unlockUserScroll() {
      document.documentElement.style.overscrollBehavior = '';
      window.removeEventListener('wheel', preventScrollDefault);
      window.removeEventListener('touchmove', preventScrollDefault);
    }

    function snapScroll(fromAbs, toAbs) {
      isSnapping = true;
      lockUserScroll();
      var distance = toAbs - fromAbs;
      var startTime = performance.now();

      function tick(now) {
        var elapsed = now - startTime;
        var p = Math.min(elapsed / SNAP_DURATION, 1);
        var eased = 1 - Math.pow(1 - p, 4);
        var pos = fromAbs + distance * eased;

        if (isWindowContainer()) {
          window.scrollTo(0, pos);
        } else {
          scrollContainer.scrollTop = pos;
        }

        if (p < 1) {
          requestAnimationFrame(tick);
        } else {
          isSnapping = false;
          unlockUserScroll();
        }
      }
      requestAnimationFrame(tick);
    }

    function initRocks(cardIndex, rocksContainer) {
      var data = ROCK_DATA[cardIndex];
      if (!data) return;
      var groups = rocksContainer.querySelectorAll('[data-rock]');
      for (var g = 0; g < groups.length; g++) {
        var el = groups[g];
        var num = parseInt(el.getAttribute('data-rock'), 10);
        var anim = data[num];
        if (!anim) continue;
        el.style.transformOrigin = anim[3] + 'px ' + anim[4] + 'px';
        el.style.transform = 'translate(' + anim[0] + 'px,' + anim[1] + 'px) rotate(' + anim[2] + 'deg)';
        el.style.transitionDelay = anim[5] + 'ms';
      }
    }

    function loadLottieForCard(cardIndex) {
      if (typeof lottie === 'undefined') return;
      if (lottieAnims[cardIndex] || lottieLoadingSet[cardIndex]) return;
      var graphic = cards[cardIndex] ? cards[cardIndex].querySelector('.hiw__graphic') : null;
      var path = LOTTIE_PATHS[cardIndex];
      if (!graphic || !path) return;
      lottieLoadingSet[cardIndex] = true;
      lottieAnims[cardIndex] = lottie.loadAnimation({
        container: graphic,
        renderer: 'canvas',
        loop: true,
        autoplay: false,
        path: path
      });
      lottiePlayingState[cardIndex] = false;
    }

    function activateCard(cardIndex) {
      if (activatedCards[cardIndex]) return;
      activatedCards[cardIndex] = true;

      var card = cards[cardIndex];
      if (animateRocks) {
        var rocksContainer = card.querySelector('.hiw__rocks');
        if (rocksContainer) {
          var groups = rocksContainer.querySelectorAll('[data-rock]');
          for (var g = 0; g < groups.length; g++) {
            groups[g].style.transform = 'none';
          }
        }
      }

      var graphic = card.querySelector('.hiw__graphic');
      if (!graphic) return;

      if (lottieAnims[cardIndex]) {
        lottieAnims[cardIndex].play();
        lottiePlayingState[cardIndex] = true;
      }

      cardFadeActive[cardIndex] = true;
      var startTime = performance.now();
      var idx = cardIndex;
      (function fadeIn(now) {
        if (!cardFadeActive[idx]) return;
        var elapsed = now - startTime;
        var p = Math.min(elapsed / ROCK_ANIM_DURATION, 1);
        graphic.style.opacity = p;
        if (p < 1) {
          requestAnimationFrame(fadeIn);
          return;
        }
      })(startTime);
    }

    function deactivateCard(cardIndex) {
      if (!activatedCards[cardIndex]) return;
      activatedCards[cardIndex] = false;
      cardFadeActive[cardIndex] = false;

      var card = cards[cardIndex];
      if (animateRocks) {
        var rocksContainer = card.querySelector('.hiw__rocks');
        if (rocksContainer) initRocks(cardIndex, rocksContainer);
      }

      var graphic = card.querySelector('.hiw__graphic');
      if (graphic) graphic.style.opacity = '0';

      if (lottieAnims[cardIndex] && lottiePlayingState[cardIndex]) {
        lottieAnims[cardIndex].pause();
        lottiePlayingState[cardIndex] = false;
      }
    }

    function measure() {
      var vh = getViewportHeight();
      var cardStep = HOLD_PX + TRANSITION_PX;
      var totalTransition = SETTLE_PAUSE + (cards.length - 1) * cardStep + HOLD_PX;
      var headerHeight = headerEl ? headerEl.offsetHeight : 0;
      section.style.height = (headerHeight + vh + totalTransition) + 'px';
      cards.forEach(function (card, i) {
        if (i === 0) card.style.transform = 'none';
        else card.style.transform = 'translateY(' + vh + 'px)';
      });
    }

    function onScroll() {
      var sectionRect = section.getBoundingClientRect();
      var stickyRect = stickyEl ? stickyEl.getBoundingClientRect() : null;
      var vh = getViewportHeight();
      var scrolled = computeScrolled();

      var cardStep = HOLD_PX + TRANSITION_PX;

      var stickyTop = stickyRect
        ? (isWindowContainer()
          ? stickyRect.top
          : stickyRect.top - scrollContainer.getBoundingClientRect().top)
        : sectionRect.top;

      if (!activatedCards[0] && stickyTop < vh - SETTLE_PAUSE) {
        activateCard(0);
        loadLottieForCard(0);
      }
      if (activatedCards[0] && stickyTop >= vh) {
        deactivateCard(0);
      }

      for (var i = 1; i < cards.length; i++) {
        var start = SETTLE_PAUSE + (i - 1) * cardStep + HOLD_PX;
        var end   = start + TRANSITION_PX;

        var t;
        if (scrolled <= start) {
          t = 0;
        } else if (scrolled >= end) {
          t = 1;
        } else {
          t = (scrolled - start) / TRANSITION_PX;
        }

        if (t === 0) {
          deactivateCard(i);
        }

        if (t >= 1) {
          activateCard(i);
          loadLottieForCard(i);
        }

        var eased = t < 0.5
          ? 4 * t * t * t
          : 1 - Math.pow(-2 * t + 2, 3) / 2;

        var offsetPx = (1 - eased) * vh;
        cards[i].style.transform = 'translateY(' + offsetPx + 'px)';

        var fadeOut = 0;
        if (t > 0.7) {
          fadeOut = (t - 0.7) / 0.3;
          if (fadeOut > 1) fadeOut = 1;
        }
        cards[i - 1].style.opacity = 1 - fadeOut;

        if (fadeOut >= 1 && lottieAnims[i - 1] && lottiePlayingState[i - 1]) {
          lottieAnims[i - 1].pause();
          lottiePlayingState[i - 1] = false;
        } else if (fadeOut < 1 && lottieAnims[i - 1] && activatedCards[i - 1] && !lottiePlayingState[i - 1]) {
          lottieAnims[i - 1].play();
          lottiePlayingState[i - 1] = true;
        }
      }

      var lastIdx = cards.length - 1;
      if (activatedCards[lastIdx] && lottieAnims[lastIdx] && !lottiePlayingState[lastIdx]) {
        lottieAnims[lastIdx].play();
        lottiePlayingState[lastIdx] = true;
      }

      var sectionVisible;
      if (isWindowContainer()) {
        sectionVisible = sectionRect.top < vh && sectionRect.bottom > 0;
      } else {
        var scrollerRect = scrollContainer.getBoundingClientRect();
        sectionVisible = sectionRect.top < scrollerRect.bottom && sectionRect.bottom > scrollerRect.top;
      }
      if (!sectionVisible) {
        for (var j = 0; j < lottieAnims.length; j++) {
          if (lottieAnims[j] && lottiePlayingState[j]) {
            lottieAnims[j].pause();
            lottiePlayingState[j] = false;
          }
        }
      }

      if (snapReady && !isSnapping) {
        for (var s = 1; s < cards.length; s++) {
          var snapStart = SETTLE_PAUSE + (s - 1) * cardStep + HOLD_PX;
          var snapEnd   = snapStart + TRANSITION_PX;
          if (lastScrolledForSnap <= snapStart && scrolled > snapStart && scrolled < snapEnd) {
            lastScrolledForSnap = snapEnd;
            activateCard(s);
            loadLottieForCard(s);
            snapScroll(getScrollTop(), getScrollTop() + (snapEnd - scrolled));
            break;
          }
        }
      }
      if (!isSnapping) lastScrolledForSnap = scrolled;
      if (!snapReady) snapReady = true;
    }

    function onScrollThrottled() {
      if (scrollTicking) return;
      scrollTicking = true;
      requestAnimationFrame(function () {
        onScroll();
        scrollTicking = false;
      });
    }

    function onResize() {
      measure();
      onScroll();
    }

    cards.forEach(function (card, i) {
      if (animateRocks) {
        var rocksContainer = card.querySelector('.hiw__rocks');
        if (rocksContainer) initRocks(i, rocksContainer);
      }
      var graphic = card.querySelector('.hiw__graphic');
      if (graphic) graphic.style.opacity = '0';
      if (i > 0) card.style.transform = 'translateY(' + window.innerHeight + 'px)';
    });

    scrollContainer = findScrollContainer(section);
    measure();
    scrollContainer.addEventListener('scroll', onScrollThrottled, true);
    window.addEventListener('resize', onResize);

    raf1 = requestAnimationFrame(function () {
      raf2 = requestAnimationFrame(function () {
        onScroll();

        var initScrolled = computeScrolled();
        if (initScrolled > 0) {
          var cs = HOLD_PX + TRANSITION_PX;
          for (var s = 1; s < cards.length; s++) {
            var ss = SETTLE_PAUSE + (s - 1) * cs + HOLD_PX;
            var se = ss + TRANSITION_PX;
            if (initScrolled > ss && initScrolled < se) {
              lastScrolledForSnap = ss;
              snapScroll(getScrollTop(), getScrollTop() + (se - initScrolled));
              break;
            }
          }
          if (!isSnapping) {
            lastScrolledForSnap = initScrolled;
          }
        }
      });
    });

    return function cleanup() {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      scrollContainer.removeEventListener('scroll', onScrollThrottled, true);
      window.removeEventListener('resize', onResize);
      unlockUserScroll();
      lottieAnims.forEach(function (anim) {
        if (anim && anim.destroy) anim.destroy();
      });
    };
  }

  function initHiw() {
    if (hiwInitialized) return;
    hiwInitialized = true;
    if (io) { io.disconnect(); io = null; }

    var section = document.getElementById('how-it-works');
    if (!section) return;
    teardown = mountHowItWorks(section);
  }

  function boot() {
    var section = document.getElementById('how-it-works');
    if (!section) return;

    if (typeof IntersectionObserver === 'undefined') {
      initHiw();
      return;
    }

    io = new IntersectionObserver(function (entries) {
      for (var k = 0; k < entries.length; k++) {
        if (entries[k].isIntersecting) {
          initHiw();
          break;
        }
      }
    }, { root: null, rootMargin: '800px 0px', threshold: 0 });

    io.observe(section);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
