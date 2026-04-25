import { createFakeIntelligence } from "./fake-intelligence";
import type { AIFailure, Result } from "./types";

test("createFakeIntelligence returns canned ok results by default", async () => {
  let intel = createFakeIntelligence();

  let nameResult = await intel.generatePlantName({ plantType: "Fern", description: "leafy" });
  let descResult = await intel.generatePhotoDescription({ imageUri: "file://x" });
  let chatResult = await intel.generateChatResponse({
    plantContext: { name: "Spike" },
    messages: [],
  });

  expect(nameResult.ok).toBe(true);
  expect(descResult.ok).toBe(true);
  expect(chatResult.ok).toBe(true);
});

test("createFakeIntelligence returns configured ok responses", async () => {
  let intel = createFakeIntelligence({
    plantName: { ok: true, value: "Sprout" },
    photoDescription: { ok: true, value: "A green thing" },
    chatResponse: { ok: true, value: "Hello human" },
  });

  let nameResult = await intel.generatePlantName({ plantType: "Fern", description: "x" });
  let descResult = await intel.generatePhotoDescription({ imageUri: "file://x" });
  let chatResult = await intel.generateChatResponse({
    plantContext: { name: "Sprout" },
    messages: [],
  });

  if (!nameResult.ok) throw new Error("expected ok");
  if (!descResult.ok) throw new Error("expected ok");
  if (!chatResult.ok) throw new Error("expected ok");
  expect(nameResult.value).toBe("Sprout");
  expect(descResult.value).toBe("A green thing");
  expect(chatResult.value).toBe("Hello human");
});

test("createFakeIntelligence returns configured failure responses", async () => {
  let failure: Result<string, AIFailure> = {
    ok: false,
    failure: { kind: "quota", message: "out of quota" },
  };
  let intel = createFakeIntelligence({ plantName: failure });

  let result = await intel.generatePlantName({ plantType: "Fern", description: "x" });

  expect(result.ok).toBe(false);
  if (result.ok) return;
  expect(result.failure.kind).toBe("quota");
});
