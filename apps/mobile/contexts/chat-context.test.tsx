import { ChatProvider, useChatContext } from "@/contexts/chat-context";
import * as haptics from "@/utils/haptics";
import { useQuery, useStore } from "@livestore/react";
import { act, renderHook } from "@testing-library/react-native";
import { Alert } from "react-native";

jest.mock("expo-router", () => ({
  useLocalSearchParams: () => ({ plantId: "plant-1" }),
}));

let commit = jest.fn();
let fern = { id: "plant-1", name: "Fern" };

function wrapper({ children }: { children: React.ReactNode }) {
  return <ChatProvider>{children}</ChatProvider>;
}

function confirmClear() {
  let buttons = jest.mocked(Alert.alert).mock.calls[0][2] ?? [];
  buttons.find((button) => button.style === "destructive")?.onPress?.();
}

beforeEach(() => {
  (useStore as jest.Mock).mockReturnValue({ store: { commit } });
  (useQuery as jest.Mock).mockReturnValue([fern]);
  jest.spyOn(Alert, "alert").mockImplementation(() => {});
});

test("exposes the routed plant from the store", () => {
  let { result } = renderHook(() => useChatContext(), { wrapper });

  expect(result.current.plantId).toBe("plant-1");
  expect(result.current.plant).toEqual(fern);
});

test("clearing the chat asks first, then soft-deletes every message for the plant", () => {
  let { result } = renderHook(() => useChatContext(), { wrapper });

  act(() => result.current.handleClearChat());

  expect(Alert.alert).toHaveBeenCalledWith(
    "Clear Chat",
    "Are you sure you want to clear all messages with Fern?",
    expect.arrayContaining([expect.objectContaining({ text: "Clear", style: "destructive" })])
  );
  expect(commit).not.toHaveBeenCalled();

  act(() => confirmClear());

  expect(commit).toHaveBeenCalledWith({
    type: "v1.ChatCleared",
    data: { plantId: "plant-1", deletedAt: expect.any(Number) },
  });
  expect(haptics.success).toHaveBeenCalled();
});

test("falls back to generic copy while the plant has not loaded", () => {
  (useQuery as jest.Mock).mockReturnValue([]);
  let { result } = renderHook(() => useChatContext(), { wrapper });

  act(() => result.current.handleClearChat());

  expect(result.current.plant).toBeUndefined();
  expect(Alert.alert).toHaveBeenCalledWith(
    "Clear Chat",
    "Are you sure you want to clear all messages with this plant?",
    expect.any(Array)
  );
});
