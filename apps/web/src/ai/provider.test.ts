import { describe, expect, it } from "vitest";

import {
  createProviderClient,
  type ModelTier,
  type ProviderClient,
  type ProviderName,
} from "./provider";

interface RecordedRequest {
  url: string;
  headers: Headers;
  body: { model?: string };
}

function sse(events: { event: string; data: unknown }[]): Response {
  let text = events.map((e) => `event: ${e.event}\ndata: ${JSON.stringify(e.data)}\n\n`).join("");
  return new Response(text, { headers: { "Content-Type": "text/event-stream" } });
}

function anthropicStream(deltas: string[], tail: { event: string; data: unknown }[]): Response {
  let message = {
    id: "msg_1",
    type: "message",
    role: "assistant",
    model: "claude",
    content: [],
    stop_reason: null,
    stop_sequence: null,
    usage: { input_tokens: 1, output_tokens: 1 },
  };
  return sse([
    { event: "message_start", data: { type: "message_start", message } },
    {
      event: "content_block_start",
      data: { type: "content_block_start", index: 0, content_block: { type: "text", text: "" } },
    },
    ...deltas.map((text) => ({
      event: "content_block_delta",
      data: { type: "content_block_delta", index: 0, delta: { type: "text_delta", text } },
    })),
    ...tail,
  ]);
}

const STREAM_END = [
  { event: "content_block_stop", data: { type: "content_block_stop", index: 0 } },
  {
    event: "message_delta",
    data: {
      type: "message_delta",
      delta: { stop_reason: "end_turn", stop_sequence: null },
      usage: { output_tokens: 2 },
    },
  },
  { event: "message_stop", data: { type: "message_stop" } },
];

function clientWith(provider: ProviderName, respond: () => Response) {
  let requests: RecordedRequest[] = [];
  let client: ProviderClient = createProviderClient({
    provider,
    apiKey: "sk-provider-key",
    async fetch(url, init) {
      requests.push({
        url: String(url),
        headers: new Headers(init?.headers),
        body: JSON.parse(String(init?.body)),
      });
      return respond();
    },
  });
  return { client, requests };
}

async function collect(source: AsyncIterable<string>): Promise<string[]> {
  let chunks: string[] = [];
  for await (let chunk of source) {
    chunks.push(chunk);
  }
  return chunks;
}

const REQUEST = { system: "You are a fern.", messages: [{ role: "user" as const, content: "Hi" }] };

describe("createProviderClient model selection", () => {
  it.each<[ProviderName, ModelTier, string]>([
    ["Anthropic", "text", "claude-haiku-4-5-20251001"],
    ["Anthropic", "vision", "claude-sonnet-4-6"],
    ["OpenAI", "text", "gpt-4o-mini"],
    ["OpenAI", "vision", "gpt-4o"],
  ])("%s on the %s tier calls %s", async (provider, tier, model) => {
    let { client, requests } = clientWith(provider, () => new Response("{}", { status: 401 }));

    await client.generate({ ...REQUEST, tier }).catch(() => {});

    expect(requests).toHaveLength(1);
    expect(requests[0].body.model).toBe(model);
    let sentHeaders = [...requests[0].headers.values()].join(" ");
    expect(sentHeaders).toContain("sk-provider-key");
  });
});

describe("createProviderClient responses", () => {
  it("returns the generated text", async () => {
    let { client } = clientWith("Anthropic", () =>
      Response.json({
        id: "msg_1",
        type: "message",
        role: "assistant",
        model: "claude",
        content: [{ type: "text", text: "Fernie" }],
        stop_reason: "end_turn",
        stop_sequence: null,
        usage: { input_tokens: 1, output_tokens: 1 },
      })
    );

    expect(await client.generate({ ...REQUEST, tier: "text" })).toBe("Fernie");
  });

  it("yields streamed text deltas in order", async () => {
    let { client } = clientWith("Anthropic", () => anthropicStream(["Hel", "lo"], STREAM_END));

    expect(await collect(client.stream({ ...REQUEST, tier: "text" }))).toEqual(["Hel", "lo"]);
  });

  it("throws when the provider reports an error mid-stream instead of ending quietly", async () => {
    let overloaded = {
      event: "error",
      data: { type: "error", error: { type: "overloaded_error", message: "Overloaded" } },
    };
    let { client } = clientWith("Anthropic", () => anthropicStream(["Hel"], [overloaded]));
    let received: string[] = [];

    async function consume() {
      for await (let chunk of client.stream({ ...REQUEST, tier: "text" })) {
        received.push(chunk);
      }
    }

    await expect(consume()).rejects.toBeDefined();
    expect(received).toEqual(["Hel"]);
  });
});
