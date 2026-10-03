import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { useQuery } from "@livestore/react";

import ChatsScreen from "./chats";

let mockPush = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("@shopify/flash-list", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  let { FlatList } = require("react-native");
  return { FlashList: FlatList };
});

jest.mock("@/components/ui/icon-symbol", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  let { View } = require("react-native");
  return {
    IconSymbol: ({ name }: { name: string }) => <View testID={`iconSymbol-${name}`} />,
  };
});

function hostParentOf(element: ReturnType<typeof screen.getByTestId>) {
  let parent = element.parent;
  while (parent && typeof parent.type !== "string") {
    parent = parent.parent;
  }
  return parent!;
}

beforeEach(() => {
  mockPush.mockClear();
});

test("renders empty state when there are no plants", () => {
  (useQuery as jest.Mock).mockReturnValue([]);

  render(<ChatsScreen />);

  expect(screen.getByText("Name a plant to start chatting!")).toBeOnTheScreen();
});

test("empty state navigates to root screen on press", () => {
  (useQuery as jest.Mock).mockReturnValue([]);

  render(<ChatsScreen />);

  fireEvent.press(screen.getByRole("button", { name: "Name a plant to start chatting" }));

  expect(mockPush).toHaveBeenCalledWith("/");
});

test("empty state arrow hops up and back down on repeat", () => {
  jest.useFakeTimers();
  (useQuery as jest.Mock).mockReturnValue([]);

  render(<ChatsScreen />);
  let hoppingArrow = hostParentOf(screen.getByTestId("iconSymbol-arrow.up.right"));

  expect(hoppingArrow).toHaveAnimatedStyle({ transform: [{ translateY: 0 }] });

  act(() => jest.advanceTimersByTime(240));
  expect(hoppingArrow).toHaveAnimatedStyle({ transform: [{ translateY: -2.4 }] });

  act(() => jest.advanceTimersByTime(240));
  expect(hoppingArrow).toHaveAnimatedStyle({ transform: [{ translateY: 0 }] });

  act(() => jest.advanceTimersByTime(240));
  expect(hoppingArrow).toHaveAnimatedStyle({ transform: [{ translateY: -2.4 }] });

  jest.useRealTimers();
});

test("renders list items when plants with messages exist", () => {
  (useQuery as jest.Mock).mockReturnValue([
    {
      id: "plant-1",
      name: "Fern",
      photoUri: null,
      lastMessageContent: "Hello from Fern!",
      lastMessageCreatedAt: Date.now(),
    },
    {
      id: "plant-2",
      name: "Cactus",
      photoUri: null,
      lastMessageContent: "Stay sharp!",
      lastMessageCreatedAt: Date.now(),
    },
  ]);

  render(<ChatsScreen />);

  expect(screen.getByText("Fern")).toBeOnTheScreen();
  expect(screen.getByText("Hello from Fern!")).toBeOnTheScreen();
  expect(screen.getByText("Cactus")).toBeOnTheScreen();
  expect(screen.getByText("Stay sharp!")).toBeOnTheScreen();
});
