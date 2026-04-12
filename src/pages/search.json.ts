import { getCollection } from 'astro:content';

export async function GET({ request }) {
  const posts = await getCollection('posts', ({ data }) => {
    return data.draft !== true;
  });

  const searchablePosts = posts.map(post => ({
    title: post.data.title,
    description: post.data.description,
    slug: post.slug,
    category: post.data.category || 'Uncategorized',
    pubDate: post.data.pubDate,
  }));

  return new Response(JSON.stringify(searchablePosts), {
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}
