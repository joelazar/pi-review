# pi-review

`pi-review` adds a practical code review workflow to Pi via `/review` and `/end-review`
that is used by us at Earendil.

## Install

```bash
pi install git:github.com/earendil-works/pi-review
```

## What It Does

- Review **uncommitted changes**
- Review changes against a **base branch**
- Review a specific **commit**
- Review a GitHub **pull request** (checks it out locally via `gh`)
- Review one or more **folders/files** as a snapshot (not a diff)
- Produce prioritized findings with a clear verdict and actionable follow-ups
- It separates feedback to the agent from human callouts
- Review on a second **spec axis**: does the change do what the ticket asked for?

## Two axes

Findings are reported under two headings that are deliberately kept separate, since one
can pass while the other fails:

- **Findings** — defects, security, fail-fast error handling, clean code, and a baseline of
  Fowler design smells (Feature Envy, Data Clumps, Speculative Generality, …) tagged as
  judgement calls.
- **Spec** — missing or partial requirements, scope creep, and requirements implemented
  incorrectly, each quoting the spec line it came from.

The spec is discovered automatically from Linear issue keys (`ENG-123`) and GitHub issue
refs (`#123`) in the branch name and commit messages, plus the PR description in PR mode.
Linear issues are fetched with `linear issue describe`, GitHub issues with `gh issue view`.
If nothing is found the Spec section reports `(no spec available)` rather than inventing one.

## Project standards

Walking up from the working directory to the repo root, these files are picked up and
appended to the prompt as standards that override the built-in rubric:

`REVIEW_GUIDELINES.md`, `CODING_STANDARDS.md`, `CONTRIBUTING.md`, `AGENTS.md`

The review target is also validated up front (ref resolves, diff is non-empty, paths exist),
so a typo fails immediately instead of halfway through a turn.

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

When a review session is active, finish it with:

```bash
/end-review
```

You can then return only, return + summarize, or return + queue fixing work.

Choosing "Return and fix findings" opens a picker of the findings parsed from the review
report: a checkbox list on the left, the full finding (problem, current code, suggested
fix, impact) rendered on the right, taking up half the terminal height. `j`/`k` (or `↑↓`)
move, `space` toggles, `a`/`n` select all/none, `←→` page the detail pane, `enter` confirms. Only the checked findings are handed to the
follow-up fix turn.
