import { render, screen } from "@testing-library/react-native";
import { useQuery } from "@livestore/react";

import ChatsScreen from "./chats";

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("@shopify/flash-list", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  let { FlatList } = require("react-native");
  return { FlashList: FlatList };
});

test("renders empty state when there are no plants", () => {
  (useQuery as jest.Mock).mockReturnValue([]);

  render(<ChatsScreen />);

  expect(screen.getByText("Name a plant to start chatting!")).toBeOnTheScreen();
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
