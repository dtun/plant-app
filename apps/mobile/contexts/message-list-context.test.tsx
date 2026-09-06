import { ChatProvider } from "@/contexts/chat-context";
import { MessageListProvider, useMessageList } from "@/contexts/message-list-context";
import type { Message } from "@/src/livestore/queries";
import { useQuery } from "@livestore/react";
import { act, renderHook } from "@testing-library/react-native";

jest.mock("expo-router", () => ({
  useLocalSearchParams: () => ({ plantId: "plant-1" }),
}));

const DAY = 24 * 60 * 60 * 1000;
/** A fixed local-noon anchor so "earlier today" cannot slip into yesterday at midnight. */
const NOON = new Date(2026, 0, 15, 12).getTime();
let fern = { id: "plant-1", name: "Fern" };

function message(id: string, role: Message["role"], createdAt: number): Message {
  return { id, plantId: "plant-1", userId: "owner", role, content: id, imageUri: null, createdAt };
}

/** Answer each provider's query by its label rather than by call order. */
function stubStore(messages: Message[]) {
  (useQuery as jest.Mock).mockImplementation((query: { label: string }) =>
    query.label.startsWith("plant-") ? [fern] : messages
  );
}

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <ChatProvider>
      <MessageListProvider>{children}</MessageListProvider>
    </ChatProvider>
  );
}

test("surfaces the plant's messages with a separator wherever the day changes", () => {
  let messages = [
    message("yesterday", "user", NOON - DAY),
    message("earlier-today", "assistant", NOON - 1000),
    message("just-now", "user", NOON),
  ];
  stubStore(messages);

  let { result } = renderHook(() => useMessageList(), { wrapper });

  expect(result.current.messages).toEqual(messages);
  expect(
    result.current.listData.map((item) => (item.type === "message" ? item.message.id : "|"))
  ).toEqual(["|", "yesterday", "|", "earlier-today", "just-now"]);
});

test("appends a message when the store query grows", () => {
  let first = message("first", "user", NOON);
  stubStore([first]);

  let { result, rerender } = renderHook(() => useMessageList(), { wrapper });
  expect(result.current.messages).toHaveLength(1);

  stubStore([first, message("reply", "assistant", NOON + 1)]);
  rerender({});

  expect(result.current.messages.map((m) => m.id)).toEqual(["first", "reply"]);
  expect(result.current.listData.at(-1)).toEqual({
    type: "message",
    message: expect.objectContaining({ id: "reply" }),
  });
});

test("tracks whether the plant is composing a reply", () => {
  stubStore([]);
  let { result } = renderHook(() => useMessageList(), { wrapper });

  expect(result.current.isGenerating).toBe(false);

  act(() => result.current.setIsGenerating(true));

  expect(result.current.isGenerating).toBe(true);
});
