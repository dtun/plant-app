// Spike (#58): proves MSW v2 intercepts outbound HTTP under the jest-expo environment,
// with the AI SDK unstubbed. Needs the msw entries in package.json's jest config
// (moduleNameMapper for msw/node, transform + transformIgnorePatterns for ESM-only deps).
import { createAnthropic } from "@ai-sdk/anthropic";
import { APICallError, generateText } from "ai";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

let server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test("a handler intercepts a plain fetch to an HTTPS URL", async () => {
  server.use(http.get("https://example.test/ping", () => HttpResponse.json({ pong: true })));

  let response = await fetch("https://example.test/ping");

  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ pong: true });
});

test("a 401 from the Anthropic messages endpoint reaches generateText as a genuine APICallError", async () => {
  let sentinel = "msw-spike: mocked invalid x-api-key";
  server.use(
    http.post("https://api.anthropic.com/v1/messages", () =>
      HttpResponse.json(
        { type: "error", error: { type: "authentication_error", message: sentinel } },
        { status: 401 }
      )
    )
  );
  let anthropic = createAnthropic({ apiKey: "bad-key" });

  let error = await generateText({
    model: anthropic("claude-haiku-4-5"),
    prompt: "hello",
    maxRetries: 0,
  }).catch((e: unknown) => e);

  expect(APICallError.isInstance(error)).toBe(true);
  let apiError = error as APICallError;
  expect(apiError.statusCode).toBe(401);
  // Only the handler produces this message, so the 401 did not come from the real API.
  expect(apiError.message).toContain(sentinel);
});
