# Jwan Sidou #18 — Production Bible

Visual quality > technical complexity. This is a small Japanese football-anime production, not a browser game.

## Pipeline (one scene at a time)
1. Character model sheet → 2. Character approval → 3. Opening scene illustrations → 4. Opening scene animation →
5. Visual review and corrections → 6. Character introduction → 7. Run and shot → 8. Goal and tech-stack reveal.

Nothing past step 2 starts before the model sheet is approved.

## Art approach
- Layered SVG artwork drawn from one model sheet (`art/model-sheet/`). Every asset has a fixed name and canvas size,
  so a professional illustrator can replace any layer later without code changes.
- Look: Japanese football TV anime (Inazuma Eleven family), mature athletic proportions (6.5 heads), not chibi.
- Lines: dark warm ink `#241418`; outer silhouette heavier than inner lines.
- Shading: hard two-tone cel shading with a cool multiply shadow on fabric, warm shadow on skin, highlight band on hair,
  layered anime eyes. Key light from the upper right in every shot.

## Character: Jwan Sidou #18
- Deep espresso-brown flow middle-part hair, thin groomed moustache. No headband.
- Position: CDM (Central Defensive Midfielder). Special move: Tiger Shot.
- Large warm-brown eyes with amber lower iris, sharp outer lash corner, determined brows.
- Kit: Blaugrana striped shirt (garnet/blue), no crest, no sponsors. Gold `JWAN SIDOU` + `18` on the back.
  Black boots with gold details. Navy shorts, blue long socks with garnet band (default, pending approval).

## Timing
- Character animation: drawn key poses + in-betweens at 8–12 fps (on twos/threes).
- Camera, background drift, ball rotation, transitions: smooth (60 fps), driven by GSAP timelines.

## Tech
- Next.js static export (GitHub Pages), React, GSAP timelines. Sprite sheets (WebP/AVIF) for drawn frames, SVG layers,
  Canvas 2D for particles/glow. No Three.js in the opening scene. No Rive/Lottie for now.

## Accessibility and performance
- Static CV always in the HTML; "Skip to CV" is the first focusable element; full keyboard navigation.
- Reduced motion: crossfaded stills, no shake, no flashes. Never more than 3 flashes per second.
- Loading screen preloads only the current scene; later scenes lazy-load. Static fallback if animation fails.
- Per-aspect-ratio framing (mobile gets its own crops).
