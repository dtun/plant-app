export type Result<T, E> = { ok: true; value: T } | { ok: false; failure: E };

export type AIFailureKind = "no-config" | "invalid-key" | "quota" | "network" | "unknown";

export interface AIFailure {
  kind: AIFailureKind;
  message: string;
}

export interface PlantData {
  plantType: string;
  description: string;
  photoDescription?: string;
  size?: "Small" | "Medium" | "Large";
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  imageUri?: string;
  imageBase64?: string | null;
}

export interface PlantContext {
  name: string;
  description?: string | null;
  size?: string | null;
  photoUri?: string | null;
  aiAnalysis?: string | null;
}

export interface PhotoInput {
  imageUri: string;
  base64?: string | null;
}

export interface ChatInput {
  plantContext: PlantContext;
  messages: ChatMessage[];
  onToken?: (chunk: string) => void;
}

export interface PlantIntelligence {
  generatePlantName(input: PlantData): Promise<Result<string, AIFailure>>;
  generatePhotoDescription(input: PhotoInput): Promise<Result<string, AIFailure>>;
  generateChatResponse(input: ChatInput): Promise<Result<string, AIFailure>>;
}
