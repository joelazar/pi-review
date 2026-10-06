export type DraftComment = { finding: number; path?: string; line?: number; startLine?: number; body: string };
export type DraftResponse = { body: string; comments: DraftComment[] };
export type AnchorKind = "line" | "file" | "body";
export type DiffFiles = Map<string, Array<[number, number]>>;

/**
 * Parse the model's drafting reply. Throws on anything that is not the expected JSON.
 */
export function parseDraftResponse(text: string): DraftResponse {
	const json = text.trim().replace(/^```(?:json)?\s*\n([\s\S]*)\n```$/, "$1");
	const data = JSON.parse(json) as DraftResponse;
	if (typeof data.body !== "string" || !Array.isArray(data.comments)) {
		throw new Error("Draft JSON must have a string `body` and a `comments` array");
	}
	for (const comment of data.comments) {
		if (typeof comment.body !== "string" || typeof comment.finding !== "number") {
			throw new Error(`Draft comment needs a numeric \`finding\` and a string \`body\`: ${JSON.stringify(comment)}`);
		}
	}
	return data;
}

/**
 * RIGHT-side line ranges per file from a unified diff. Deleted files map to no ranges.
 */
export function parseDiffHunks(diff: string): DiffFiles {
	const files: DiffFiles = new Map();
	let ranges: Array<[number, number]> | null = null;
	let oldPath: string | null = null;
	for (const line of diff.split("\n")) {
		if (line.startsWith("diff --git ")) {
			ranges = null;
			oldPath = null;
		} else if (line.startsWith("--- ") && !ranges) {
			oldPath = line.startsWith("--- a/") ? line.slice(6) : null;
		} else if (line.startsWith("+++ ") && !ranges) {
			const newPath = line.startsWith("+++ b/") ? line.slice(6) : oldPath;
			if (!newPath) continue;
			ranges = [];
			files.set(newPath, ranges);
		} else if (ranges) {
			const hunk = line.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/);
			if (!hunk) continue;
			const start = Number(hunk[1]);
			const count = hunk[2] === undefined ? 1 : Number(hunk[2]);
			if (count > 0) ranges.push([start, start + count - 1]);
		}
	}
	return files;
}

export function classifyAnchor(files: DiffFiles, comment: DraftComment): AnchorKind {
	if (!comment.path || !files.has(comment.path)) return "body";
	if (comment.line === undefined) return "file";
	const start = comment.startLine ?? comment.line;
	const inHunk = files.get(comment.path)!.some(([from, to]) => start >= from && comment.line! <= to);
	return inHunk ? "line" : "file";
}

/** The first fenced block after `**Current:**` in a finding body. */
export function extractCurrentBlock(findingBody: string): { lang: string; code: string } | null {
	const match = findingBody.match(/\*\*Current:\*\*\s*\n\s*```(\w*)\n([\s\S]*?)\n\s*```/);
	return match ? { lang: match[1], code: match[2] } : null;
}

const normalize = (text: string) => text.split("\n").map((line) => line.trimEnd()).join("\n").replace(/^\n+|\n+$/g, "");

/**
 * Keep ```suggestion blocks only when the anchored lines at HEAD equal the finding's
 * Current block; otherwise turn them into plain code blocks in the file's language.
 */
export function guardSuggestion(
	comment: DraftComment,
	kind: AnchorKind,
	fileText: string | null,
	current: { lang: string; code: string } | null,
): string {
	if (!comment.body.includes("```suggestion")) return comment.body;
	const lang = current?.lang || (comment.path ? (comment.path.split(".").pop() ?? "") : "");
	if (kind === "line" && fileText !== null && current && comment.line !== undefined) {
		const start = comment.startLine ?? comment.line;
		const anchored = fileText.split("\n").slice(start - 1, comment.line).join("\n");
		if (normalize(anchored) === normalize(current.code)) return comment.body;
	}
	return comment.body.replaceAll("```suggestion", `\`\`\`${lang}`);
}
