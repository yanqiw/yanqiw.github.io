# Personal and Project Pages Design

## Objective

Relaunch `yanqiw.github.io` as a bilingual home for AI writing and open-source projects, archive all legacy posts, and publish `yanqiw/comem` as the first independently maintained project site at `https://yanqiw.github.io/comem/`.

## Repository boundaries

- `yanqiw/yanqiw.github.io` owns the personal homepage, bilingual blog index and articles, project directory, and GitHub-derived project metadata.
- `yanqiw/comem` owns the Coordination Memory product landing page and all project documentation.
- Each repository builds and deploys independently with GitHub Actions. No documentation is copied between repositories.

## Personal site

The existing Astro static site remains the foundation and is upgraded to a current supported Astro release. Routes use explicit locale prefixes: `/zh/` and `/en/`. The root chooses a stable default without client-side translation. Article records carry `lang` and an optional `translationKey`, so either language may exist independently. Legacy posts remain in Git but are marked archived and excluded from every generated route, list, category, search index, and feed.

The home page presents the author, recent AI writing, and a featured `comem` project card. Repository statistics are fetched from GitHub's public API during the build, with checked-in fallback metadata so transient API failures do not break deployment.

## comem project site

VitePress builds the existing `docs/` Markdown tree plus a project landing page. Its base path is `/comem/`. Navigation links to the guide, concepts, tools, GitHub repository, PyPI package, and the personal site. The project repository's own Pages workflow builds and deploys the site on changes to `main`.

## Deployment and verification

Both sites must build locally. Generated personal-site output must contain localized routes and no legacy post detail pages. Generated project output must use `/comem/` asset URLs. After pushing, both Actions workflows must complete successfully and HTTP checks must confirm `https://yanqiw.github.io/` and `https://yanqiw.github.io/comem/` return the new content.
