/**
 * Section Header Entrance Animation
 *
 * Triggers a staggered fade-in / slide-up animation on section headers
 * when they scroll into view. Resets when the user scrolls back up
 * (section exits below the viewport), and replays on the next
 * downward scroll.
 *
 * ── HOW TO USE ──────────────────────────────────────────────────────
 *
 *  1. Wrap the three header elements in a container with
 *     the attribute  data-section-header
 *
 *  2. Tag each child element:
 *       - data-sh-badge     → the pre-title / section name badge
 *       - data-sh-title     → the heading
 *       - data-sh-subtitle  → the sub-heading
 *
 *  3. Include the CSS block that defines the .sh-entered transitions
 *     and custom properties (durations, delays, easing, slide distance).
 *
 *  4. Include this script (no dependencies).
 *
 * ── EXAMPLE (vanilla HTML) ──────────────────────────────────────────
 *
 *  <div class="section-header" data-section-header>
 *    <div data-sh-badge>
 *      <span class="section-header__badge">The solution</span>
 *    </div>
 *    <div class="section-header__text">
 *      <h2 data-sh-title>You get the best Expert Advisors,
 *        <span class="section-header__gradient">but you don't pay</span>
 *      </h2>
 *      <p data-sh-subtitle>Performance. Simplicity. Transparency.</p>
 *    </div>
 *  </div>
 *
 * ── EXAMPLE (Tailwind — the dev's existing code) ───────────────────
 *
 *  <!-- Just add the three data attributes to the existing markup -->
 *
 *  <div data-section-header>
 *    <div class="centered mb-12" data-sh-badge>
 *      <p class="w-fit text-[#2D2D2D] text-xs …">The solution</p>
 *    </div>
 *    <div class="max-tablet-md:px-[22px] flex flex-col gap-6 mb-12 …">
 *      <h3 class="new-landing-section-title" data-sh-title>
 *        You get the best Expert Advisors,
 *        <span class="linear-gradient-text font-medium">but you don't pay</span>
 *      </h3>
 *      <p class="new-landing-section-subtitle" data-sh-subtitle>
 *        Performance. Simplicity. Transparency.
 *      </p>
 *    </div>
 *  </div>
 *
 * ────────────────────────────────────────────────────────────────────
 */

(function () {
  'use strict';

  /* ── Tweakable config ─────────────────────────────────────────────
   *
   *  TRIGGER_OFFSET
   *    Controls how far into the viewport the section header must be
   *    before the animation fires.
   *
   *    Expressed as a negative bottom rootMargin for IntersectionObserver.
   *    Examples:
   *      '0px'   → fires the instant ANY part enters the viewport bottom
   *      '-80px' → fires when the header is 80 px inside the viewport
   *      '-20%'  → fires when the header is 20% of viewport height inside
   *
   *    Larger negative values = user must scroll further before it triggers.
   *
   *  TRIGGER_THRESHOLD
   *    The fraction of the element that must be visible (0–1).
   *    0   = any sliver counts (combined with TRIGGER_OFFSET for fine-tuning)
   *    0.5 = half the element must be past the offset line
   *
   *  ENTER_CLASS
   *    The CSS class toggled on [data-section-header] to trigger transitions.
   *    Must match the class used in the CSS rules.
   *
   * ────────────────────────────────────────────────────────────────── */

  var TRIGGER_OFFSET    = '-180px';
  var TRIGGER_THRESHOLD = 0;
  var ENTER_CLASS       = 'sh-entered';

  /* ── Implementation (nothing below needs tweaking) ─────────────── */

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

    void el.offsetHeight; // reflow before re-enabling transitions

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
