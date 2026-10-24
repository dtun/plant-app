import { APICallError, RetryError } from "ai";
import { describe, expect, it } from "vitest";

import { createRevenueCatVerifier } from "./entitlements";
import { createFakeProvider, createFakeVerifier } from "./fakes";
import { createAIHandlers } from "./handlers";
import type { ProviderMessage } from "./provider";
import { APP_USER_ID, postRequest } from "./test-helpers";

const PLANT_BODY = { plant: { description: "A leafy fern", size: "Small" as const } };
const IMAGE_BODY = { imageBase64: "AAAA/+bbbb==" };
const CHAT_BODY = {
  plantContext: { name: "Fernie", description: "Boston fern", aiAnalysis: "Likes humidity" },
  messages: [{ role: "user" as const, content: "How are you?" }],
};

const SINGLE_OPERATIONS = [
  { operation: "name", body: PLANT_BODY },
  { operation: "photo", body: IMAGE_BODY },
] as const;

const ALL_OPERATIONS = [...SINGLE_OPERATIONS, { operation: "chat", body: CHAT_BODY }] as const;

function setup(verdict: Parameters<typeof createFakeVerifier>[0], script = {}) {
  let verifier = createFakeVerifier(verdict);
  let provider = createFakeProvider(script);
  return { verifier, provider, handlers: createAIHandlers({ verifier, provider }) };
}

function textOf(message: ProviderMessage | undefined): string {
  if (!message) {
    return "";
  }
  if (typeof message.content === "string") {
    return message.content;
  }
  return message.content.map((part) => (part.type === "text" ? part.text : "")).join("\n");
}

describe("entitled single-result operations", () => {
  it("returns the generated plant name, trimmed, using the text tier", async () => {
    let { handlers, provider, verifier } = setup("entitled", { text: "  Fernie\n" });

    let response = await handlers.name(postRequest({ ...PLANT_BODY, avoidNames: ["Mossy"] }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ name: "Fernie" });
    expect(verifier.calls).toEqual([APP_USER_ID]);
    expect(provider.calls).toHaveLength(1);
    expect(provider.calls[0].tier).toBe("text");
    let prompt = textOf(provider.calls[0].messages[0]);
    expect(prompt).toContain("A leafy fern");
    expect(prompt).toContain("Mossy");
  });

  it("returns the photo description using the vision tier and sends the image", async () => {
    let { handlers, provider } = setup("entitled", { text: "Long, arching fronds." });

    let response = await handlers.photo(postRequest(IMAGE_BODY));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ description: "Long, arching fronds." });
    expect(provider.calls[0].tier).toBe("vision");
    let content = provider.calls[0].messages[0].content;
    expect(content).toContainEqual(
      expect.objectContaining({ type: "image", image: "AAAA/+bbbb==" })
    );
  });

  it.each(SINGLE_OPERATIONS)("treats an empty $operation result as a failure", async (op) => {
    let { handlers } = setup("entitled", { text: "   " });

    let response = await handlers[op.operation](postRequest(op.body));

    expect(response.status).toBe(500);
    expect((await response.json()).error.kind).toBe("unknown");
  });
});

describe("chat tier selection", () => {
  it("uses the text tier for text-only chat and puts the plant profile in the system prompt", async () => {
    let { handlers, provider } = setup("entitled", { chunks: ["Hi"] });

    await (await handlers.chat(postRequest(CHAT_BODY))).text();

    expect(provider.calls[0].tier).toBe("text");
    expect(provider.calls[0].system).toContain("You are Fernie");
    expect(provider.calls[0].system).toContain("Likes humidity");
    expect(provider.calls[0].messages).toEqual([{ role: "user", content: "How are you?" }]);
  });

  it("uses the vision tier when any message carries an image", async () => {
    let { handlers, provider } = setup("entitled", { chunks: ["Hi"] });
    let body = {
      ...CHAT_BODY,
      messages: [
        { role: "user" as const, content: "Look at my leaf", imageBase64: "AAAA" },
        { role: "assistant" as const, content: "Nice leaf" },
        { role: "user" as const, content: "Thanks" },
      ],
    };

    await (await handlers.chat(postRequest(body))).text();

    expect(provider.calls[0].tier).toBe("vision");
    expect(provider.calls[0].messages[0]).toEqual({
      role: "user",
      content: [
        { type: "text", text: "Look at my leaf" },
        { type: "image", image: "AAAA", mediaType: "image/jpeg" },
      ],
    });
    expect(provider.calls[0].messages[1]).toEqual({ role: "assistant", content: "Nice leaf" });
  });
});

