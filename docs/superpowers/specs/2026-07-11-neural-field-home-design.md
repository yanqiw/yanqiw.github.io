# Neural Field Home Design

## Objective

Replace the language-selection landing page with a direct, high-impact personal homepage for AI writing and open-source work. Keep language selection secondary in the top-right navigation and use a responsive mouse-driven dot field to create a distinctive AI systems atmosphere without obscuring the content.

## Routes and language behavior

- `/` renders the Chinese homepage directly and uses Chinese metadata.
- `/zh/` remains the canonical explicit Chinese route and renders the same homepage content.
- `/en/` renders the English equivalent.
- Chinese pages show a compact `EN` control at the top right; English pages show `中文`.
- No page presents language selection as its primary action.

## Visual direction

The approved direction is **Neural Field**. The page uses a near-black background with restrained cyan, cool blue, and violet light. A regular field of small dots occupies the hero background. The typography and information hierarchy stay crisp and editorial: a small technical eyebrow, one large statement, a short author description, and clear links to projects and writing.

The interactive layer must feel like a field responding to energy, not a decorative cursor trail. Dots near the pointer move away from it with distance-based falloff. Pointer movement launches a soft expanding ring that briefly changes dot size, brightness, and displacement. When the pointer stops, dots ease back to their grid positions. The effect remains behind all content and never captures pointer input.

## Component architecture

`src/components/NeuralField.astro` owns the canvas markup and loads a small client script. `src/scripts/neural-field.ts` owns the renderer and has no dependency on Astro or page content. It exposes pure geometry helpers for calculating pointer force and ring influence so animation behavior can be tested independently.

The renderer uses Canvas 2D and `requestAnimationFrame`. It rebuilds the dot grid on resize, caps device pixel ratio at `2`, uses a configurable spacing around `24px`, and only redraws while the page is visible. The component is placed inside a shared localized home presentation so `/`, `/zh/`, and `/en/` do not duplicate layout logic.

## Performance and accessibility

- The canvas has `aria-hidden="true"` and is non-interactive.
- `prefers-reduced-motion: reduce` renders a static field without starting an animation loop.
- Coarse-pointer/mobile devices render a static or very slowly breathing field and do not register pointer movement.
- The renderer pauses when `document.visibilityState` is hidden.
- Canvas resolution is bounded by a device-pixel-ratio cap and the grid uses a fixed maximum dot count.
- The content remains complete and readable if JavaScript or Canvas is unavailable.
- Foreground text and controls retain accessible contrast over a dark overlay.

## Homepage information hierarchy

1. Global navigation with wordmark, Writing, Projects, GitHub, and the secondary language switch.
2. Hero statement about people and agents working together.
3. Short author description and two actions: explore projects and read writing.
4. Featured Coordination Memory project card.
5. Writing section with an empty-state message until new AI articles are published.
6. Minimal footer.

## Verification

Automated contract tests verify that `/` no longer contains language-selection copy, the language switch remains present, the shared homepage includes `NeuralField`, and the canvas fallback attributes are present. Unit tests cover zero-distance force handling, distance falloff, ring decay, and reduced-motion initialization. A production Astro build must generate `/`, `/zh/`, and `/en/` successfully. Browser checks cover desktop pointer response, no horizontal overflow, mobile static fallback, reduced-motion behavior, and console errors.
