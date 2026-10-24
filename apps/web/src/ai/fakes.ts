import type { EntitlementVerdict, EntitlementVerifier } from "./entitlements";
import type { ProviderClient, ProviderRequest } from "./provider";

export interface FakeVerifier extends EntitlementVerifier {
  calls: string[];
}

export function createFakeVerifier(verdict: EntitlementVerdict): FakeVerifier {
  let calls: string[] = [];
  return {
    calls,
    async verify(appUserId) {
      calls.push(appUserId);
      return verdict;
    },
  };
}

export interface FakeProviderScript {
  text?: string;
  chunks?: string[];
  error?: unknown;
}

export interface FakeProvider extends ProviderClient {
  calls: ProviderRequest[];
}

// `error` is thrown by generate immediately, and by stream after the chunks have been yielded.
export function createFakeProvider(script: FakeProviderScript = {}): FakeProvider {
  let calls: ProviderRequest[] = [];
  return {
    calls,
    async generate(request) {
      calls.push(request);
      if (script.error !== undefined) {
        throw script.error;
      }
      return script.text ?? "";
    },
    async *stream(request) {
      calls.push(request);
      yield* script.chunks ?? [];
      if (script.error !== undefined) {
        throw script.error;
      }
    },
  };
}
