# Personal and Project Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish a bilingual AI/open-source personal site and an independent Coordination Memory project site under one GitHub Pages domain.

**Architecture:** Astro statically renders the personal site from localized content and build-time GitHub metadata. VitePress renders `comem` documentation from its own repository with `/comem/` as its base; independent GitHub Actions deploy each artifact.

**Tech Stack:** Astro, TypeScript, Tailwind CSS, VitePress, Markdown, GitHub Actions, GitHub Pages

## Global Constraints

- Legacy posts remain recoverable in Git but generate no public routes.
- Chinese and English content may exist independently; translation links are optional.
- `comem` documentation stays exclusively in `yanqiw/comem`.
- A GitHub API outage must not fail the personal-site build.
- Project-site assets and internal links must work below `/comem/`.

---

### Task 1: Personal-site content model and route contract

**Files:**
- Create: `tests/site-contract.test.mjs`
- Modify: `src/content/config.ts`
- Modify: `src/pages/posts/[...slug].astro`
- Modify: legacy Markdown frontmatter under `src/content/posts/`

**Interfaces:**
- Consumes: Astro `posts` collection.
- Produces: post schema fields `lang`, `translationKey`, and `archived`; public route filtering through `isPublishedPost(data)`.

- [ ] Write a failing Node contract test asserting every legacy post is archived and the post route filters both drafts and archived content.
- [ ] Run `node --test tests/site-contract.test.mjs` and confirm failure because `archived` is absent.
- [ ] Add schema fields, a focused publication predicate, route filtering, and archive frontmatter.
- [ ] Run the contract test and `ASTRO_TELEMETRY_DISABLED=1 npm run build`; confirm no legacy post pages are generated.

### Task 2: Bilingual personal homepage and project data

**Files:**
- Create: `src/data/projects.ts`
- Create: `src/lib/github.ts`
- Create: `src/pages/zh/index.astro`
- Create: `src/pages/en/index.astro`
- Modify: `src/pages/index.astro`
- Modify: `src/layouts/BaseLayout.astro`
- Modify: `tests/site-contract.test.mjs`

**Interfaces:**
- Consumes: `getGitHubProject(repo, fallback)`.
- Produces: localized `/zh/` and `/en/` landing pages and a root default route.

- [ ] Extend the contract test to require both localized routes, language alternates, and a `comem` fallback record; confirm it fails.
- [ ] Implement deterministic GitHub metadata fallback and localized pages featuring AI writing and Coordination Memory.
- [ ] Run the contract test and Astro build; inspect generated `/zh/`, `/en/`, and root HTML for correct links and copy.

### Task 3: Personal-site deployment hardening

**Files:**
- Modify: `.github/workflows/deploy.yml`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `tests/site-contract.test.mjs`

**Interfaces:**
- Consumes: npm lockfile and Astro build script.
- Produces: reproducible `npm ci` Pages build with disabled telemetry.

- [ ] Add a failing contract assertion for `npm ci`, concurrency cancellation, and Astro telemetry disablement.
- [ ] Update dependencies and workflow without changing the Pages artifact contract.
- [ ] Run `npm test` and a clean production build.

### Task 4: Coordination Memory VitePress site

**Files (in `yanqiw/comem`):**
- Create: `docs/.vitepress/config.mts`
- Create: `docs/.vitepress/theme/index.ts`
- Create: `docs/.vitepress/theme/custom.css`
- Create: `docs/index.md`
- Create: `tests/pages-contract.test.mjs`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `pyproject.toml`

**Interfaces:**
- Consumes: existing Markdown files in `docs/`.
- Produces: `npm run docs:build` output in `docs/.vitepress/dist` with base `/comem/`.

- [ ] Write a failing Node contract test for the VitePress base, navigation targets, and project homepage URL.
- [ ] Add VitePress configuration, theme, landing page, scripts, and canonical homepage metadata.
- [ ] Run `npm test`, `node --test tests/pages-contract.test.mjs`, and `npm run docs:build`.

### Task 5: Coordination Memory Pages workflow

**Files (in `yanqiw/comem`):**
- Create: `.github/workflows/pages.yml`
- Modify: `tests/pages-contract.test.mjs`

**Interfaces:**
- Consumes: `docs/.vitepress/dist`.
- Produces: GitHub Pages deployment at `/comem/`.

- [ ] Extend the failing contract test to require Pages permissions, artifact upload, deploy action, and concurrency.
- [ ] Add the workflow using `npm ci`, `npm run docs:build`, `actions/upload-pages-artifact`, and `actions/deploy-pages`.
- [ ] Run all frontend, Python, and Pages contract checks relevant to changed files.

### Task 6: Publish and production verification

**Files:**
- No source files.

**Interfaces:**
- Consumes: verified commits in both repositories.
- Produces: live personal and project Pages deployments.

- [ ] Commit each repository on its isolated branch and review the diffs.
- [ ] Merge or push the verified commits to each default branch as authorized by the user.
- [ ] Monitor both GitHub Actions deployments until successful.
- [ ] Fetch the root, `/zh/`, `/en/`, and `/comem/` URLs and verify expected titles, links, and asset responses.
