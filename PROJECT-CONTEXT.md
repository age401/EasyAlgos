# EasyAlgos Web — Project Context & Implementation Notes

## Tech Stack

- **Plain HTML/CSS/JS** — no framework, no build step, no Tailwind
- **Lottie-web 5.12.2** via CDN (`<script defer>`)
- **Fonts**: Poppins (headings/UI), Roboto (body text)
- Static file serving (any simple HTTP server works)

## File Structure

```
index.html          — single-page site, all sections
styles.css          — all styles, including responsive breakpoints
script.js           — all JS (section header animations, problem cards, HIW scroll logic)
img/                — SVG assets (hiw-rocks-01.svg, etc.)
animations/         — Lottie JSON files (hiw-01.json through hiw-04.json)
```

---

## Critical Bug Fix: `overflow-x` vs `position: sticky`

**Problem**: `overflow-x: hidden` on `html` or `body` creates a new scroll container in browsers, which completely breaks `position: sticky` on child elements.

**Solution**: Use `overflow-x: clip` instead. It clips overflow visually without creating a scroll container.

```css
html { overflow-x: clip; }
body { overflow-x: clip; }
```

> **Never change these back to `overflow: hidden`** — it will break the entire How It Works scroll-lock effect.

---

## Section Header Template

All section headers follow a shared pattern with entrance animations driven by IntersectionObserver.

### HTML Structure

```html
<div class="section-header" data-section-header>
  <div class="section-header__badge-wrap" data-sh-badge>
    <span class="section-header__badge">Badge text</span>
  </div>
  <div class="section-header__text">
    <h2 class="section-header__title" data-sh-title>
      Title text <span class="section-header__gradient">gradient text</span>
    </h2>
    <p class="section-header__subtitle" data-sh-subtitle>
      Subtitle text
    </p>
  </div>
</div>
```

### Key Details

