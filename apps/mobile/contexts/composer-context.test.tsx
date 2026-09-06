import { ChatProvider } from "@/contexts/chat-context";
import { ComposerProvider, useComposer } from "@/contexts/composer-context";
import { MessageListProvider, useMessageList } from "@/contexts/message-list-context";
import {
  __setPlantIntelligenceForTests,
  createFakeIntelligence,
  type AIFailure,
  type ChatInput,
  type Result,
} from "@/src/intelligence";
import { __setCachedDeviceIdForTesting } from "@/utils/device";
import { useQuery, useStore } from "@livestore/react";
import { act, renderHook } from "@testing-library/react-native";

jest.mock("expo-router", () => ({
  useLocalSearchParams: () => ({ plantId: "plant-1" }),
}));

jest.mock("@/utils/photo-utils", () => ({
  pickImageFromLibrary: jest.fn(),
  showPhotoPickerAlert: jest.fn(),
  takePhotoWithCamera: jest.fn(),
}));

let commit = jest.fn();
let fern = { id: "plant-1", name: "Fern", description: "A shy fern" };

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <ChatProvider>
      <MessageListProvider>
        <ComposerProvider>{children}</ComposerProvider>
      </MessageListProvider>
    </ChatProvider>
  );
}

function renderComposer() {
  return renderHook(
    () => ({ composer: useComposer(), isGenerating: useMessageList().isGenerating }),
    { wrapper }
  );
}

function committedMessages() {
  return commit.mock.calls.map(([event]) => event.data);
}

beforeEach(() => {
  __setCachedDeviceIdForTesting("test-device");
  (useStore as jest.Mock).mockReturnValue({ store: { commit } });
  (useQuery as jest.Mock).mockImplementation((query: { label: string }) =>
    query.label.startsWith("plant-") ? [fern] : []
  );
});

test("sending commits the owner's message, asks the plant through the seam, then commits its reply", async () => {
  let seen: ChatInput | undefined;
  let answer!: (result: Result<string, AIFailure>) => void;
  __setPlantIntelligenceForTests({
    ...createFakeIntelligence(),
    generateChatResponse(input) {
      seen = input;
      return new Promise((resolve) => (answer = resolve));
    },
  });
  let { result } = renderComposer();

  act(() => result.current.composer.setInputText("  Hello Fern  "));
  let send!: Promise<void>;
  act(() => {
    send = result.current.composer.handleSend();
  });

  expect(result.current.composer.inputText).toBe("");
  expect(result.current.isGenerating).toBe(true);
  expect(committedMessages()).toEqual([
    expect.objectContaining({
      plantId: "plant-1",
      userId: "test-device",
      role: "user",
      content: "Hello Fern",
    }),
  ]);
  expect(seen?.plantContext).toEqual(
    expect.objectContaining({ name: "Fern", description: "A shy fern" })
  );
  expect(seen?.messages.at(-1)).toEqual(
    expect.objectContaining({ role: "user", content: "Hello Fern" })
  );

  // A second send while the plant is still composing is ignored.
  act(() => result.current.composer.setInputText("Are you there?"));
  await act(() => result.current.composer.handleSend());
  expect(committedMessages()).toHaveLength(1);

  await act(async () => {
    answer({ ok: true, value: "Hello back!" });
    await send;
  });

  expect(result.current.isGenerating).toBe(false);
  expect(committedMessages().at(-1)).toEqual(
    expect.objectContaining({ plantId: "plant-1", role: "assistant", content: "Hello back!" })
  );
});

test.each([
  ["no-config", "I need to be set up first. Please configure your AI settings."],
  ["quota", "The plant is resting; try again later."],
] as const)("a %s failure lands as the plant's reply instead of throwing", async (kind, reply) => {
  __setPlantIntelligenceForTests(
    createFakeIntelligence({
      chatResponse: {
        ok: false,
        failure: { kind, message: "The plant is resting; try again later." },
      },
    })
  );
  let { result } = renderComposer();

  act(() => result.current.composer.setInputText("Hi"));
  await act(() => result.current.composer.handleSend());

  expect(result.current.isGenerating).toBe(false);
  expect(committedMessages().at(-1)).toEqual(
    expect.objectContaining({ role: "assistant", content: reply })
  );
});

test("a blank message is not sent", async () => {
  let ask = jest.fn();
  __setPlantIntelligenceForTests({ ...createFakeIntelligence(), generateChatResponse: ask });
  let { result } = renderComposer();

  act(() => result.current.composer.setInputText("   "));
  await act(() => result.current.composer.handleSend());

  expect(commit).not.toHaveBeenCalled();
  expect(ask).not.toHaveBeenCalled();
});
