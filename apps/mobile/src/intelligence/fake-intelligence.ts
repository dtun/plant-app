import {
  type AIFailure,
  type ChatInput,
  type PhotoInput,
  type PlantData,
  type PlantIntelligence,
  type Result,
} from "./types";

export interface FakeIntelligenceResponses {
  plantName?: Result<string, AIFailure>;
  photoDescription?: Result<string, AIFailure>;
  chatResponse?: Result<string, AIFailure>;
}

export function createFakeIntelligence(
  responses: FakeIntelligenceResponses = {}
): PlantIntelligence {
  return {
    async generatePlantName(_input: PlantData) {
      return responses.plantName ?? { ok: true, value: "Fakeleaf" };
    },
    async generatePhotoDescription(_input: PhotoInput) {
      return responses.photoDescription ?? { ok: true, value: "A fake plant" };
    },
    async generateChatResponse(_input: ChatInput) {
      return responses.chatResponse ?? { ok: true, value: "Hi from a fake plant" };
    },
  };
}
