# KeepTend PR review

You are reviewing a pull request against the KeepTend monorepo. The PR branch is checked out in the working directory.

## Before reading the diff

Read these files first; they are the source of truth for what this review checks. Do not skip them.

- `CLAUDE.md` — development guide (declarations, AI seam, i18n, providers, LiveStore, workflow).
- `CONTEXT.md` — why the app exists and the domain glossary (`PlantIntelligence`, `PhotoPicker`).
- `docs/adr/*.md` — accepted architecture decisions. ADR-0001 covers LiveStore event sourcing; ADR-0002 covers `let`/`const`/`function`.

Then get the diff with `gh pr diff` and read any changed file in full where the diff alone is ambiguous.

## What to check

Review the changed code against the conventions in those documents. In particular:

1. **Declarations (ADR-0002).** `let` by default; `const` only for true constants. Mutation counts as change: a value that is pushed to or has properties written is `let`, even if never reassigned. Functions use the `function` keyword; an arrow assigned to a variable needs a stated technical reason.
2. **Internationalization.** Every user-facing string goes through Lingui (`useLingui` + `` t`…` ``, `<Trans>`, or `msg` + `i18n._()` in utilities). Zod schemas that use `t` live inside components under `useMemo` keyed on `[t]`.
3. **PlantIntelligence seam.** Anything AI-shaped goes through the `PlantIntelligence` interface. No provider names, model names, or API keys outside `apps/mobile/src/intelligence/`. Failures cross the seam as a typed `AIFailure`, never as thrown errors.
4. **Context providers.** Contexts live in `apps/mobile/contexts/` and follow `{Name}Provider` + `use{Name}()`.
5. **LiveStore event sourcing (ADR-0001).** New persistent state follows Events → Tables → Materializers in `apps/mobile/src/livestore/schema.ts`; reactive query factories carry a `$` suffix in `queries.ts`; writes go through `store.commit(events.…)`, never direct table writes. Shipped events are immutable — evolve with a new versioned event, never by editing an old one.

Also flag anything that is clearly a bug, a broken test, or a change that contradicts the intent stated in the PR description.

## What not to do

- Do not restate the conventions. Cite them by document and section when a finding depends on one.
- Do not comment on formatting, import order, or anything Prettier and ESLint already enforce.
- Do not pad the review with praise or summaries of what the PR does.
- Do not propose rewrites beyond the change under review.

## How to report

Post the review on the pull request:

- Use inline comments (`mcp__github_inline_comment__create_inline_comment`) for findings tied to specific lines.
- Post one top-level comment (`gh pr comment`) summarizing the findings, in this shape:
  - A list of findings, each with `path:line`, a severity (**blocker**, **should-fix**, or **nit**), a one-sentence explanation, and the convention it relates to.
  - If there are no findings, say so explicitly: "No findings against the KeepTend conventions."

Be concise. A short review with a few concrete findings is worth more than a long one.