describe("entitlement gate", () => {
  it.each(ALL_OPERATIONS)("refuses an unentitled $operation request with 402", async (op) => {
    let { handlers, provider, verifier } = setup("not-entitled", { text: "x", chunks: ["x"] });

    let response = await handlers[op.operation](postRequest(op.body));

    expect(response.status).toBe(402);
    expect(response.headers.get("Content-Type")).toContain("application/json");
    expect((await response.json()).error.kind).toBe("subscription-required");
    expect(verifier.calls).toEqual([APP_USER_ID]);
    expect(provider.calls).toEqual([]);
  });

  it.each(ALL_OPERATIONS)("refuses a $operation request with no user id header", async (op) => {
    let { handlers, provider, verifier } = setup("entitled", { text: "x", chunks: ["x"] });

    let response = await handlers[op.operation](postRequest(op.body, {}));

    expect(response.status).toBe(402);
    expect((await response.json()).error.kind).toBe("subscription-required");
    expect(verifier.calls).toEqual([]);
    expect(provider.calls).toEqual([]);
  });

  it.each(ALL_OPERATIONS)(
    "reports 502 network when the verifier is unreachable for $operation",
    async (op) => {
      let { handlers, provider } = setup("network", { text: "x", chunks: ["x"] });

      let response = await handlers[op.operation](postRequest(op.body));

      expect(response.status).toBe(502);
      expect((await response.json()).error.kind).toBe("network");
      expect(provider.calls).toEqual([]);
    }
  );

  it("reports 500 unknown when the verifier itself is misconfigured", async () => {
    let { handlers, provider } = setup("error", { text: "x" });

    let response = await handlers.name(postRequest(PLANT_BODY));

    expect(response.status).toBe(500);
    expect((await response.json()).error.kind).toBe("unknown");
    expect(provider.calls).toEqual([]);
  });

  it("checks entitlement before it looks at the body", async () => {
    let { handlers } = setup("not-entitled");

    let response = await handlers.name(postRequest("{not json"));

    expect(response.status).toBe(402);
  });
});

describe("invalid bodies", () => {
  it.each(ALL_OPERATIONS)("rejects malformed JSON for $operation with 400", async (op) => {
    let { handlers, provider } = setup("entitled");

    let response = await handlers[op.operation](postRequest("{not json"));

    expect(response.status).toBe(400);
    expect((await response.json()).error.kind).toBe("unknown");
    expect(provider.calls).toEqual([]);
  });

  it("names the offending fields without echoing their values", async () => {
    let { handlers, provider } = setup("entitled");

    let response = await handlers.name(
      postRequest({ plant: { description: "Fern", size: "Gigantic" } })
    );

    expect(response.status).toBe(400);
    let { error } = await response.json();
    expect(error.message).toContain("plant.size");
    expect(error.message).not.toContain("Gigantic");
    expect(provider.calls).toEqual([]);
  });

  it.each([
    ["a URL", "https://example.com/leaf.jpg"],
    ["a data URI", "data:image/jpeg;base64,AAAA"],
    ["an empty string", ""],
  ])("rejects an image sent as %s", async (_label, imageBase64) => {
    let { handlers, provider } = setup("entitled");

    let photo = await handlers.photo(postRequest({ imageBase64 }));
    let chat = await handlers.chat(
      postRequest({ ...CHAT_BODY, messages: [{ role: "user", content: "hi", imageBase64 }] })
    );

    expect(photo.status).toBe(400);
    expect(chat.status).toBe(400);
    expect(provider.calls).toEqual([]);
  });

  it("rejects a chat with no messages", async () => {
    let { handlers } = setup("entitled");

    let response = await handlers.chat(postRequest({ ...CHAT_BODY, messages: [] }));

    expect(response.status).toBe(400);
  });
});

