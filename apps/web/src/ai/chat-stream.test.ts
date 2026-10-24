import { APICallError } from "ai";
import { describe, expect, it, vi } from "vitest";

import type { ChatStreamEvent } from "./contract";
import { createFakeProvider, createFakeVerifier } from "./fakes";
import { createAIHandlers } from "./handlers";
import type { ProviderClient } from "./provider";
import { parseEvents, postRequest } from "./test-helpers";

const CHAT_BODY = {
  plantContext: { name: "Fernie" },
  messages: [{ role: "user" as const, content: "How are you?" }],
};

function chatHandler(provider: ProviderClient) {
  return createAIHandlers({ verifier: createFakeVerifier("entitled"), provider }).chat;
}

describe("chat stream", () => {
  it("streams NDJSON tokens and ends with one done line holding the full trimmed text", async () => {
    let chat = chatHandler(createFakeProvider({ chunks: [" I am", " doing", " well!\n"] }));

    let response = await chat(postRequest(CHAT_BODY));

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("application/x-ndjson");
    let text = await response.text();
    expect(text.endsWith("\n")).toBe(true);
    expect(parseEvents(text)).toEqual([
      { type: "token", text: " I am" },
      { type: "token", text: " doing" },
      { type: "token", text: " well!\n" },
      { type: "done", text: "I am doing well!" },
    ]);
  });

  it("skips empty provider chunks without stalling the stream", async () => {
    let chat = chatHandler(createFakeProvider({ chunks: ["", "a", "", "", "b", ""] }));

    let events = parseEvents(await (await chat(postRequest(CHAT_BODY))).text());

    expect(events).toEqual([
      { type: "token", text: "a" },
      { type: "token", text: "b" },
      { type: "done", text: "ab" },
    ]);
  });

  it("escapes newlines inside tokens so every event stays on one line", async () => {
    let chat = chatHandler(createFakeProvider({ chunks: ["line one\nline two"] }));

    let text = await (await chat(postRequest(CHAT_BODY))).text();

    expect(text.split("\n").filter(Boolean)).toHaveLength(2);
  });

  it("ends with a typed error line when the provider fails mid-stream", async () => {
    let error = new APICallError({
      message: "rate limited",
      url: "https://provider.example/v1",
      requestBodyValues: {},
      statusCode: 429,
    });
    let chat = chatHandler(createFakeProvider({ chunks: ["Hel", "lo"], error }));

    let response = await chat(postRequest(CHAT_BODY));

    expect(response.status).toBe(200);
    let events = parseEvents(await response.text());
    expect(events.slice(0, 2)).toEqual([
      { type: "token", text: "Hel" },
      { type: "token", text: "lo" },
    ]);
    expect(events).toHaveLength(3);
    expect(events[2]).toMatchObject({ type: "error", error: { kind: "quota" } });
  });

  it("types a connection failure before the first token as a network error line", async () => {
    let chat = chatHandler(createFakeProvider({ error: new TypeError("fetch failed") }));

    let events = parseEvents(await (await chat(postRequest(CHAT_BODY))).text());

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ type: "error", error: { kind: "network" } });
  });

  it("ends with an error line when the provider returns no text", async () => {
    let chat = chatHandler(createFakeProvider({ chunks: ["  "] }));

    let events = parseEvents(await (await chat(postRequest(CHAT_BODY))).text());

    expect(events.at(-1)).toMatchObject({ type: "error", error: { kind: "unknown" } });
  });

  it("delivers each token as it arrives instead of buffering the reply", async () => {
    let release!: () => void;
    let gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    let provider: ProviderClient = {
      async generate() {
        return "";
      },
      async *stream() {
        yield "first";
        await gate;
        yield "second";
      },
    };
    let response = await chatHandler(provider)(postRequest(CHAT_BODY));
    let reader = response.body!.getReader();
    let decoder = new TextDecoder();

    let first = await reader.read();

    expect(parseEvents(decoder.decode(first.value))).toEqual([{ type: "token", text: "first" }]);
    release();
    let rest: ChatStreamEvent[] = [];
    for (let chunk = await reader.read(); !chunk.done; chunk = await reader.read()) {
      rest.push(...parseEvents(decoder.decode(chunk.value)));
    }
    expect(rest).toEqual([
      { type: "token", text: "second" },
      { type: "done", text: "firstsecond" },
    ]);
  });

  it("stops pulling from the provider when the client cancels", async () => {
    let finished = false;
    let provider: ProviderClient = {
      async generate() {
        return "";
      },
      async *stream() {
        try {
          while (true) {
            yield "tick";
            await Promise.resolve();
          }
        } finally {
          finished = true;
        }
      },
    };
    let response = await chatHandler(provider)(postRequest(CHAT_BODY));
    let reader = response.body!.getReader();
    await reader.read();

    await reader.cancel();

    await vi.waitFor(() => expect(finished).toBe(true));
  });

  it("refuses before streaming starts with a plain JSON error, not a stream", async () => {
    let provider = createFakeProvider({ chunks: ["x"] });
    let chat = createAIHandlers({ verifier: createFakeVerifier("network"), provider }).chat;

    let response = await chat(postRequest(CHAT_BODY));

    expect(response.status).toBe(502);
    expect(response.headers.get("Content-Type")).toContain("application/json");
    expect(await response.json()).toMatchObject({ error: { kind: "network" } });
  });
});
