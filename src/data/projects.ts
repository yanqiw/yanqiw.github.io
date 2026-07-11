export type ProjectFallback = {
	repo: string;
	name: string;
	description: { zh: string; en: string };
	language: string;
	stars: number;
	updatedAt: string;
	siteUrl: string;
	repositoryUrl: string;
};

export const featuredProjects: ProjectFallback[] = [
	{
		repo: 'yanqiw/comem',
		name: 'Coordination Memory',
		description: {
			zh: '面向多智能体协作的本地优先协调记忆：任务租约、交接证据与独立验收。',
			en: 'Local-first coordination memory for multi-agent work: leases, handoff evidence, and independent acceptance.',
		},
		language: 'Python',
		stars: 0,
		updatedAt: '2026-07-11T00:00:00Z',
		siteUrl: 'https://yanqiw.github.io/comem/',
		repositoryUrl: 'https://github.com/yanqiw/comem',
	},
];

export const fallback = featuredProjects[0];
