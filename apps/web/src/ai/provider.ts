import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText, streamText, type LanguageModel } from "ai";

export type ModelTier = "text" | "vision";

export type ProviderMessage =
  | {
      role: "user";
      content: string | ({ type: "text"; text: string } | ProviderImagePart)[];
    }
  | { role: "assistant"; content: string };

export interface ProviderImagePart {
  type: "image";
  image: string;
  mediaType: string;
}

export interface ProviderRequest {
  tier: ModelTier;
  system?: string;
  messages: ProviderMessage[];
}

export interface ProviderClient {
  generate(request: ProviderRequest): Promise<string>;
  stream(request: ProviderRequest): AsyncIterable<string>;
}

export const PROVIDER_NAMES = ["Anthropic", "OpenAI"] as const;

export type ProviderName = (typeof PROVIDER_NAMES)[number];

export interface ProviderConfig {
  provider: ProviderName;
  apiKey: string;
  fetch?: typeof fetch;
}

const MODEL_MAPPINGS: Record<ProviderName, Record<ModelTier, string>> = {
  OpenAI: {
    vision: "gpt-4o",
    text: "gpt-4o-mini",
  },
  Anthropic: {
    vision: "claude-sonnet-4-6",
    text: "claude-haiku-4-5-20251001",
  },
};

function createModel(config: ProviderConfig, tier: ModelTier): LanguageModel {
  let options = { apiKey: config.apiKey, fetch: config.fetch };

  if (config.provider === "OpenAI") {
    return createOpenAI(options)(MODEL_MAPPINGS.OpenAI[tier]);
  }
  return createAnthropic(options)(MODEL_MAPPINGS.Anthropic[tier]);
}

export function createProviderClient(config: ProviderConfig): ProviderClient {
  function modelFor(request: ProviderRequest): LanguageModel {
    return createModel(config, request.tier);
  }

  async function generate(request: ProviderRequest): Promise<string> {
    let result = await generateText({
      model: modelFor(request),
      system: request.system,
      messages: request.messages,
    });
    return result.text;
  }

  async function* stream(request: ProviderRequest): AsyncGenerator<string> {
    let result = streamText({
      model: modelFor(request),
      system: request.system,
      messages: request.messages,
      // The SDK would log the failed request, prompt and images included. fullStream rethrows it below.
      onError() {},
    });

    // textStream drops error parts, so a failed stream would end silently as a truncated reply.
    for await (let part of result.fullStream) {
      if (part.type === "text-delta") {
        yield part.text;
      } else if (part.type === "error") {
        throw part.error;
      }
    }
  }

  return { generate, stream };
}