- `data-section-header` — triggers the IntersectionObserver in `script.js`
- `data-sh-badge`, `data-sh-title`, `data-sh-subtitle` — targets for staggered entrance animations
- Class `sh-entered` is added when visible; animations are CSS transitions triggered by this class
- The gradient span uses `background-clip: text` with a linear gradient (#205efb → #b36dff)
- Do NOT add custom padding to section headers — the parent section handles spacing
- Observer trigger offset: `-180px`, threshold: `0`

---

## How It Works Section — Architecture

### Scroll-Lock Card Stacking

Cards use `position: sticky` to pin in the viewport, with JS-driven `translateY` to slide subsequent cards up over the current one.

### HTML Structure (simplified)

```html
<section class="hiw" id="how-it-works">
  <div class="section-header" data-section-header>...</div>

  <div class="hiw__sticky">
    <div class="hiw__viewport">
      <div class="hiw__container">
        <div class="hiw__card" data-hiw-card="0">
          <div class="hiw__card-inner" style="background: linear-gradient(...)">
            <div class="hiw__rocks" data-rocks="1">
              <svg><!-- inlined SVG with rock groups --></svg>
            </div>
            <div class="hiw__left"><!-- text content --></div>
            <div class="hiw__right">
              <div class="hiw__graphic"><!-- lottie renders here --></div>
            </div>
          </div>
        </div>
        <!-- cards 1, 2, 3 follow same pattern -->
      </div>
    </div>
  </div>
</section>
```

### CSS Key Points

- `.hiw__sticky` — `position: sticky; top: 0; height: 100vh`
- `.hiw__viewport` — `overflow: hidden` (clips card transitions)
- `.hiw__card:first-child` — `position: relative` (flow element)
- `.hiw__card:not(:first-child)` — `position: absolute` (stacked, animated via translateY)
- `.hiw__card-inner` — `position: relative; overflow: hidden; border-radius: 40px`
- Section height is set dynamically in JS to create enough scroll runway

### JS Tweakable Parameters (`script.js`)

```javascript
var SETTLE_PAUSE   = 20;    // px scroll after sticky pins before first card activates
var HOLD_PX        = 200;   // px scroll to hold each card visible before next enters
var TRANSITION_PX  = 600;   // px scroll for each card's slide-in transition
var ROCK_ANIM_DURATION = 1520; // ms — max rock delay (120ms) + CSS transition (1400ms)
```

### Section Height Formula

```javascript
var headerH = section.querySelector('.section-header').offsetHeight;
var cardStep = HOLD_PX + TRANSITION_PX;  // 800
var totalTransition = SETTLE_PAUSE + (cards.length - 1) * cardStep + HOLD_PX;
section.style.height = (headerH + vh + totalTransition) + 'px';
```

The `onScroll` function subtracts `headerH` from the raw scroll offset so card transitions start only after the header scrolls out of view.

### Card Transition Easing

Cubic ease-in-out applied in JS:
```javascript
var eased = t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3) / 2;
```

### Previous Card Fade-Out

When an incoming card reaches 70% of its transition, the previous card fades from opacity 1→0 over the remaining 30%.

---

## Animated Rock Backgrounds

### How They Work

Each card has an inlined SVG background with rock `<g>` elements. On page load, JS applies initial transforms (translate + rotate) to scatter rocks. When a card reaches its "still position," transforms are removed and CSS transitions animate them into their final SVG positions.

### SVG Inlining Convention

- Group IDs: `cr{cardNum}-r{rockNum}` (e.g., `cr1-r25`, `cr2-r16`)
- Gradient IDs: `cr{cardNum}g{index}` (e.g., `cr1g0`, `cr2g47`)
- Clip path IDs: `cr{cardNum}clip`
- Data attribute: `data-rock="{rockNum}"` (integer, no zero-padding)

> All IDs must be unique across cards since SVGs are inlined in the same document.

### CSS for Rock Animation

```css
.hiw__rocks [data-rock] {
  transform-box: view-box;       /* critical for correct transform-origin in SVG */
  will-change: transform;
  transition: transform 1.4s cubic-bezier(0.05, 0.85, 0.15, 1);
}
```

- `transform-box: view-box` — ensures `transform-origin` coordinates are in SVG space
- The easing gives a "warp speed deceleration" feel
- Each rock has a `transition-delay` set via JS for staggered entrance

### ROCK_DATA Structure

```javascript
var ROCK_DATA = {
  0: {  // card index
    25: [dx, dy, rotation, centerX, centerY, delayMs],
    // ...
  },
  1: { ... },
  2: { ... },
  3: { ... }
};
```

- `dx, dy` — initial offset from final position (SVG px)
- `rotation` — initial rotation (degrees), from Figma frame rotation values
- `centerX, centerY` — transform-origin (bounding box center of rock in SVG coords)
- `delayMs` — stagger delay for the transition

### Bug Fix: Rock Number Parsing

**Problem**: Originally parsed rock numbers from SVG element IDs using `id.replace(/[^0-9]/g, '')`, which turned `cr1-r25` into `125`.

**Solution**: Added explicit `data-rock="25"` attributes and read them with `el.getAttribute('data-rock')`.

### Bug Fix: Animation Not Triggering

**Problem**: `initRocks()` (set initial transforms) and `activateCard()` (remove transforms) ran synchronously, so the browser batched the style changes and skipped the CSS transition.

**Solution**: Deferred the initial `onScroll()` call using double `requestAnimationFrame`:
```javascript
requestAnimationFrame(function () {
  requestAnimationFrame(function () {
    onScroll();
  });
});
```

Also changed `activateCard(0)` trigger from `sectionRect.top <= 0` to `scrolled >= SETTLE_PAUSE` so the card visually settles before rocks animate.

---

## Lottie Animations

### Setup

- Loaded via `lottie.loadAnimation()` with `autoplay: false`, `loop: true`, `renderer: 'svg'`
- Container: `.hiw__graphic` element inside each card

### Timing

- `.hiw__graphic` starts at `opacity: 0`
- When `activateCard()` fires, a `requestAnimationFrame` loop fades opacity from 0→1 over `ROCK_ANIM_DURATION` (1520ms), synced with the rock entrance
- Lottie `play()` is called when opacity reaches 1 (rocks have finished entering)

### Pause/Resume Logic

- Paused when the previous card is fully faded out by an incoming card
- Paused when the entire section scrolls out of the viewport
- Resumed when a card becomes visible again (scrolling back up)

---

## Card Shadow

Implemented as a `::before` pseudo-element on `.hiw__container`, not a `box-shadow`:

```css
.hiw__container::before {
  content: '';
  position: absolute;
  left: 104px;   /* card padding (60px) + 44px narrower on each side */
  right: 104px;
  top: 32px;
  bottom: -32px;
  background: #c0bff3;
  filter: blur(45px);
  border-radius: 40px;
  pointer-events: none;
}
```

The shadow is 44px narrower than the card on each side and offset 32px downward, matching the Figma "Shadow" element. Responsive breakpoints adjust the inset values to match card padding changes.

---

## Responsive Breakpoints (HIW Section)

| Range | Card padding | Key changes |
|-------|-------------|-------------|
| ≥1241px | 60px | Full side-by-side layout, Graphic fixed 520×520 |
| 1240–1025px | 40px | Left content shrinks, Graphic stays fixed, reduced gap |
| 1024–769px | 40px | Stacked layout (column), Graphic responsive with max-width 360px, rocks opacity 40% |
| ≤768px | 12px | Stacked layout, full-width Graphic, border-radius 24px on card-inner |

### Important: Rocks Opacity on Small Viewports

```css
@media (max-width: 1024px) {
  .hiw__rocks { opacity: 0.4; }
}
```

---

## Card Content & Gradients

| Card | data-hiw-card | Gradient | Rocks prefix |
|------|--------------|----------|-------------|
| 1 | 0 | 116.57deg, #3E3C84 → #6D5FBF | cr1 (25 rocks) |
| 2 | 1 | 63.43deg, #3E2570 → #7A41B8 | cr2 (16 rocks) |
| 3 | 2 | 63.43deg, #3F64BF → #4B76E3 | cr3 (14 rocks) |
| 4 | 3 | -49.4deg, #205EFB → #B36DFF | cr4 (18 rocks) |

---

## Adding New Sections

1. Use the `section-header` template (see above) — it auto-animates via IntersectionObserver
2. Don't add custom padding to section headers
3. Parent sections handle vertical spacing
4. For gradient text in titles, use `<span class="section-header__gradient">`
5. For larger gradient text, add `section-header__gradient--large`

---

## Common Pitfalls

1. **Never use `overflow: hidden` on html/body** — use `overflow-x: clip`
2. **SVG IDs must be globally unique** — all card SVGs are inlined in the same document
3. **`transform-box: view-box`** is required on SVG animated elements for correct transform-origin
4. **Double rAF** needed when setting initial CSS transforms then removing them — browser batches synchronous style changes
5. **Section height must include the header height** in the HIW section for correct scroll math
6. **Card shadow uses a pseudo-element**, not box-shadow — box-shadow spread cannot make the shadow narrower than the element
