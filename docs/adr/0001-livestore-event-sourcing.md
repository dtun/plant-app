# ADR-0001: Event-sourced storage via LiveStore

- **Status:** Accepted (backfilled — records a decision already shipped in the codebase)
- **Date:** 2026-07-09

## Context

KeepTend is a local-first mobile app: plants, chat messages, user accounts, and usage counts must work fully offline, with cloud sync across devices planned (the schema already carries `syncEnabled` and per-row `syncedAt`). A plain SQLite CRUD layer would make that future sync hard — concurrent edits on two devices have no principled merge, and every `UPDATE` destroys the history a merge would need.

## Decision

Persistent app data is stored via LiveStore's event-sourced architecture rather than direct table writes:

- All writes are events (`v1.PlantCreated`, `v1.MessageDeleted`, …) defined in `apps/mobile/src/livestore/schema.ts` and committed with `store.commit(events.…)` via `useStore()`.
- Materializers fold events into SQLite tables; screens read the tables through reactive query factories (`$`-suffixed, in `apps/mobile/src/livestore/queries.ts`) with `useQuery`.
- Deletes are soft (`deletedAt` columns), so the event log stays replayable and nothing is physically destroyed.
- Event names are versioned (`v1.`) so payloads can evolve by adding a `v2` event rather than mutating shipped history.

## Consequences

- Cross-device sync becomes an event-log exchange problem, which LiveStore's `Events.synced` is built for — no bespoke merge logic to write.
- Every state change is auditable and replayable (time-travel debugging).
- Schema evolution is append-only: a shipped event definition is immutable history. Changing what an event means or carries requires a new versioned event plus materializer, never editing or renaming the old one.
- All new entities must follow the Events → Tables → Materializers pattern; writing to tables directly would bypass the log and break replay, and is not allowed.
