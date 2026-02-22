(function () {
  'use strict';

  // Stagger delay per group (ms) — groups 01-06 fire in quick succession
  const STAGGER_MS = 60;

  // Total animation duration per group (ms)
  const ANIM_DURATION_MS = 1200;

  // Cubic-bezier that conveys blast-off: fast start, slight overshoot, settle
  const EASING = 'cubic-bezier(0.16, 1.11, 0.36, 1)';

  // Crater center in SVG coordinates per breakpoint (the origin point for the blast animation)
  const CRATER_CENTER = {
    '2560': { x: 1660, y: 755 },
    '1440': { x: 920,  y: 760 },
    '768':  { x: 570,  y: 570 },
  };

  // Parallax speed ratios per group (01 = farthest = fastest, 06 = closest = slowest)
  const PARALLAX_RATIOS = {
    1: 2.00,
    2: 1.60,
    3: 1.00,
    4: 0.70,
    5: 0.40,
    6: 0.20,
  };

  let entranceComplete = false;
  let parallaxEnabled = false;
  let heroTop = 0;
  let heroHeight = 0;

  function getActiveBreakpoint() {
    const w = window.innerWidth;
    if (w >= 1440) return '2560';
    if (w >= 768) return '1440';
    return '768';
  }

  function getRockGroups() {
    const visibleSvg = document.querySelector('.hero__rocks-svg:not([style*="display: none"])');
    if (!visibleSvg) return [];
    return Array.from(visibleSvg.querySelectorAll('.rock-group'));
  }

  function applyCraterOrigin(groups) {
    const bp = getActiveBreakpoint();
    const center = CRATER_CENTER[bp];
    groups.forEach((g) => {
      g.style.transformOrigin = `${center.x}px ${center.y}px`;
    });
  }

  function getGroupNumber(el) {
    const match = el.id.match(/(\d+)$/);
    return match ? parseInt(match[1], 10) : 0;
  }

  function initEntrance() {
    const groups = getRockGroups();
    applyCraterOrigin(groups);
    groups.forEach((g) => {
      g.classList.add('rock-group--hidden');
      g.style.transition = 'none';
    });
  }

  function runEntrance() {
    const groups = getRockGroups();

    // Sort groups 06→01 so the outermost rocks (01) fire last
    const sorted = groups.slice().sort((a, b) => getGroupNumber(b) - getGroupNumber(a));

    sorted.forEach((g, i) => {
      const delay = i * STAGGER_MS;
      setTimeout(() => {
        g.style.transition = `transform ${ANIM_DURATION_MS}ms ${EASING}, opacity ${ANIM_DURATION_MS * 0.6}ms ease-out`;
        g.classList.remove('rock-group--hidden');
        g.style.opacity = '1';
        g.style.transform = 'scale(1)';
      }, delay);
    });

    const totalTime = (sorted.length - 1) * STAGGER_MS + ANIM_DURATION_MS;
    setTimeout(() => {
      entranceComplete = true;
      parallaxEnabled = true;
      sorted.forEach((g) => {
        g.style.transition = 'none';
      });
      recalcLayout();
    }, totalTime + 50);
  }

  function recalcLayout() {
    const hero = document.querySelector('.hero');
    if (!hero) return;
    const rect = hero.getBoundingClientRect();
    heroTop = rect.top + window.scrollY;
    heroHeight = rect.height;
  }

  // Entrance trigger: fires once when hero is visible
  let entranceTriggered = false;

  function checkEntrance() {
    if (entranceTriggered) return;
    const hero = document.querySelector('.hero');
    if (!hero) return;

    const rect = hero.getBoundingClientRect();
    const visible = rect.top < window.innerHeight && rect.bottom > 0;

    if (visible) {
      entranceTriggered = true;
      runEntrance();
    }
  }

  // Parallax on scroll
  let ticking = false;

  function onScroll() {
    checkEntrance();

    if (!parallaxEnabled) return;
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(applyParallax);
    }
  }

  function applyParallax() {
    ticking = false;
    if (!parallaxEnabled) return;

    const scrollY = window.scrollY;
    const offsetFromHeroTop = scrollY - heroTop;
    if (offsetFromHeroTop < 0) return;

    const groups = getRockGroups();
    groups.forEach((g) => {
      const num = getGroupNumber(g);
      const ratio = PARALLAX_RATIOS[num] || 0;
      const ty = -(offsetFromHeroTop * ratio);
      g.style.transform = `translateY(${ty}px)`;
    });
  }

  // Responsive: swap rocks SVG source based on breakpoint
  function updateRocksSvgVisibility() {
    const wrappers = document.querySelectorAll('.hero__rocks-svg');
    const width = window.innerWidth;

    wrappers.forEach((svg) => {
      const bp = svg.dataset.breakpoint;
      let show = false;
      if (bp === '2560' && width >= 1440) show = true;
      if (bp === '1440' && width >= 768 && width < 1440) show = true;
      if (bp === '768' && width < 768) show = true;
      svg.style.display = show ? '' : 'none';
    });
  }

  // Responsive: swap bg image
  function updateBgVisibility() {
    const imgs = document.querySelectorAll('.hero__bg-img');
    const width = window.innerWidth;

    imgs.forEach((img) => {
      const bp = img.dataset.breakpoint;
      let show = false;
      if (bp === '2560' && width >= 1440) show = true;
      if (bp === '1440' && width >= 768 && width < 1440) show = true;
      if (bp === '768' && width < 768) show = true;
      img.style.display = show ? 'block' : 'none';
    });
  }

  function onResize() {
    recalcLayout();
    updateRocksSvgVisibility();
    updateBgVisibility();

    const groups = getRockGroups();
    applyCraterOrigin(groups);
    if (entranceComplete) {
      groups.forEach((g) => {
        g.classList.remove('rock-group--hidden');
        g.style.opacity = '1';
        g.style.transition = 'none';
        if (!parallaxEnabled) g.style.transform = 'scale(1)';
      });
    } else if (!entranceTriggered) {
      initEntrance();
    }
  }

  function init() {
    updateRocksSvgVisibility();
    updateBgVisibility();
    initEntrance();
    recalcLayout();
    checkEntrance();

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
