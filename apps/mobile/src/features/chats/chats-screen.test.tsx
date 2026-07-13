import { fireEvent, render, screen } from "@testing-library/react-native";
import { useQuery } from "@livestore/react";

import { ChatsScreen } from "./chats-screen";

jest.mock("@shopify/flash-list", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  let { FlatList } = require("react-native");
  return { FlashList: FlatList };
});

jest.mock("@/components/ui/icon-symbol", () => ({
  IconSymbol: () => null,
}));

let onPlantPress = jest.fn();
let onAddPlant = jest.fn();

beforeEach(() => {
  onPlantPress.mockClear();
  onAddPlant.mockClear();
});

test("renders empty state when there are no plants", () => {
  (useQuery as jest.Mock).mockReturnValue([]);

  render(<ChatsScreen onPlantPress={onPlantPress} onAddPlant={onAddPlant} />);

  expect(screen.getByText("Name a plant to start chatting!")).toBeOnTheScreen();
});

test("empty state CTA calls onAddPlant", () => {
  (useQuery as jest.Mock).mockReturnValue([]);

  render(<ChatsScreen onPlantPress={onPlantPress} onAddPlant={onAddPlant} />);

  fireEvent.press(screen.getByRole("button", { name: "Name a plant to start chatting" }));

  expect(onAddPlant).toHaveBeenCalledTimes(1);
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

  render(<ChatsScreen onPlantPress={onPlantPress} onAddPlant={onAddPlant} />);

  expect(screen.getByText("Fern")).toBeOnTheScreen();
  expect(screen.getByText("Hello from Fern!")).toBeOnTheScreen();
  expect(screen.getByText("Cactus")).toBeOnTheScreen();
  expect(screen.getByText("Stay sharp!")).toBeOnTheScreen();
});

test("pressing a chat row calls onPlantPress with the plant id", () => {
  (useQuery as jest.Mock).mockReturnValue([
    {
      id: "plant-1",
      name: "Fern",
      photoUri: null,
      lastMessageContent: "Hello from Fern!",
      lastMessageCreatedAt: Date.now(),
    },
  ]);

  render(<ChatsScreen onPlantPress={onPlantPress} onAddPlant={onAddPlant} />);

  fireEvent.press(screen.getByRole("button", { name: "Chat with Fern" }));

  expect(onPlantPress).toHaveBeenCalledWith("plant-1");
});
