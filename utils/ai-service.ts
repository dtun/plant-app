import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { z } from "zod";

import "expo-sqlite/localStorage/install";

export interface PlantData {
  plantType: string;
  description: string;
  photoDescription?: string;
  size: "Small" | "Medium" | "Large";
}

let aiConfigSchema = z.object({
  apiKey: z.string().min(1, "API key is required"),
  provider: z.enum(["OpenAI", "Anthropic"]),
});

export type AIConfig = z.infer<typeof aiConfigSchema>;

function getAIConfig(): AIConfig | null {
  try {
    let storedApiKey = globalThis.localStorage.getItem("ai_api_key");
    let storedProvider = globalThis.localStorage.getItem("ai_provider");
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
    vision: "claude-3-5-sonnet-20241022",
    text: "claude-3-haiku-20240307",
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

function createPrompt(plantData: PlantData): string {
  let prompt = `Generate a cute, gentle, and endearing name for a plant with the following characteristics:

Plant Type: ${plantData.plantType}
Description: ${plantData.description}
Size: ${plantData.size}`;

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

export async function generatePhotoDescription(
  imageUri: string
): Promise<string> {
  let config = getAIConfig();

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

export async function generatePlantName(plantData: PlantData): Promise<string> {
  let config = getAIConfig();

  if (!config) {
    throw new Error(
      "AI configuration not found. Please set up your API key and provider in Settings."
    );
  }

  let prompt = createPrompt(plantData);

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

    return plantName;
  } catch (error) {
    handleAIError(error, "generate plant name");
  }
}
