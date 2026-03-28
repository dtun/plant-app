import { render, screen, fireEvent } from "@testing-library/react-native";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { Alert } from "react-native";
import { useStore } from "@livestore/react";
import { events } from "@/src/livestore/schema";
import { MessageBubble } from "./message-bubble";

let mockCommit = jest.fn();

beforeEach(() => {
  mockCommit.mockClear();
  jest.mocked(events).messageDeleted = jest.fn((args) => ({
    type: "v1.MessageDeleted",
    ...args,
  })) as any;
  (useStore as jest.Mock).mockReturnValue({ store: { commit: mockCommit } });
  jest.spyOn(Alert, "alert");
});

test("renders Copy and Delete menu items", () => {
  render(<MessageBubble id="msg-1" role="user" content="Hello!" />);

  expect(screen.getByText("Copy")).toBeOnTheScreen();
  expect(screen.getByText("Delete")).toBeOnTheScreen();
});

test("copy action copies message content to clipboard", () => {
  render(<MessageBubble id="msg-1" role="user" content="Hello world" />);

  let copyItem = screen.getByText("Copy").parent?.parent;
  fireEvent(copyItem!, "touchEnd");

  expect(Clipboard.setStringAsync).toHaveBeenCalledWith("Hello world");
  expect(Haptics.notificationAsync).toHaveBeenCalledWith(Haptics.NotificationFeedbackType.Success);
});

test("delete action shows confirmation alert", () => {
  render(<MessageBubble id="msg-1" role="user" content="Hello!" />);

  let deleteItem = screen.getByText("Delete").parent?.parent;
  fireEvent(deleteItem!, "touchEnd");

  expect(Alert.alert).toHaveBeenCalledWith(
    "Delete Message",
    "Are you sure you want to delete this message?",
    expect.arrayContaining([
      expect.objectContaining({ text: "Cancel", style: "cancel" }),
      expect.objectContaining({ text: "Delete", style: "destructive" }),
    ])
  );
});

test("confirming delete commits messageDeleted event", () => {
  render(<MessageBubble id="msg-1" role="user" content="Hello!" />);

  let deleteItem = screen.getByText("Delete").parent?.parent;
  fireEvent(deleteItem!, "touchEnd");

  // Get the destructive button's onPress from the Alert.alert call
  let alertButtons = (Alert.alert as jest.Mock).mock.calls[0][2];
  let deleteButton = alertButtons.find((b: any) => b.style === "destructive");
  deleteButton.onPress();

  expect(mockCommit).toHaveBeenCalledWith(
    events.messageDeleted({ id: "msg-1", deletedAt: expect.any(Number) })
  );
});

test("renders message content and image", () => {
  render(
    <MessageBubble
      id="msg-1"
      role="user"
      content="Check this out"
      imageUri="https://example.com/photo.jpg"
    />
  );

  expect(screen.getByText("Check this out")).toBeOnTheScreen();
  expect(screen.getByLabelText("Photo sent in chat")).toBeOnTheScreen();
});
