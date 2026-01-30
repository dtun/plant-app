import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { z } from "zod";

import "expo-sqlite/localStorage/install";

let CONFIG_ENDPOINT = "https://www.keeptend.com/api/config";

let generatedNames: string[] = [];

export interface PlantData {
  plantType: string;
  description: string;
  photoDescription?: string;
  size?: "Small" | "Medium" | "Large";
}

let aiConfigSchema = z.object({
  apiKey: z.string().min(1, "API key is required"),
  provider: z.enum(["OpenAI", "Anthropic"]),
});

export type AIConfig = z.infer<typeof aiConfigSchema>;

async function fetchAIConfigFromEndpoint(): Promise<AIConfig | null> {
  try {
    // console.log("Fetching AI config from endpoint:", CONFIG_ENDPOINT);

    let response = await fetch(CONFIG_ENDPOINT, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch config: ${response.status} ${response.statusText}`);
      return null;
    }

    let data = await response.json();

    let validationResult = aiConfigSchema.safeParse(data);

    // console.log(JSON.stringify({ validationResult }));

    if (!validationResult.success) {
      console.error("Invalid config from endpoint:", validationResult.error);
      return null;
    }

    // Cache the config in localStorage for offline access
    globalThis.localStorage.setItem("ai_api_key", validationResult.data.apiKey);
    globalThis.localStorage.setItem("ai_provider", validationResult.data.provider);

    // console.log("Successfully fetched and cached config from endpoint");
    return validationResult.data;
  } catch (error) {
    console.error("Error fetching AI config from endpoint:", error);
    return null;
  }
}

async function getAIConfig(): Promise<AIConfig | null> {
  try {
    // First, try to fetch from the public endpoint
    let endpointConfig = await fetchAIConfigFromEndpoint();
    if (endpointConfig) {
      // console.log("Using AI config from endpoint");
      return endpointConfig;
    }

    // Fallback to cached localStorage config
    // console.log("Falling back to cached/env AI config");
    let storedApiKey =
      globalThis.localStorage.getItem("ai_api_key") || process.env.EXPO_PUBLIC_DEFAULT_AI_API_KEY;
    let storedProvider =
      globalThis.localStorage.getItem("ai_provider") || process.env.EXPO_PUBLIC_DEFAULT_AI_PROVIDER;
    let validationResult = aiConfigSchema.safeParse({
      apiKey: storedApiKey,
      provider: storedProvider,
    });

    if (!validationResult.success) {
      console.error("Invalid AI config:", validationResult.error);
      return null;
    }

    return validationResult.data;
  } catch (error) {
    console.error("Error getting AI config:", error);
    return null;
  }
}

type ModelType = "vision" | "text";

let modelMappings = {
  OpenAI: {
    vision: "gpt-4o",
    text: "gpt-4o-mini",
  },
  Anthropic: {
    vision: "claude-sonnet-4-5-20250929",
    text: "claude-haiku-4-5-20251001",
  },
} as const;

function createAIModel(config: AIConfig, modelType: ModelType) {
  let options = {
    apiKey: config.apiKey,
  };

  let provider;
  let modelName;

  if (config.provider === "OpenAI") {
    provider = createOpenAI(options);
    modelName = modelMappings.OpenAI[modelType];
  } else if (config.provider === "Anthropic") {
    provider = createAnthropic(options);
    modelName = modelMappings.Anthropic[modelType];
  } else {
    throw new Error("Unsupported AI provider");
  }

  return provider(modelName);
}

function handleAIError(error: unknown, operation: string): never {
  console.error(`Error ${operation}:`, error);

  if (error instanceof Error) {
    if (error.message.includes("API key")) {
      throw new Error("Invalid API key. Please check your AI settings.");
    }
    if (error.message.includes("quota") || error.message.includes("billing")) {
      throw new Error("API quota exceeded. Please check your account billing.");
    }
    if (error.message.includes("network") || error.message.includes("fetch")) {
      throw new Error("Network error. Please check your internet connection.");
    }
  }

  throw new Error(`Failed to ${operation}. Please try again.`);
}

function createPlantNamingPrompt(plantData: PlantData): string {
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

export async function analyzePhotoAndSetDescription(
  imageUri: string,
  setIsAnalyzing: (analyzing: boolean) => void,
  setDescription: (description: string) => void,
  onError?: (error: string) => void
): Promise<void> {
  setIsAnalyzing(true);
  try {
    let description = await generatePhotoDescription(imageUri);
    setDescription(description);
  } catch (error) {
    console.error("Error analyzing photo:", error);
    let errorMessage = "Failed to analyze photo. Please try again.";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    if (onError) {
      onError(errorMessage);
    }
  } finally {
    setIsAnalyzing(false);
  }
}

export async function generatePhotoDescription(imageUri: string): Promise<string> {
  let config = await getAIConfig();

  if (!config) {
    throw new Error(
      "AI configuration not found. Please set up your API key and provider in Settings."
    );
  }

  try {
    let model = createAIModel(config, "vision");

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
              image: imageUri,
            },
          ],
        },
      ],
    });

    let description = result.text.trim();

    if (!description) {
      throw new Error("No description generated");
    }

    return description;
  } catch (error) {
    handleAIError(error, "analyze photo");
  }
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  imageUri?: string;
}

export interface PlantContext {
  name: string;
  description?: string | null;
  size?: string | null;
  aiAnalysis?: string | null;
}

export async function generateChatResponse(
  plantContext: PlantContext,
  messages: ChatMessage[]
): Promise<string> {
  let config = await getAIConfig();

  if (!config) {
    throw new Error(
      "AI configuration not found. Please set up your API key and provider in Settings."
    );
  }

  let systemPrompt = `You are ${plantContext.name}, a living plant. Respond in first person as this plant. Be friendly, warm, and knowledgeable about plant care. Keep responses concise but helpful.

Your profile:
- Name: ${plantContext.name}`;

  if (plantContext.description) {
    systemPrompt += `\n- Description: ${plantContext.description}`;
  }
  if (plantContext.size) {
    systemPrompt += `\n- Size: ${plantContext.size}`;
  }
  if (plantContext.aiAnalysis) {
    systemPrompt += `\n- Analysis: ${plantContext.aiAnalysis}`;
  }

  systemPrompt +=
    "\n\nSpeak as this plant would — with personality, care tips when relevant, and a touch of charm.";

  try {
    let hasImages = messages.some((m) => m.imageUri);
    let model = createAIModel(config, hasImages ? "vision" : "text");

    let formattedMessages = messages.map((m) => {
      if (m.imageUri) {
        let content: ({ type: "text"; text: string } | { type: "image"; image: string })[] = [];
        if (m.content) {
          content.push({ type: "text", text: m.content });
        }
        content.push({ type: "image", image: m.imageUri });
        return { role: "user" as const, content };
      }
      return { role: m.role, content: m.content };
    });

    let result = await generateText({
      model,
      system: systemPrompt,
      messages: formattedMessages,
    });

    let response = result.text.trim();

    if (!response) {
      throw new Error("No response generated");
    }

    return response;
  } catch (error) {
    handleAIError(error, "generate chat response");
  }
}

export async function generatePlantName(plantData: PlantData): Promise<string> {
  let config = await getAIConfig();

  if (!config) {
    throw new Error(
      "AI configuration not found. Please set up your API key and provider in Settings."
    );
  }

  let prompt = createPlantNamingPrompt(plantData);

  try {
    let model = createAIModel(config, "text");

    let result = await generateText({
      model,
      prompt: prompt.trim(),
    });

    let plantName = result.text.trim();

    if (!plantName) {
      throw new Error("No name generated");
    }

    generatedNames.push(plantName);

    return plantName;
  } catch (error) {
    handleAIError(error, "generate plant name");
  }
}
