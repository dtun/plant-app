import type { z } from "zod";

import {
  APP_USER_ID_HEADER,
  INVALID_BODY_STATUS,
  chatRequestSchema,
  nameRequestSchema,
  photoRequestSchema,
  type AIErrorKind,
  type ChatRequest,
  type NameRequest,
  type NameResponse,
  type PhotoRequest,
  type PhotoResponse,
} from "./contract";
import type { EntitlementVerdict, EntitlementVerifier } from "./entitlements";
import { EMPTY_RESPONSE_FAILURE, errorResponse, failureOf, toFailure } from "./failures";
import {
  PHOTO_ANALYSIS_INSTRUCTION,
  buildChatSystemPrompt,
  buildPlantNamingPrompt,
} from "./prompts";
import type { ProviderClient, ProviderMessage, ProviderRequest } from "./provider";
import { ndjsonResponse } from "./stream";

// The SDK needs a media type and the picker produces JPEG, so every image is sent as one.
const IMAGE_MEDIA_TYPE = "image/jpeg";

type Prepared = { ok: true; request: ProviderRequest } | { ok: false; fields: string[] };

interface SingleOperation {
  delivery: "single";
  prepare(body: unknown): Prepared;
  toBody(text: string): NameResponse | PhotoResponse;
}

interface StreamOperation {
  delivery: "stream";
  prepare(body: unknown): Prepared;
}

type Operation = SingleOperation | StreamOperation;

function prepareWith<Schema extends z.ZodTypeAny>(
  schema: Schema,
  toRequest: (body: z.output<Schema>) => ProviderRequest
): (body: unknown) => Prepared {
  return function prepare(body) {
    let parsed = schema.safeParse(body);
    if (!parsed.success) {
      let fields = parsed.error.issues.map((issue) => issue.path.join(".") || "body");
      return { ok: false, fields: [...new Set(fields)] };
    }
    return { ok: true, request: toRequest(parsed.data) };
  };
}

function nameRequest(body: NameRequest): ProviderRequest {
  let prompt = buildPlantNamingPrompt(body.plant, body.avoidNames ?? []);
  return { tier: "text", messages: [{ role: "user", content: prompt.trim() }] };
}

function photoRequest(body: PhotoRequest): ProviderRequest {
  return {
    tier: "vision",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: PHOTO_ANALYSIS_INSTRUCTION },
          { type: "image", image: body.imageBase64, mediaType: IMAGE_MEDIA_TYPE },
        ],
      },
    ],
  };
}

function toProviderMessage(message: ChatRequest["messages"][number]): ProviderMessage {
  if (message.imageBase64 === undefined) {
    return { role: message.role, content: message.content };
  }

  let content: Extract<ProviderMessage, { role: "user" }>["content"] = [];
  if (message.content) {
    content.push({ type: "text", text: message.content });
  }
  content.push({ type: "image", image: message.imageBase64, mediaType: IMAGE_MEDIA_TYPE });
  return { role: "user", content };
}

function chatRequest(body: ChatRequest): ProviderRequest {
  let hasImages = body.messages.some((message) => message.imageBase64 !== undefined);
  return {
    tier: hasImages ? "vision" : "text",
    system: buildChatSystemPrompt(body.plantContext),
    messages: body.messages.map(toProviderMessage),
  };
}

const OPERATIONS = {
  name: {
    delivery: "single",
    prepare: prepareWith(nameRequestSchema, nameRequest),
    toBody(text) {
      return { name: text };
    },
  },
  photo: {
    delivery: "single",
    prepare: prepareWith(photoRequestSchema, photoRequest),
    toBody(text) {
      return { description: text };
    },
  },
  chat: {
    delivery: "stream",
    prepare: prepareWith(chatRequestSchema, chatRequest),
  },
} satisfies Record<string, Operation>;

const VERDICT_REFUSAL: Record<EntitlementVerdict, AIErrorKind | null> = {
  entitled: null,
  "not-entitled": "subscription-required",
  network: "network",
  error: "unknown",
};

function invalidBody(fields: string[]): Response {
  return errorResponse(
    failureOf("unknown", `Invalid request body: ${fields.join(", ")}.`),
    INVALID_BODY_STATUS
  );
}

export interface AIHandlerDeps {
  verifier: EntitlementVerifier;
  provider: ProviderClient;
}

export type AIHandlers = Record<keyof typeof OPERATIONS, (request: Request) => Promise<Response>>;

export function createAIHandlers(deps: AIHandlerDeps): AIHandlers {
  async function handle(operation: Operation, request: Request): Promise<Response> {
    let appUserId = request.headers.get(APP_USER_ID_HEADER)?.trim();
    let verdict: EntitlementVerdict = appUserId
      ? await deps.verifier.verify(appUserId)
      : "not-entitled";
    let refusal = VERDICT_REFUSAL[verdict];
    if (refusal) {
      return errorResponse(failureOf(refusal));
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return invalidBody(["body"]);
    }

    let prepared = operation.prepare(body);
    if (!prepared.ok) {
      return invalidBody(prepared.fields);
    }

    if (operation.delivery === "stream") {
      return ndjsonResponse(deps.provider.stream(prepared.request));
    }

    try {
      let text = (await deps.provider.generate(prepared.request)).trim();
      if (!text) {
        return errorResponse(EMPTY_RESPONSE_FAILURE);
      }
      return Response.json(operation.toBody(text), { headers: { "Cache-Control": "no-store" } });
    } catch (error) {
      return errorResponse(toFailure(error));
    }
  }

  return {
    name(request) {
      return handle(OPERATIONS.name, request);
    },
    photo(request) {
      return handle(OPERATIONS.photo, request);
    },
    chat(request) {
      return handle(OPERATIONS.chat, request);
    },
  };
}
