import { z } from "zod";

import { createRevenueCatVerifier } from "./entitlements";
import { errorResponse, failureOf } from "./failures";
import { createAIHandlers, type AIHandlers } from "./handlers";
import { PROVIDER_NAMES, createProviderClient } from "./provider";

const serverEnvSchema = z.object({
  AI_PROVIDER: z.enum(PROVIDER_NAMES).default("Anthropic"),
  AI_API_KEY: z.string().min(1),
  REVENUECAT_SECRET_KEY: z.string().min(1),
});

async function notConfigured(): Promise<Response> {
  return errorResponse(failureOf("unknown", "The AI service is not configured."));
}

export function createServerHandlers(env: Record<string, string | undefined>): AIHandlers {
  let parsed = serverEnvSchema.safeParse({
    AI_PROVIDER: env.AI_PROVIDER,
    AI_API_KEY: env.AI_API_KEY,
    REVENUECAT_SECRET_KEY: env.REVENUECAT_SECRET_KEY,
  });

  if (!parsed.success) {
    let names = parsed.error.issues.map((issue) => issue.path.join("."));
    console.error(`AI routes are not configured. Check these env vars: ${names.join(", ")}.`);
    return { name: notConfigured, photo: notConfigured, chat: notConfigured };
  }

  return createAIHandlers({
    verifier: createRevenueCatVerifier({ secretKey: parsed.data.REVENUECAT_SECRET_KEY }),
    provider: createProviderClient({
      provider: parsed.data.AI_PROVIDER,
      apiKey: parsed.data.AI_API_KEY,
    }),
  });
}

let handlers: AIHandlers | undefined;

export function getAIHandlers(): AIHandlers {
  handlers ??= createServerHandlers(process.env);
  return handlers;
}
