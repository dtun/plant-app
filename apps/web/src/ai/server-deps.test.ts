import { afterEach, describe, expect, it, vi } from "vitest";

import { createServerHandlers } from "./server-deps";
import { postRequest } from "./test-helpers";

const VALID_ENV = {
  AI_PROVIDER: "OpenAI",
  AI_API_KEY: "sk-test-provider",
  REVENUECAT_SECRET_KEY: "sk_test_revenuecat",
};

const BODY = { plant: { description: "A fern" } };

afterEach(() => {
  vi.restoreAllMocks();
});

describe("createServerHandlers", () => {
  it.each([
    ["no env at all", {}],
    ["a missing provider key", { ...VALID_ENV, AI_API_KEY: undefined }],
    ["a missing RevenueCat key", { ...VALID_ENV, REVENUECAT_SECRET_KEY: undefined }],
    ["an unknown provider", { ...VALID_ENV, AI_PROVIDER: "Gemini" }],
  ])("answers every route with a generic 500 for %s", async (_label, env) => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    let handlers = createServerHandlers(env);

    for (let handler of [handlers.name, handlers.photo, handlers.chat]) {
      let response = await handler(postRequest(BODY));
      let text = await response.text();

      expect(response.status).toBe(500);
      expect(JSON.parse(text).error.kind).toBe("unknown");
      expect(text).not.toMatch(/AI_API_KEY|AI_PROVIDER|REVENUECAT/);
    }
  });

  it("accepts a complete env that leaves AI_PROVIDER unset", async () => {
    let handlers = createServerHandlers({ ...VALID_ENV, AI_PROVIDER: undefined });

    let response = await handlers.name(postRequest(BODY, {}));

    expect(response.status).toBe(402);
    expect((await response.json()).error.kind).toBe("subscription-required");
  });
});
