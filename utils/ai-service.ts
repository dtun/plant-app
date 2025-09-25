import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { z } from "zod";

import "expo-sqlite/localStorage/install";

export interface PlantData {
  plantType: string;
  appearance: string;
  personality?: string;
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

function createPrompt(plantData: PlantData): string {
  let prompt = `Generate a creative and meaningful name for a plant based on these details:

Plant Type: ${plantData.plantType}
Appearance: ${plantData.appearance}
Size: ${plantData.size}`;

  if (plantData.personality) {
    prompt += `\nPersonality: ${plantData.personality}`;
  }

  if (plantData.photoDescription) {
    prompt += `\nPhoto Analysis: ${plantData.photoDescription}`;
  }

  prompt += `\n\nPlease provide just the plant name, nothing else. The name should be creative, memorable, and reflect the plant's characteristics.`;

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
    let model;
    let provider;
    let options = {
      apiKey: config.apiKey,
    };

    if (config.provider === "OpenAI") {
      provider = createOpenAI(options);
      model = provider("gpt-4o");
    } else if (config.provider === "Anthropic") {
      provider = createAnthropic(options);
      model = provider("claude-3-5-sonnet-20241022");
    } else {
      throw new Error("Unsupported AI provider");
    }

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
    console.error("Error generating photo description:", error);

    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        throw new Error("Invalid API key. Please check your AI settings.");
      }
      if (
        error.message.includes("quota") ||
        error.message.includes("billing")
      ) {
        throw new Error(
          "API quota exceeded. Please check your account billing."
        );
      }
      if (
        error.message.includes("network") ||
        error.message.includes("fetch")
      ) {
        throw new Error(
          "Network error. Please check your internet connection."
        );
      }
    }

    throw new Error("Failed to analyze photo. Please try again.");
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
  let provider;

  try {
    let model;
    let options = {
      apiKey: config.apiKey,
    };

    if (config.provider === "OpenAI") {
      provider = createOpenAI(options);
      model = provider("gpt-4o-mini");
    } else if (config.provider === "Anthropic") {
      provider = createAnthropic(options);
      model = provider("claude-3-haiku-20240307");
    } else {
      throw new Error("Unsupported AI provider");
    }

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
    console.error("Error generating plant name:", error);

    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        throw new Error("Invalid API key. Please check your AI settings.");
      }
      if (
        error.message.includes("quota") ||
        error.message.includes("billing")
      ) {
        throw new Error(
          "API quota exceeded. Please check your account billing."
        );
      }
      if (
        error.message.includes("network") ||
        error.message.includes("fetch")
      ) {
        throw new Error(
          "Network error. Please check your internet connection."
        );
      }
    }

    throw new Error("Failed to generate plant name. Please try again.");
  }
}
