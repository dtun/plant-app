import { z } from "zod";

export const APP_USER_ID_HEADER = "X-App-User-Id";

export const AI_ERROR_KINDS = ["subscription-required", "quota", "network", "unknown"] as const;

export type AIErrorKind = (typeof AI_ERROR_KINDS)[number];

export const ERROR_STATUS: Record<AIErrorKind, number> = {
  "subscription-required": 402,
  quota: 429,
  network: 502,
  unknown: 500,
};

export const INVALID_BODY_STATUS = 400;

export interface AIFailure {
  kind: AIErrorKind;
  message: string;
}

export interface AIErrorBody {
  error: AIFailure;
}

// Rejects data: URIs and URLs. The AI SDK treats a string image as a URL when it parses as one.
const base64Schema = z.string().regex(/^[A-Za-z0-9+/]+={0,2}$/, "Expected raw base64");

export const nameRequestSchema = z.object({
  plant: z.object({
    description: z.string().min(1),
    plantType: z.string().optional(),
    size: z.enum(["Small", "Medium", "Large"]).optional(),
    photoDescription: z.string().optional(),
  }),
  avoidNames: z.array(z.string()).optional(),
});

export const photoRequestSchema = z.object({
  imageBase64: base64Schema,
});

export const chatRequestSchema = z.object({
  plantContext: z.object({
    name: z.string().min(1),
    description: z.string().nullish(),
    size: z.string().nullish(),
    aiAnalysis: z.string().nullish(),
  }),
  messages: z
    .array(
      z
        .object({
          role: z.enum(["user", "assistant"]),
          content: z.string(),
          imageBase64: base64Schema.optional(),
        })
        .refine((message) => message.content.length > 0 || message.imageBase64 !== undefined, {
          message: "Expected content or imageBase64",
        })
    )
    .min(1),
});

export type NameRequest = z.infer<typeof nameRequestSchema>;
export type PhotoRequest = z.infer<typeof photoRequestSchema>;
export type ChatRequest = z.infer<typeof chatRequestSchema>;

export interface NameResponse {
  name: string;
}

export interface PhotoResponse {
  description: string;
}

export type ChatStreamEvent =
  | { type: "token"; text: string }
  | { type: "done"; text: string }
  | { type: "error"; error: AIFailure };
