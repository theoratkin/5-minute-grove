export interface TaskTitlePart {
	type: 'text' | 'hashtag';
	value: string;
}

const HASHTAG_PATTERN = /(^|\s)(#[\p{L}\p{M}\p{N}][\p{L}\p{M}\p{N}_]*)/gu;

export function parseTaskTitle(title: string): TaskTitlePart[] {
	const parts: TaskTitlePart[] = [];
	let cursor = 0;

	for (const match of title.matchAll(HASHTAG_PATTERN)) {
		const boundary = match[1];
		const hashtag = match[2];
		const hashtagStart = (match.index ?? 0) + boundary.length;

		if (hashtagStart > cursor) {
			parts.push({ type: 'text', value: title.slice(cursor, hashtagStart) });
		}
		parts.push({ type: 'hashtag', value: hashtag });
		cursor = hashtagStart + hashtag.length;
	}

	if (cursor < title.length) parts.push({ type: 'text', value: title.slice(cursor) });
	return parts.length > 0 ? parts : [{ type: 'text', value: title }];
}

export function extractTaskHashtags(title: string): string[] {
	return [
		...new Set(
			parseTaskTitle(title)
				.filter((part) => part.type === 'hashtag')
				.map((part) => part.value.slice(1).normalize('NFKC').toLowerCase())
		)
	];
}
