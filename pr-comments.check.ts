import assert from "node:assert/strict";
import { classifyAnchor, extractCurrentBlock, guardSuggestion, parseDiffHunks, parseDraftResponse } from "./pr-comments.ts";

const diff = `diff --git a/src/a.ts b/src/a.ts
index 1..2 100644
--- a/src/a.ts
+++ b/src/a.ts
@@ -1,3 +10,4 @@ fn
 x
@@ -40,2 +50,0 @@
diff --git a/gone.ts b/gone.ts
deleted file mode 100644
--- a/gone.ts
+++ /dev/null
@@ -1,2 +0,0 @@
`;
const files = parseDiffHunks(diff);
assert.deepEqual(files.get("src/a.ts"), [[10, 13]]);
assert.deepEqual(files.get("gone.ts"), []);

assert.equal(classifyAnchor(files, { finding: 1, path: "src/a.ts", startLine: 11, line: 12, body: "" }), "line");
assert.equal(classifyAnchor(files, { finding: 1, path: "src/a.ts", line: 30, body: "" }), "file");
assert.equal(classifyAnchor(files, { finding: 1, path: "src/a.ts", startLine: 9, line: 11, body: "" }), "file");
assert.equal(classifyAnchor(files, { finding: 1, path: "gone.ts", line: 1, body: "" }), "file");
assert.equal(classifyAnchor(files, { finding: 1, path: "other.ts", line: 1, body: "" }), "body");
assert.equal(classifyAnchor(files, { finding: 1, body: "" }), "body");

const current = extractCurrentBlock("**Problem:** p\n\n**Current:**\n```ts\n  const a = 1;\n  const b = 2;\n```\n\n**Fix:**\n```ts\nx\n```");
assert.deepEqual(current, { lang: "ts", code: "  const a = 1;\n  const b = 2;" });
const fileText = "l1\n  const a = 1;\n  const b = 2;\nl4";
const comment = { finding: 1, path: "src/a.ts", startLine: 2, line: 3, body: "fix:\n```suggestion\nconst c = 3;\n```" };
assert.equal(guardSuggestion(comment, "line", fileText, current), comment.body);
assert.equal(guardSuggestion({ ...comment, startLine: 1 }, "line", fileText, current), "fix:\n```ts\nconst c = 3;\n```");
assert.equal(guardSuggestion(comment, "file", fileText, current), "fix:\n```ts\nconst c = 3;\n```");

assert.deepEqual(parseDraftResponse('```json\n{"body":"b","comments":[]}\n```'), { body: "b", comments: [] });
assert.throws(() => parseDraftResponse("not json"));
assert.throws(() => parseDraftResponse('{"body":1,"comments":[]}'));

console.log("pr-comments check ok");
