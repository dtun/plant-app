import { APP_USER_ID_HEADER, type ChatStreamEvent } from "./contract";

export const APP_USER_ID = "$RCAnonymousID:test-user";

export function postRequest(
  body: unknown,
  headers: Record<string, string> = { [APP_USER_ID_HEADER]: APP_USER_ID }
): Request {
  return new Request("http://localhost/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

export function parseEvents(text: string): ChatStreamEvent[] {
  return text
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as ChatStreamEvent);
}
