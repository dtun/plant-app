import { createLocalIntelligence } from "./local-intelligence";
import type { PlantData } from "./types";

let storage: Map<string, string>;

let plantData: PlantData = {
  plantType: "Succulent",
  description: "Small green plant",
};

interface RecordedRequest {
  url: string;
  headers: Record<string, string>;
  body: unknown;
}

interface FakeNetwork {
  fetch: typeof globalThis.fetch;
  requests: RecordedRequest[];
}

interface FakeNetworkRoutes {
  config?: () => Response;
  provider?: () => Response | Promise<Response>;
}

function createFakeNetwork(routes: FakeNetworkRoutes = {}): FakeNetwork {
  let requests: RecordedRequest[] = [];

  async function fakeFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    let url = String(input);
    let body = typeof init?.body === "string" ? JSON.parse(init.body) : init?.body;
    requests.push({ url, headers: Object.fromEntries(new Headers(init?.headers)), body });

    if (url === "https://www.keeptend.com/api/config") {
      return routes.config?.() ?? new Response("{}", { status: 404 });
    }
    if (url.startsWith("https://api.anthropic.com/")) {
      if (!routes.provider) throw new Error("unexpected provider request");
      return routes.provider();
    }
    throw new Error(`unexpected request to ${url}`);
  }

  return { fetch: fakeFetch, requests };
}

function providerText(text: string): Response {
  return Response.json({
    id: "msg_1",
    type: "message",
    role: "assistant",
    content: [{ type: "text", text }],
    usage: { input_tokens: 1, output_tokens: 1 },
  });
}

function providerError(status: number, message: string, headers?: HeadersInit): Response {
  return Response.json(
    { type: "error", error: { type: "api_error", message } },
    { status, headers }
  );
}

let retryNow = { "retry-after-ms": "0" };

function setUserConfig() {
  storage.set("ai_user_api_key", "test-key");
  storage.set("ai_user_provider", "Anthropic");
}

beforeEach(() => {
  storage = new Map();
  (globalThis as { localStorage: unknown }).localStorage = {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => {
      storage.set(key, value);
    },
    removeItem: (key: string) => {
      storage.delete(key);
    },
  };
  delete process.env.EXPO_PUBLIC_DEFAULT_AI_API_KEY;
  delete process.env.EXPO_PUBLIC_DEFAULT_AI_PROVIDER;
});

test("generatePlantName returns no-config failure when no AI config can be resolved", async () => {
  let network = createFakeNetwork();
  let intel = createLocalIntelligence({ fetch: network.fetch });

  let result = await intel.generatePlantName(plantData);

  expect(result.ok).toBe(false);
  if (result.ok) return;
  expect(result.failure.kind).toBe("no-config");
  expect(result.failure.message).toMatch(/AI configuration not found/);
});

test("generatePlantName falls back to the config endpoint and signs the request with its key", async () => {
  let network = createFakeNetwork({
    config: () => Response.json({ apiKey: "endpoint-key", provider: "Anthropic" }),
    provider: () => providerText("Leafy"),
  });
  let intel = createLocalIntelligence({ fetch: network.fetch });

  let result = await intel.generatePlantName(plantData);

  expect(result).toEqual({ ok: true, value: "Leafy" });
  let providerRequest = network.requests.find((r) =>
    r.url.startsWith("https://api.anthropic.com/")
  );
  expect(providerRequest?.headers["x-api-key"]).toBe("endpoint-key");
});

test.each([401, 403])(
  "generatePlantName maps a %i response to invalid-key failure",
  async (status) => {
    setUserConfig();
    let network = createFakeNetwork({ provider: () => providerError(status, "denied") });
    let intel = createLocalIntelligence({ fetch: network.fetch });

    let result = await intel.generatePlantName(plantData);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.failure.kind).toBe("invalid-key");
  }
);

