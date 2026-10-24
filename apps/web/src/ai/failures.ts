import { APICallError, RetryError } from "ai";

import { ERROR_STATUS, type AIErrorBody, type AIErrorKind, type AIFailure } from "./contract";

const MESSAGES: Record<AIErrorKind, string> = {
  "subscription-required": "An active subscription is required.",
  quota: "The AI provider rejected the request because of quota or billing limits.",
  network: "An upstream service could not be reached.",
  unknown: "The AI request failed.",
};

export const EMPTY_RESPONSE_FAILURE: AIFailure = {
  kind: "unknown",
  message: "The AI provider returned an empty response.",
};

export function failureOf(kind: AIErrorKind, message: string = MESSAGES[kind]): AIFailure {
  return { kind, message };
}

// Never forwards error.message. Provider errors can carry request details that hint at our key.
export function toFailure(error: unknown): AIFailure {
  // The SDK retries transient errors and then throws a RetryError wrapping the last one.
  if (RetryError.isInstance(error)) {
    return toFailure(error.lastError);
  }

  if (APICallError.isInstance(error)) {
    // No status code means the request never reached the API.
    if (error.statusCode === undefined) {
      return failureOf("network");
    }
    if (error.statusCode === 402 || error.statusCode === 429) {
      return failureOf("quota");
    }
    // 401 and 403 mean our own key is bad. That is not the caller's problem, so it stays unknown.
    return failureOf("unknown");
  }

  // A bare fetch failure surfaces as an unwrapped TypeError.
  if (error instanceof TypeError) {
    return failureOf("network");
  }

  return failureOf("unknown");
}

export function errorResponse(
  failure: AIFailure,
  status: number = ERROR_STATUS[failure.kind]
): Response {
  let body: AIErrorBody = { error: failure };
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}
