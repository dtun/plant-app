# ADR-0003: Adapter tests fake the network through an injected `fetch`

- **Status:** Accepted
- **Date:** 2026-10-24

## Context

Network adapters sit behind seams such as PlantIntelligence (see `CONTEXT.md`). Today LocalIntelligence is the only one. RemoteIntelligence (#53) will be the second. Its tests need a way to fake HTTP. Without a rule, each adapter would invent its own.

The LocalIntelligence test used to stub the AI SDK's `generateText` and hand-build `APICallError` instances. That never checked failure mapping against the errors the SDK actually produces from real status codes.

The spike in #58 (PR #68) tested two ways to fix that under jest-expo:

- **MSW v2.** Interception works, and needs no polyfills or custom environment. Loading it needs three Jest config entries. One is a `moduleNameMapper` for `msw/node`, because MSW's `exports` map sets `"react-native": null` and the React Native test environment hardcodes the `react-native` export condition. One is a `transformIgnorePatterns` override, which replaces jest-expo's allowlist with a hand-copied one plus MSW's ESM-only dependencies. One is a `.mjs` transform. The allowlist follows MSW's internal dependency graph, so an MSW upgrade can break the suite at parse time. The dependency also adds about 400 lockfile lines.
- **Injected `fetch`.** `createAnthropic({ apiKey, fetch })` with a fake that returns `new Response(..., { status: 401 })` yields a genuine `APICallError` with `statusCode` 401 through the real SDK path. It needs no dependency and no config.

The spike said to reconsider MSW once a second network surface appears. RemoteIntelligence is that surface, and it does not change the answer. It calls our own server with plain `fetch` and no provider SDK, so injection fits it even better than it fits LocalIntelligence. MSW's routing would save each test file one small URL switch. That does not pay for a config that breaks on upgrades.

## Decision

Each network adapter's factory takes an optional `fetch`, and every request the adapter makes goes through it:

```ts
export interface LocalIntelligenceOptions {
  fetch?: typeof globalThis.fetch;
}

export function createLocalIntelligence(options: LocalIntelligenceOptions = {}): PlantIntelligence;
```

- Production wiring passes nothing. An omitted `fetch` means the global `fetch`, resolved at call time, and SDK factories receive `undefined` so they use their own default.
- The adapter forwards `fetch` to every SDK client it creates (`createOpenAI`, `createAnthropic`) and uses it for its own requests too, such as config lookups and image reads.
- Adapter tests pass a hand-written fake `fetch` that routes by URL and returns real `Response` objects. They do not `jest.mock` the SDK, hand-build SDK errors, or assign `global.fetch`.
- Keep response fixtures inline in the test and as small as the SDK or contract accepts.

New adapters (RemoteIntelligence first) follow the same shape: an options object with an optional `fetch`.

**Layering rule.** This holds regardless of how HTTP is faked. Tests above a seam (components, contexts, screens) use that seam's fake adapter (`createFakeIntelligence`, `createFakeEntitlements`) and its test-swap hook (`__setPlantIntelligenceForTests`). They never fake HTTP. Only an adapter's own test touches the network layer.

## Consequences

- Failure mapping is tested against errors the real SDK raises from real status codes. The first run found a bug the `generateText` stub had hidden. The SDK retries 429s, 5xxs, and connection errors, then throws a `RetryError` that wraps the last `APICallError`. A real rate limit therefore mapped to `unknown` instead of `quota`.
- No MSW dependency, no Jest config to track MSW's internals, and no lockfile churn.
- A request the fake does not route fails in that test. A test that forgets to pass `fetch` falls through to Node's real `fetch`, which is the gap MSW's `onUnhandledRequest: "error"` would have closed. If that becomes a real risk, make `jest.setup.js` replace the global `fetch` with one that rejects.
- Revisit MSW if many test files need to share the same routed endpoints, or if a dependency that can't take a `fetch` starts making requests.