test("generatePlantName maps a 402 response to quota failure", async () => {
  setUserConfig();
  let network = createFakeNetwork({ provider: () => providerError(402, "payment required") });
  let intel = createLocalIntelligence({ fetch: network.fetch });

  let result = await intel.generatePlantName(plantData);

  expect(result.ok).toBe(false);
  if (result.ok) return;
  expect(result.failure.kind).toBe("quota");
});

test("generatePlantName maps a connection failure to network failure", async () => {
  setUserConfig();
  let network = createFakeNetwork({
    provider: () => {
      throw new TypeError("Network request failed");
    },
  });
  let intel = createLocalIntelligence({ fetch: network.fetch });

  let result = await intel.generatePlantName(plantData);

  expect(result.ok).toBe(false);
  if (result.ok) return;
  expect(result.failure.kind).toBe("network");
});

test("generatePlantName maps an unrecognized provider error to unknown failure with its detail", async () => {
  setUserConfig();
  let network = createFakeNetwork({ provider: () => providerError(400, "something exploded") });
  let intel = createLocalIntelligence({ fetch: network.fetch });

  let result = await intel.generatePlantName(plantData);

  expect(result.ok).toBe(false);
  if (result.ok) return;
  expect(result.failure.kind).toBe("unknown");
  expect(result.failure.message).toContain("something exploded");
});

test("generatePlantName returns ok result with trimmed text on success", async () => {
  setUserConfig();
  let network = createFakeNetwork({ provider: () => providerText("  Leafy  ") });
  let intel = createLocalIntelligence({ fetch: network.fetch });

  let result = await intel.generatePlantName(plantData);

  expect(result.ok).toBe(true);
  if (!result.ok) return;
  expect(result.value).toBe("Leafy");
});

test("generateChatResponse sends the image to the provider as a base64 jpeg", async () => {
  setUserConfig();
  let network = createFakeNetwork({ provider: () => providerText("Hello!") });
  let intel = createLocalIntelligence({ fetch: network.fetch });

  let result = await intel.generateChatResponse({
    plantContext: { name: "Fern" },
    messages: [
      { role: "user", content: "What am I?", imageUri: "file://x.jpg", imageBase64: "abc123" },
    ],
  });

  expect(result).toEqual({ ok: true, value: "Hello!" });
  let sent = network.requests.find((r) => r.url.startsWith("https://api.anthropic.com/"))?.body as {
    messages: { content: unknown[] }[];
  };
  expect(sent.messages[0].content).toContainEqual({
    type: "image",
    source: { type: "base64", media_type: "image/jpeg", data: "abc123" },
  });
});

test("generatePlantName maps a rate-limited response that exhausts retries to quota failure", async () => {
  setUserConfig();
  let network = createFakeNetwork({ provider: () => providerError(429, "slow down", retryNow) });
  let intel = createLocalIntelligence({ fetch: network.fetch });

  let result = await intel.generatePlantName(plantData);

  expect(result.ok).toBe(false);
  if (result.ok) return;
  expect(result.failure.kind).toBe("quota");
});

test("generatePlantName maps a server error that exhausts retries to unknown failure with its detail", async () => {
  setUserConfig();
  let network = createFakeNetwork({ provider: () => providerError(500, "kaboom", retryNow) });
  let intel = createLocalIntelligence({ fetch: network.fetch });

  let result = await intel.generatePlantName(plantData);

  expect(result.ok).toBe(false);
  if (result.ok) return;
  expect(result.failure.kind).toBe("unknown");
  expect(result.failure.message).toContain("kaboom");
});

test("generatePlantName maps a connection failure that exhausts retries to network failure", async () => {
  jest.useFakeTimers();
  try {
    setUserConfig();
    let network = createFakeNetwork({
      provider: () => {
        throw new TypeError("fetch failed", { cause: new Error("ECONNREFUSED") });
      },
    });
    let intel = createLocalIntelligence({ fetch: network.fetch });

    let pending = intel.generatePlantName(plantData);
    await jest.advanceTimersByTimeAsync(10_000);
    let result = await pending;

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.failure.kind).toBe("network");
  } finally {
    jest.useRealTimers();
  }
});
