type PublicationData = {
	draft?: boolean;
	archived?: boolean;
};

export function isPublishedPost({ data }: { data: PublicationData }) {
	return data.draft !== true && data.archived !== true;
}
