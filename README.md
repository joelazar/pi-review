# pi-review

`pi-review` adds a code review workflow to Pi via `/review` and `/end-review`.

This is a fork of [earendil-works/pi-review](https://github.com/earendil-works/pi-review).
On top of the original it adds a spec axis, project standards discovery, target
validation, a fixed finding shape, and a picker for choosing which findings to fix.

## Install

```bash
pi install git:github.com/joelazar/pi-review
```

## What it does

- Review uncommitted changes
- Review changes against a base branch
- Review a specific commit
- Review a GitHub pull request (checks it out locally via `gh`)
- Review one or more folders/files as a snapshot (not a diff)
- Produce prioritized findings with a verdict per axis and a separate list of human callouts
- Review on a second spec axis: does the change do what the ticket asked for?

## Quick usage

```bash
/review
/review uncommitted
/review branch main
/review commit abc123
/review pr 123
/review pr https://github.com/owner/repo/pull/123
/review folder src docs
/review branch main --extra "focus on performance and error handling"
```

`/review` with no arguments opens a selector. It preselects uncommitted changes when the
tree is dirty, the base branch when you are on a feature branch, and a commit otherwise.
The selector also lets you add or remove custom review instructions, which are stored in
the session and appended to every review. `--extra` adds a one-off instruction to a single
review.

In a session that already has messages, you choose between reviewing on an empty branch
or in the current session. Empty sessions always review on a fresh branch. `/end-review`
only applies to branch reviews.

Before the turn starts, the target is validated: the ref must resolve, the diff must be
non-empty, and folder paths must exist. A typo fails right away instead of halfway
through a model turn.

## Two axes

Findings are reported under two headings that stay separate, since one can pass while the
other fails, and each gets its own verdict.

`## Findings` covers defects, security, fail-fast error handling, clean code, and a
baseline of Fowler design smells (Feature Envy, Data Clumps, Speculative Generality, and
so on). Smells are labelled as judgement calls, never tagged above P2, and a documented
repo standard that endorses the pattern suppresses them.

`## Spec` covers requirements that are missing or partial, behaviour that was not asked
for, and requirements that look implemented but wrong. Each spec finding quotes the spec
line it came from.

The spec is discovered from the branch name and the commit messages in the reviewed
range. Linear keys (`ENG-123`) are fetched with `linear issue describe`, GitHub refs
(`#123`) with `gh issue view`, and in PR mode the PR description is included first. At
most three sources are used, each truncated to 8,000 characters. For uncommitted and
folder reviews only the branch name is scanned. If nothing is found the Spec section
reports `(no spec available)` instead of inventing one.

## Finding shape

Every finding on either axis has the same labelled parts, so the picker can parse them and
the fix turn gets code it can apply directly:

````markdown
### [P1] Short imperative title — `path/to/file.ts:42`

**Problem:** what breaks and when.

**Current:**
```ts
// the reviewed code, copied verbatim
```

**Fix:**
```ts
// concrete replacement code, same indentation
```

**Impact:** why it matters and in which scenario.
````

The Fix block is replaced with a one-line prose instruction when no code fix exists, for
example a missing requirement or a deletion.

## Project standards

Walking up from the working directory to the repo root (the first directory with `.git`
or `.pi`), these files are collected and appended to the prompt as standards that
override the built-in rubric:

`REVIEW_GUIDELINES.md`, `CODING_STANDARDS.md`, `CONTRIBUTING.md`, `AGENTS.md`

The first match for each filename wins. Each file is truncated to 12,000 characters, with
a note telling the model to read the rest from disk.

## Ending a review

```bash
/end-review
```

You can return only, return and summarize, or return and fix findings. Summarizing
produces a handoff with scope, verdict, the findings in their original shape, an ordered
fix queue, and the human callouts.

"Return and fix findings" opens a picker of the findings parsed from the review report.
The left side is a checkbox list, everything checked by default, with priority colours and
a `spec` tag for spec-axis findings. The right side renders the highlighted finding in
full. The picker takes half the terminal height.

Keys: `j`/`k` or `↑`/`↓` move, `space` toggles, `a`/`n` select all or none, `←`/`→` page
the detail pane, `enter` confirms, `esc` cancels.

Only the checked findings are handed to the follow-up fix turn, which is told to ignore
everything else in the summary. If the report has no parseable findings, the fix turn
works from the full summary instead.
