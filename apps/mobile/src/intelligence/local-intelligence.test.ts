jest.mock("ai", () => ({
  generateText: jest.fn(),
}));

jest.mock("@ai-sdk/openai", () => ({
  createOpenAI: () => () => ({ provider: "openai-stub" }),
}));

jest.mock("@ai-sdk/anthropic", () => ({
  createAnthropic: () => () => ({ provider: "anthropic-stub" }),
}));

import { generateText } from "ai";

import { createLocalIntelligence } from "./local-intelligence";
import type { PlantData } from "./types";

let mockGenerateText = generateText as jest.Mock;

let storage: Map<string, string>;

let plantData: PlantData = {
  plantType: "Succulent",
  description: "Small green plant",
};

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
  global.fetch = jest.fn().mockResolvedValue({
    ok: false,
    status: 404,
    statusText: "Not Found",
    json: async () => ({}),
  }) as unknown as typeof fetch;
  delete process.env.EXPO_PUBLIC_DEFAULT_AI_API_KEY;
  delete process.env.EXPO_PUBLIC_DEFAULT_AI_PROVIDER;
});

function setUserConfig() {
  storage.set("ai_user_api_key", "test-key");
  storage.set("ai_user_provider", "OpenAI");
}

test("generatePlantName returns no-config failure when no AI config can be resolved", async () => {
  let intel = createLocalIntelligence();

  let result = await intel.generatePlantName(plantData);

  expect(result.ok).toBe(false);
  if (result.ok) return;
  expect(result.failure.kind).toBe("no-config");
  expect(result.failure.message).toMatch(/AI configuration not found/);
});

test("generatePlantName maps 'API key' SDK errors to invalid-key failure", async () => {
  setUserConfig();
  mockGenerateText.mockRejectedValueOnce(new Error("Invalid API key provided"));
  let intel = createLocalIntelligence();

  let result = await intel.generatePlantName(plantData);

  expect(result.ok).toBe(false);
  if (result.ok) return;
  expect(result.failure.kind).toBe("invalid-key");
});

test("generatePlantName maps quota/billing SDK errors to quota failure", async () => {
  setUserConfig();
  mockGenerateText.mockRejectedValueOnce(new Error("You exceeded your current quota"));
  let intel = createLocalIntelligence();

  let result = await intel.generatePlantName(plantData);

  expect(result.ok).toBe(false);
  if (result.ok) return;
  expect(result.failure.kind).toBe("quota");
});

test("generatePlantName maps network/fetch SDK errors to network failure", async () => {
  setUserConfig();
  mockGenerateText.mockRejectedValueOnce(new Error("network request failed"));
  let intel = createLocalIntelligence();

  let result = await intel.generatePlantName(plantData);

  expect(result.ok).toBe(false);
  if (result.ok) return;
  expect(result.failure.kind).toBe("network");
});

test("generatePlantName maps unrecognized SDK errors to unknown failure", async () => {
  setUserConfig();
  mockGenerateText.mockRejectedValueOnce(new Error("something exploded"));
  let intel = createLocalIntelligence();

  let result = await intel.generatePlantName(plantData);

  expect(result.ok).toBe(false);
  if (result.ok) return;
  expect(result.failure.kind).toBe("unknown");
  expect(result.failure.message).toContain("something exploded");
});

test("generatePlantName returns ok result with trimmed text on success", async () => {
  setUserConfig();
  mockGenerateText.mockResolvedValueOnce({ text: "  Leafy  " });
  let intel = createLocalIntelligence();

  let result = await intel.generatePlantName(plantData);

  expect(result.ok).toBe(true);
  if (!result.ok) return;
  expect(result.value).toBe("Leafy");
});
