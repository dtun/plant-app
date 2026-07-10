# ADR-0002: let by default, const only for true constants

- **Status:** Accepted (backfilled)
- **Date:** 2026-07-09

## Context

JavaScript's `const` prevents _reassignment_, not _mutation_ — `const items = []; items.push(1)` is legal. Under the ecosystem-standard `prefer-const`, seeing `const` therefore tells the reader nothing about whether the value changes. This repo inverts that norm, which makes the convention look like an oversight to fix. It isn't.

## Decision

Declaration keywords signal **mutability of the value**, not reassignment of the binding:

- `let` for anything that changes — reassignment _or_ mutation — even when the reference never changes.
- `const` only for true constants, so it reads as "never changes, in any sense."
- Functions use the `function` keyword; assigning arrows or function expressions to variables needs a stated technical reason.

```javascript
let items = []; // will be mutated — let, despite no reassignment
const MAX_RETRIES = 3; // true constant
function processData() {} // not: const processData = () => {}
```

## Enforcement

`eslint.config.js` sets `func-style: ["error", "declaration"]` and disables `prefer-const` — never re-enable it or apply its autofix. The let-for-mutated-values rule isn't machine-checkable; it lives in `AGENTS.md`.

## Consequences

- `const` becomes a strong claim readers can trust.
- Copied snippets and generated code arrive `const`-heavy and need adjusting (generated Lingui files are exempt via their `eslint-disable` headers).
