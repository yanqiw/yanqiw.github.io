import { defineCollection, z } from 'astro:content';

const posts = defineCollection({
	type: 'content',
	schema: z.object({
		title: z.string(),
		pubDate: z.date(),
		description: z.string().optional(),
		category: z.string().optional(),
		image: z.string().optional(),
		order: z.number().optional(),
		draft: z.boolean().optional(),
	}),
});

export const collections = { posts };
