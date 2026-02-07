import { render, screen } from "@testing-library/react-native";
import { useQuery } from "@livestore/react";

import ChatScreen from "./[plantId]";

jest.mock("expo-router", () => ({
  useLocalSearchParams: () => ({ plantId: "plant-1" }),
  Stack: { Screen: () => null },
}));

jest.mock("@legendapp/list", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  let { FlatList } = require("react-native");
  return { LegendList: FlatList };
});

jest.mock("@/utils/photo-utils", () => ({
  pickImageFromLibrary: jest.fn(),
  showPhotoPickerAlert: jest.fn(),
  takePhotoWithCamera: jest.fn(),
}));

jest.mock("@/utils/ai-service", () => ({
  generateChatResponse: jest.fn(),
}));

jest.mock("@/utils/device", () => ({
  getDeviceId: () => "test-device",
}));

jest.mock("@/components/ui/chat-input", () => ({
  ChatInput: () => null,
}));

jest.mock("@/components/ui/photo-upload", () => ({
  PhotoUpload: () => null,
}));

jest.mock("@/components/ui/submit-button", () => ({
  SubmitButton: () => null,
}));

jest.mock("@/components/ui/icon-symbol", () => ({
  IconSymbol: () => null,
}));

jest.mock("@/components/message-bubble", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  let { Text } = require("react-native");
  return {
    MessageBubble: ({ content }: { content: string }) => <Text>{content}</Text>,
  };
});

jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));

test("renders empty state when there are no messages", () => {
  (useQuery as jest.Mock).mockReturnValue([]);

  render(<ChatScreen />);

  expect(screen.getByText("Say hello to your plant!")).toBeOnTheScreen();
});

test("renders without crashing when plant and messages exist", () => {
  let callCount = 0;
  (useQuery as jest.Mock).mockImplementation(() => {
    callCount++;
    // First call: plantById$ query returns plant
    if (callCount % 2 === 1) {
      return [{ id: "plant-1", name: "Fern" }];
    }
    // Second call: messagesByPlant$ query returns messages
    return [
      {
        id: "msg-1",
        plantId: "plant-1",
        role: "user",
        content: "Hello!",
        createdAt: Date.now(),
      },
      {
        id: "msg-2",
        plantId: "plant-1",
        role: "assistant",
        content: "Hi there!",
        createdAt: Date.now(),
      },
    ];
  });

  render(<ChatScreen />);

  expect(screen.getByText("Hello!")).toBeOnTheScreen();
  expect(screen.getByText("Hi there!")).toBeOnTheScreen();
});
