import { createLocalIntelligence } from "./local-intelligence";
import type { PlantIntelligence } from "./types";

let current: PlantIntelligence = createLocalIntelligence();

export function intelligence(): PlantIntelligence {
  return current;
}

export function __setPlantIntelligenceForTests(impl: PlantIntelligence): void {
  current = impl;
}

export { createLocalIntelligence } from "./local-intelligence";
export { createFakeIntelligence } from "./fake-intelligence";
export type { FakeIntelligenceResponses } from "./fake-intelligence";
export type {
  AIFailure,
  AIFailureKind,
  ChatInput,
  ChatMessage,
  PhotoInput,
  PlantContext,
  PlantData,
  PlantIntelligence,
  Result,
} from "./types";
