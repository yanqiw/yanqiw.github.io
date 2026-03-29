import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { globby } from 'globby';

const SOURCE_DIRS = ['docs', '_drafts'];
const DEST_DIR = 'src/content/posts';

async function migrate() {
  if (!fs.existsSync(DEST_DIR)) {
    fs.mkdirSync(DEST_DIR, { recursive: true });
  }

  const files = await globby(SOURCE_DIRS.map(dir => `${dir}/**/*.markdown`));
  console.log(`Found ${files.length} files to migrate.`);

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const { data, content: body } = matter(content);

    // Map Jekyll frontmatter to Astro schema
    let pubDate;
    try {
      pubDate = data.date ? new Date(data.date) : new Date();
      if (isNaN(pubDate.getTime())) {
        throw new Error('Invalid date');
      }
    } catch (e) {
      console.warn(`Warning: Invalid date in ${file}. Using current date.`);
      pubDate = new Date();
    }

    const newFrontmatter = {
      title: data.title || path.basename(file, '.markdown'),
      pubDate,
      category: data.parent || 'Uncategorized',
      order: data.nav_order || 0,
      draft: file.startsWith('_drafts'),
    };

    // Replace Jekyll-style highlight blocks with markdown code blocks
    let newBody = body.replace(/\{% highlight (\w+) %\}/g, '```$1')
                      .replace(/\{% endhighlight %\}/g, '```');

    // Fix specific Shiki language mappings
    newBody = newBody.replace(/```Dockerfile/g, '```dockerfile')
                      .replace(/```DockerFile/g, '```dockerfile')
                      .replace(/```bash/g, '```bash')
                      .replace(/```bas/g, '```bash');

    // Simplified image path fixing to use absolute paths from public
    // Jekyll used /img/ and /assets/images/
    // We will keep those paths working by using the public folder
    newBody = newBody.replace(/(\.\.\/)*img\//g, '/img/');
    newBody = newBody.replace(/(\.\.\/)*assets\/images\//g, '/img/');

    const newContent = matter.stringify(newBody, newFrontmatter);
    const newFileName = path.basename(file).replace('.markdown', '.md');
    
    // Create subfolders based on category to keep it organized
    const categorySlug = newFrontmatter.category.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
    const categoryDir = path.join(DEST_DIR, categorySlug);
    if (!fs.existsSync(categoryDir)) {
        fs.mkdirSync(categoryDir, { recursive: true });
    }

    fs.writeFileSync(path.join(categoryDir, newFileName), newContent);
    console.log(`Migrated: ${file} -> ${path.join(categorySlug, newFileName)}`);
  }
}

migrate().catch(console.error);
