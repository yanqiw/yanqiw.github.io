import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const posts = defineCollection({
	loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './src/content/posts' }),
	schema: z.object({
		title: z.string(),
		pubDate: z.coerce.date(),
		description: z.string().optional(),
		category: z.string().optional(),
		image: z.string().optional(),
		order: z.number().optional(),
		draft: z.boolean().optional(),
		archived: z.boolean().optional(),
		lang: z.enum(['zh', 'en']).optional(),
		translationKey: z.string().optional(),
	}),
});

export const collections = { posts };
