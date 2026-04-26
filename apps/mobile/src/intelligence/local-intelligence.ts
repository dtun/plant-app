import { msg } from "@lingui/core/macro";
import { i18n } from "@/src/i18n";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { z } from "zod";

import "expo-sqlite/localStorage/install";

import {
  type AIFailure,
  type ChatInput,
  type PhotoInput,
  type PlantData,
  type PlantIntelligence,
  type Result,
} from "./types";

let CONFIG_ENDPOINT = "https://www.keeptend.com/api/config";

let aiConfigSchema = z.object({
  apiKey: z.string().min(1, "API key is required"),
  provider: z.enum(["OpenAI", "Anthropic"]),
});

type AIConfig = z.infer<typeof aiConfigSchema>;
type AIProvider = AIConfig["provider"];
type ModelType = "vision" | "text";

let modelMappings: Record<AIProvider, Record<ModelType, string>> = {
  OpenAI: {
    vision: "gpt-4o",
    text: "gpt-4o-mini",
  },
  Anthropic: {
    vision: "claude-sonnet-4-6",
    text: "claude-haiku-4-5-20251001",
  },
};

async function fetchAIConfigFromEndpoint(): Promise<AIConfig | null> {
  try {
    let response = await fetch(CONFIG_ENDPOINT, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      return null;
    }

    let data = await response.json();
    let validationResult = aiConfigSchema.safeParse(data);
    if (!validationResult.success) {
      return null;
    }

    globalThis.localStorage.setItem("ai_api_key", validationResult.data.apiKey);
    globalThis.localStorage.setItem("ai_provider", validationResult.data.provider);
    return validationResult.data;
  } catch {
    return null;
  }
}

async function getAIConfig(): Promise<AIConfig | null> {
  try {
    let userApiKey = globalThis.localStorage.getItem("ai_user_api_key");
    let userProvider = globalThis.localStorage.getItem("ai_user_provider");

    if (userApiKey && userProvider) {
      let userResult = aiConfigSchema.safeParse({
        apiKey: userApiKey,
        provider: userProvider,
      });
      if (userResult.success) {
        return userResult.data;
      }
    }

    let endpointConfig = await fetchAIConfigFromEndpoint();
    if (endpointConfig) {
      return endpointConfig;
    }

    let storedApiKey =
      globalThis.localStorage.getItem("ai_api_key") || process.env.EXPO_PUBLIC_DEFAULT_AI_API_KEY;
    let storedProvider =
      globalThis.localStorage.getItem("ai_provider") || process.env.EXPO_PUBLIC_DEFAULT_AI_PROVIDER;
    let validationResult = aiConfigSchema.safeParse({
      apiKey: storedApiKey,
      provider: storedProvider,
    });

    if (!validationResult.success) {
      return null;
    }

    return validationResult.data;
  } catch {
    return null;
  }
}

function createAIModel(config: AIConfig, modelType: ModelType) {
  let options = { apiKey: config.apiKey };

  if (config.provider === "OpenAI") {
    let provider = createOpenAI(options);
    return provider(modelMappings.OpenAI[modelType]);
  }

  let provider = createAnthropic(options);
  return provider(modelMappings.Anthropic[modelType]);
}

function noConfigFailure(): AIFailure {
  return {
    kind: "no-config",
    message: i18n._(
      msg`AI configuration not found. Please set up your API key and provider in Settings.`
    ),
  };
}

function mapErrorToFailure(error: unknown): AIFailure {
  if (error instanceof Error) {
    if (error.message.includes("API key")) {
      return {
        kind: "invalid-key",
        message: i18n._(msg`Invalid API key. Please check your AI settings.`),
      };
    }
    if (error.message.includes("quota") || error.message.includes("billing")) {
      return {
        kind: "quota",
        message: i18n._(msg`API quota exceeded. Please check your account billing.`),
      };
    }
    if (error.message.includes("network") || error.message.includes("fetch")) {
      return {
        kind: "network",
        message: i18n._(msg`Network error. Please check your internet connection.`),
      };
    }
  }

  let detail = error instanceof Error ? error.message : String(error);
  return { kind: "unknown", message: detail };
}

