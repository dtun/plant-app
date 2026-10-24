import type { ChatStreamEvent } from "./contract";
import { EMPTY_RESPONSE_FAILURE, toFailure } from "./failures";

function toNdjsonStream(source: AsyncIterable<string>): ReadableStream<Uint8Array> {
  let encoder = new TextEncoder();
  let iterator = source[Symbol.asyncIterator]();
  let text = "";

  function encode(event: ChatStreamEvent): Uint8Array {
    return encoder.encode(`${JSON.stringify(event)}\n`);
  }

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        // A pull that enqueues nothing is never retried, so skip empty chunks inside it.
        for (;;) {
          let step = await iterator.next();
          if (step.done) {
            break;
          }
          if (step.value) {
            text += step.value;
            controller.enqueue(encode({ type: "token", text: step.value }));
            return;
          }
        }

        let full = text.trim();
        controller.enqueue(
          encode(
            full ? { type: "done", text: full } : { type: "error", error: EMPTY_RESPONSE_FAILURE }
          )
        );
      } catch (error) {
        controller.enqueue(encode({ type: "error", error: toFailure(error) }));
      }
      controller.close();
    },

    cancel() {
      // Not awaited: a return() queued behind a pending next() would hold the cancel open.
      iterator.return?.().catch(() => {});
    },
  });
}

export function ndjsonResponse(source: AsyncIterable<string>): Response {
  return new Response(toNdjsonStream(source), {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
