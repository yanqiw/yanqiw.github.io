# Neural Field Home Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the language chooser with a direct localized homepage and add a performant, accessible mouse-responsive Neural Field canvas behind the hero.

**Architecture:** Pure TypeScript geometry helpers calculate pointer and ring influence. A dependency-free Canvas 2D renderer consumes those helpers, while an Astro component owns progressive enhancement and a shared localized home component owns all homepage content.

**Tech Stack:** Astro 6, TypeScript, Canvas 2D, Tailwind CSS 4, Node test runner

## Global Constraints

- `/` renders Chinese homepage content directly.
- `/zh/` and `/en/` share one homepage presentation component.
- Language selection appears only as the compact top-right navigation control.
- Canvas uses `aria-hidden="true"`, never captures pointer events, and does not block content.
- Reduced-motion and coarse-pointer devices receive a static field.
- Device pixel ratio is capped at `2` and the renderer pauses in hidden tabs.
- No WebGL or third-party animation dependency.

---

### Task 1: Neural field geometry

**Files:**
- Create: `src/scripts/neural-field-math.mjs`
- Create: `tests/neural-field-math.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Produces: `pointerInfluence(distance, radius): number`, `ringInfluence(distance, radius, width): number`, and `easeHome(current, origin, factor): number`.

- [ ] **Step 1: Write failing unit tests**

Tests must assert zero outside the radius, finite output at zero distance, monotonic pointer falloff, a ring peak at its radius, zero outside ring width, and easing toward origin without overshoot.

- [ ] **Step 2: Verify the tests fail**

Run: `node --test tests/neural-field-math.test.mjs`

Expected: FAIL because `src/scripts/neural-field-math.mjs` does not exist.

- [ ] **Step 3: Implement pure geometry helpers**

Use clamped normalized distances. `pointerInfluence` returns `(1 - distance / radius)²`; `ringInfluence` returns `1 - abs(distance - radius) / width`; `easeHome` returns `current + (origin - current) * factor`.

- [ ] **Step 4: Verify geometry tests pass**

Run: `node --test tests/neural-field-math.test.mjs`

Expected: all geometry tests PASS.

### Task 2: Canvas renderer and accessible component

**Files:**
- Create: `src/scripts/neural-field.ts`
- Create: `src/components/NeuralField.astro`
- Modify: `tests/site-contract.test.mjs`

**Interfaces:**
- Consumes: geometry helpers from Task 1.
- Produces: `<NeuralField />` with canvas selector `[data-neural-field]` and static fallback class `.neural-field-fallback`.

- [ ] **Step 1: Add failing component contract assertions**

Require `aria-hidden="true"`, `data-neural-field`, `pointer-events: none`, `prefers-reduced-motion`, `matchMedia('(pointer: coarse)')`, `devicePixelRatio` cap, `visibilitychange`, and `requestAnimationFrame`.

- [ ] **Step 2: Verify the contract test fails**

Run: `npm test`

Expected: FAIL because `NeuralField.astro` and the renderer do not exist.

- [ ] **Step 3: Implement the renderer**

Create a 24px dot grid with a maximum of 3,600 dots. Draw a static frame for reduced motion or coarse pointers. On fine pointers, track pointer coordinates, apply distance-based displacement plus expanding ring influence, ease dots home, cap DPR with `Math.min(window.devicePixelRatio || 1, 2)`, rebuild on resize, and pause/resume on `visibilitychange`.

- [ ] **Step 4: Implement the Astro component**

Render the canvas and a CSS radial-dot fallback in one absolute, non-interactive background layer. Load `neural-field.ts` with an Astro module script.

- [ ] **Step 5: Verify tests and build**

Run: `npm test && ASTRO_TELEMETRY_DISABLED=1 npm run build`

Expected: all tests PASS and the Astro production build exits `0`.

### Task 3: Shared localized homepage

**Files:**
- Create: `src/components/HomePage.astro`
- Modify: `src/pages/index.astro`
- Modify: `src/pages/zh/index.astro`
- Modify: `src/pages/en/index.astro`
- Modify: `src/layouts/BaseLayout.astro`
- Modify: `tests/site-contract.test.mjs`

**Interfaces:**
- Consumes: `<NeuralField />`, `ProjectCard`, `getGitHubProject`, and locale `zh | en`.
- Produces: a single localized homepage used by all three routes.

- [ ] **Step 1: Add failing route and content assertions**

Assert that `src/pages/index.astro` imports `HomePage`, contains no `选择语言`, `/zh/` and `/en/` both import `HomePage`, `HomePage` includes `NeuralField`, and the layout retains the top-right language control.

- [ ] **Step 2: Verify assertions fail**

Run: `npm test`

Expected: FAIL because the root page still contains language-selection content.

- [ ] **Step 3: Implement the shared homepage**

Move localized hero, author description, calls to action, project card, and writing empty state into `HomePage.astro`. Place the Neural Field behind a minimum `calc(100vh - 5rem)` hero with a dark readability overlay. Render Chinese copy for `zh` and English copy for `en`.

- [ ] **Step 4: Make routes thin**

Root and `/zh/` render `<HomePage lang="zh" />`; `/en/` renders `<HomePage lang="en" />`. The root route no longer contains language-choice buttons.

- [ ] **Step 5: Verify routes and artifacts**

Run: `npm test && ASTRO_TELEMETRY_DISABLED=1 npm run build`

Expected: all tests PASS; `dist/index.html`, `dist/zh/index.html`, and `dist/en/index.html` contain `data-neural-field`; root contains the Chinese hero and not `选择语言`.

### Task 4: Browser interaction and production verification

**Files:**
- Modify only if browser verification reveals a reproducible defect.

**Interfaces:**
- Consumes: local production preview.
- Produces: verified desktop, mobile, and reduced-motion behavior.

- [ ] **Step 1: Run a production preview**

Run: `ASTRO_TELEMETRY_DISABLED=1 npm run preview -- --host 127.0.0.1 --port 4321`

- [ ] **Step 2: Verify desktop behavior**

Confirm the canvas covers the hero, dots displace near the pointer, rings fade, foreground controls remain clickable, there is no horizontal overflow, and browser console errors are absent.

- [ ] **Step 3: Verify accessibility fallbacks**

At a 390×844 viewport confirm there is no horizontal overflow. Emulate reduced motion and confirm the canvas stays static while all content remains readable.

- [ ] **Step 4: Run final verification**

Run: `npm ci --ignore-scripts --no-audit --no-fund && npm test && ASTRO_TELEMETRY_DISABLED=1 npm run build && git diff --check`

Expected: clean install, all tests PASS, production build exits `0`, and diff check is empty.

### Task 5: Commit and publish

**Files:**
- No additional source files.

**Interfaces:**
- Consumes: verified implementation commit.
- Produces: live Neural Field homepage on GitHub Pages.

- [ ] **Step 1: Commit the implementation**

Run: `git add src tests package.json package-lock.json && git commit -m "feat: add neural field homepage"`

- [ ] **Step 2: Push the default branch**

Run: `git push origin master`

- [ ] **Step 3: Verify deployment and live pages**

Confirm the Pages workflow succeeds, then fetch `/`, `/zh/`, and `/en/` and assert HTTP `200`, `data-neural-field`, correct localized hero copy, and absence of language-selection copy on `/`.
