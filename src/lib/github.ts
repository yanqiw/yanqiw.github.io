import type { ProjectFallback } from '../data/projects';

type GitHubRepository = {
	stargazers_count: number;
	language: string | null;
	updated_at: string;
};

export async function getGitHubProject(project: ProjectFallback): Promise<ProjectFallback> {
	try {
		const token = import.meta.env.GITHUB_TOKEN;
		const response = await fetch(`https://api.github.com/repos/${project.repo}`, {
			headers: {
				Accept: 'application/vnd.github+json',
				...(token ? { Authorization: `Bearer ${token}` } : {}),
			},
			signal: AbortSignal.timeout(3000),
		});
		if (!response.ok) return project;
		const data = await response.json() as GitHubRepository;
		return {
			...project,
			stars: data.stargazers_count,
			language: data.language ?? project.language,
			updatedAt: data.updated_at,
		};
	} catch {
		return project;
	}
}
