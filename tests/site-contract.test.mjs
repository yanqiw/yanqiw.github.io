import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const text = (file) => readFile(new URL(file, root), 'utf8');

async function markdownFiles(directory) {
  const entries = await readdir(new URL(directory, root), { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => {
    const relative = path.posix.join(directory, entry.name);
    return entry.isDirectory() ? markdownFiles(`${relative}/`) : [relative];
  }));
  return nested.flat().filter((file) => file.endsWith('.md'));
}

test('legacy posts are archived and excluded by one publication predicate', async () => {
  const files = await markdownFiles('src/content/posts/');
  assert.ok(files.length > 0);

  for (const file of files) {
    assert.match(await text(file), /^archived: true$/m, `${file} is not archived`);
  }

  const schema = await text('src/content.config.ts');
  assert.match(schema, /glob\(\{\s*pattern:/s);
  assert.match(schema, /from 'astro\/loaders'/);
  assert.match(schema, /archived:\s*z\.boolean\(\)\.optional\(\)/);

  const predicate = await text('src/lib/posts.ts');
  assert.match(predicate, /data\.draft !== true && data\.archived !== true/);

  const route = await text('src/pages/[lang]/posts/[...slug].astro');
  assert.match(route, /isPublishedPost/);
  assert.match(route, /getCollection\('posts', isPublishedPost\)/);
  await assert.rejects(text('src/pages/posts/[...slug].astro'), { code: 'ENOENT' });
  for (const legacyRoute of [
    'src/pages/posts/index.astro',
    'src/pages/categories/index.astro',
    'src/pages/category/[category].astro',
    'src/pages/search.astro',
    'src/pages/search.json.ts',
  ]) {
    await assert.rejects(text(legacyRoute), { code: 'ENOENT' });
  }
});

test('localized home routes and project fallback are part of the source contract', async () => {
  const zh = await text('src/pages/zh/index.astro');
  const en = await text('src/pages/en/index.astro');
  const home = await text('src/components/HomePage.astro');
  const layout = await text('src/layouts/BaseLayout.astro');
  const projects = await text('src/data/projects.ts');

  assert.match(zh, /<HomePage lang="zh"/);
  assert.match(en, /<HomePage lang="en"/);
  assert.match(home, /<ProjectCard project=\{project\} lang=\{lang\}/);
  assert.match(layout, /hreflang/);
  assert.match(projects, /yanqiw\/comem/);
  assert.match(projects, /Coordination Memory/);
  assert.match(projects, /fallback/);
});

test('future posts render under locale-prefixed routes with optional translations', async () => {
  const detail = await text('src/pages/[lang]/posts/[...slug].astro');
  const index = await text('src/pages/[lang]/posts/index.astro');
  const schema = await text('src/content.config.ts');

  assert.match(detail, /render\(post\)/);
  assert.match(detail, /post\.id/);
  assert.match(detail, /params:\s*\{\s*lang:/s);
  assert.match(index, /\['zh', 'en'\]/);
  assert.match(schema, /translationKey:\s*z\.string\(\)\.optional\(\)/);
});

test('Pages workflow is reproducible and cancels superseded deploys', async () => {
  const workflow = await text('.github/workflows/deploy.yml');
  assert.match(workflow, /npm ci/);
  assert.match(workflow, /ASTRO_TELEMETRY_DISABLED:\s*['"]?1/);
  assert.match(workflow, /cancel-in-progress:\s*true/);
});

test('neural field is decorative, responsive, and progressively enhanced', async () => {
	const component = await text('src/components/NeuralField.astro');
	const renderer = await text('src/scripts/neural-field.ts');

	assert.match(component, /data-neural-field/);
	assert.match(component, /aria-hidden="true"/);
	assert.match(component, /pointer-events:\s*none/);
	assert.match(renderer, /prefers-reduced-motion/);
	assert.match(renderer, /pointer:\s*coarse/);
	assert.match(renderer, /Math\.min\(window\.devicePixelRatio[^,]*,\s*2\)/);
	assert.match(renderer, /visibilitychange/);
	assert.match(renderer, /requestAnimationFrame/);
});

test('root and localized routes share one homepage with a quiet language switch', async () => {
	const rootPage = await text('src/pages/index.astro');
	const zh = await text('src/pages/zh/index.astro');
	const en = await text('src/pages/en/index.astro');
	const home = await text('src/components/HomePage.astro');
	const layout = await text('src/layouts/BaseLayout.astro');

	assert.match(rootPage, /HomePage/);
	assert.match(rootPage, /lang="zh"/);
	assert.doesNotMatch(rootPage, /选择语言/);
	assert.match(zh, /HomePage/);
	assert.match(zh, /lang="zh"/);
	assert.match(en, /HomePage/);
	assert.match(en, /lang="en"/);
	assert.match(home, /NeuralField/);
	assert.match(home, /ProjectCard/);
	assert.match(layout, /class="language-switch"/);
});