describe("provider failures on single-result operations", () => {
  function apiError(statusCode?: number) {
    return new APICallError({
      message: "upstream failure",
      url: "https://provider.example/v1",
      requestBodyValues: {},
      statusCode,
    });
  }

  it.each([
    ["a 429 from the provider", apiError(429), 429, "quota"],
    ["a 402 from the provider", apiError(402), 429, "quota"],
    ["a connection failure", apiError(undefined), 502, "network"],
    ["a bare fetch TypeError", new TypeError("fetch failed"), 502, "network"],
    ["a 401 from the provider", apiError(401), 500, "unknown"],
    ["a 403 from the provider", apiError(403), 500, "unknown"],
    ["a 500 from the provider", apiError(500), 500, "unknown"],
    ["an arbitrary error", new Error("boom"), 500, "unknown"],
    [
      "a 429 after the SDK exhausted its retries",
      new RetryError({
        message: "Failed after 3 attempts",
        reason: "maxRetriesExceeded",
        errors: [apiError(429)],
      }),
      429,
      "quota",
    ],
    [
      "a connection failure after the SDK exhausted its retries",
      new RetryError({
        message: "Failed after 3 attempts",
        reason: "maxRetriesExceeded",
        errors: [apiError(undefined)],
      }),
      502,
      "network",
    ],
  ])("maps %s", async (_label, error, status, kind) => {
    for (let { operation, body } of SINGLE_OPERATIONS) {
      let { handlers } = setup("entitled", { error });

      let response = await handlers[operation](postRequest(body));

      expect(response.status).toBe(status);
      expect((await response.json()).error.kind).toBe(kind);
    }
  });
});

describe("secret handling", () => {
  const SECRET = "sk-secret-do-not-leak";

  const LEAKY_ERRORS = [
    new APICallError({
      message: `Incorrect API key provided: ${SECRET}`,
      url: "https://provider.example/v1",
      requestBodyValues: { apiKey: SECRET },
      statusCode: 401,
      responseBody: JSON.stringify({ error: SECRET }),
    }),
    new APICallError({
      message: `Rate limited for ${SECRET}`,
      url: "https://provider.example/v1",
      requestBodyValues: {},
      statusCode: 429,
      responseBody: SECRET,
    }),
    new TypeError(`fetch failed for ${SECRET}`),
    new Error(`boom ${SECRET}`),
  ];

  it.each(LEAKY_ERRORS.map((error) => [error.name, error] as const))(
    "never puts provider error detail (%s) in a response",
    async (_name, error) => {
      for (let { operation, body } of ALL_OPERATIONS) {
        let { handlers } = setup("entitled", { error });

        let response = await handlers[operation](postRequest(body));

        expect(await response.text()).not.toContain(SECRET);
      }
    }
  );

  it("never puts the RevenueCat secret in a response, even when the verifier call fails", async () => {
    let provider = createFakeProvider({ text: "x" });
    let failures = [
      async function throwing(): Promise<Response> {
        throw new Error(`socket hang up, Authorization: Bearer ${SECRET}`);
      },
      async function unauthorized(): Promise<Response> {
        return new Response(`bad key ${SECRET}`, { status: 401 });
      },
      async function unavailable(): Promise<Response> {
        return new Response(`down ${SECRET}`, { status: 503 });
      },
    ];

    for (let failingFetch of failures) {
      let verifier = createRevenueCatVerifier({ secretKey: SECRET, fetch: failingFetch });
      let handlers = createAIHandlers({ verifier, provider });

      let response = await handlers.name(postRequest(PLANT_BODY));

      expect(response.status).toBeGreaterThanOrEqual(500);
      expect(await response.text()).not.toContain(SECRET);
    }
    expect(provider.calls).toEqual([]);
  });
});