async function imageToBase64(input: PhotoInput): Promise<string> {
  if (input.base64) {
    return input.base64;
  }

  let response = await fetch(input.imageUri);
  let blob = await response.blob();
  return new Promise((resolve, reject) => {
    let reader = new FileReader();
    reader.onloadend = () => {
      let result = reader.result as string;
      let base64 = result.split(",")[1] ?? result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function buildPlantNamingPrompt(plantData: PlantData, generatedNames: string[]): string {
  let prompt = `Generate a cute, gentle, and endearing name for a plant with the following characteristics:

Plant Type: ${plantData.plantType}
Description: ${plantData.description}`;

  if (plantData.size) {
    prompt += `\nSize: ${plantData.size}`;
  }

  if (generatedNames.length > 0) {
    prompt += `\nPreviously generated names to avoid: ${JSON.stringify({
      previouslyGeneratedNames: generatedNames,
    })}`;
  }

  if (plantData.photoDescription) {
    prompt += `\nPhoto Analysis: ${plantData.photoDescription}`;
  }

  prompt += `\nThe name should be sweet, adorable, and friendly - the kind of cute names a plant parent would lovingly call their plant.
Think of names that are charming, whimsical, and bring a smile to people's faces.
Avoid anything too dramatic or intense - focus on gentle, cute, and heartwarming names.
The name should be creative, memorable, and reflect the plant's characteristics.

Please provide just the plant name, nothing else.`;

  return prompt;
}

function buildChatSystemPrompt(plantContext: ChatInput["plantContext"]): string {
  let systemPrompt = `You are ${plantContext.name}, a living plant. Respond in first person as this plant. Be friendly, warm, and knowledgeable about plant care. Keep responses concise but helpful. Always tailor your advice and personality to your specific profile below — never give generic plant advice when your profile contains relevant details.

Your profile:
- Name: ${plantContext.name}`;

  if (plantContext.description) {
    systemPrompt += `\n- Species/Type: ${plantContext.description}`;
  }
  if (plantContext.size) {
    systemPrompt += `\n- Size: ${plantContext.size}`;
  }
  if (plantContext.photoUri) {
    systemPrompt += `\n- Photo: You have a photo on file (${plantContext.photoUri})`;
  }
  if (plantContext.aiAnalysis) {
    systemPrompt += `\n- Care Instructions & Analysis: ${plantContext.aiAnalysis}`;
  }

  systemPrompt +=
    "\n\nSpeak as this plant would — with personality, care tips when relevant, and a touch of charm. Reference your specific species, size, and care needs from your profile when answering questions.";

  return systemPrompt;
}

export function createLocalIntelligence(): PlantIntelligence {
  let generatedNames: string[] = [];

  async function generatePlantName(plantData: PlantData): Promise<Result<string, AIFailure>> {
    let config = await getAIConfig();
    if (!config) {
      return { ok: false, failure: noConfigFailure() };
    }

    try {
      let model = createAIModel(config, "text");
      let prompt = buildPlantNamingPrompt(plantData, generatedNames);
      let result = await generateText({ model, prompt: prompt.trim() });
      let plantName = result.text.trim();

      if (!plantName) {
        return { ok: false, failure: { kind: "unknown", message: "No name generated" } };
      }

      generatedNames.push(plantName);
      return { ok: true, value: plantName };
    } catch (error) {
      return { ok: false, failure: mapErrorToFailure(error) };
    }
  }

  async function generatePhotoDescription(input: PhotoInput): Promise<Result<string, AIFailure>> {
    let config = await getAIConfig();
    if (!config) {
      return { ok: false, failure: noConfigFailure() };
    }

    try {
      let model = createAIModel(config, "vision");
      let base64 = await imageToBase64(input);

      let result = await generateText({
        model,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this plant photo and provide a detailed description of its appearance, including leaf shape, color, texture, size, and any notable characteristics. Focus on botanical features that would help identify or describe the plant.",
              },
              {
                type: "image",
                image: base64,
                mediaType: "image/jpeg",
              },
            ],
          },
        ],
      });

      let description = result.text.trim();
      if (!description) {
        return { ok: false, failure: { kind: "unknown", message: "No description generated" } };
      }
      return { ok: true, value: description };
    } catch (error) {
      return { ok: false, failure: mapErrorToFailure(error) };
    }
  }

  async function generateChatResponse(input: ChatInput): Promise<Result<string, AIFailure>> {
    let config = await getAIConfig();
    if (!config) {
      return { ok: false, failure: noConfigFailure() };
    }

    try {
      let hasImages = input.messages.some((m) => m.imageUri);
      let model = createAIModel(config, hasImages ? "vision" : "text");
      let systemPrompt = buildChatSystemPrompt(input.plantContext);

      let formattedMessages = await Promise.all(
        input.messages.map(async (m) => {
          if (m.imageUri) {
            let content: (
              | { type: "text"; text: string }
              | { type: "image"; image: string; mimeType: string }
            )[] = [];
            if (m.content) {
              content.push({ type: "text", text: m.content });
            }
            let base64 = await imageToBase64({ imageUri: m.imageUri, base64: m.imageBase64 });
            content.push({ type: "image", image: base64, mimeType: "image/jpeg" });
            return { role: "user" as const, content };
          }
          return { role: m.role, content: m.content };
        })
      );

      let result = await generateText({
        model,
        system: systemPrompt,
        messages: formattedMessages,
      });

      let response = result.text.trim();
      if (!response) {
        return { ok: false, failure: { kind: "unknown", message: "No response generated" } };
      }
      return { ok: true, value: response };
    } catch (error) {
      return { ok: false, failure: mapErrorToFailure(error) };
    }
  }

  return {
    generatePlantName,
    generatePhotoDescription,
    generateChatResponse,
  };
}
