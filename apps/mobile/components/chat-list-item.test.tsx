import { render, screen, fireEvent } from "@testing-library/react-native";

import { ChatListItem } from "./chat-list-item";

let defaultProps = {
  id: "plant-1",
  name: "Snake Plant",
  photoUri: null as string | null,
  lastMessageContent: "Hello!",
  lastMessageCreatedAt: Date.now(),
  onPress: jest.fn(),
  onDelete: jest.fn(),
};

test("renders InitialsAvatar when plant has no image", () => {
  render(<ChatListItem {...defaultProps} photoUri={null} />);

  expect(screen.getByTestId("initials-avatar")).toBeOnTheScreen();
  expect(screen.getByText("SP")).toBeOnTheScreen();
});

test("renders plant image when photoUri is provided", () => {
  render(<ChatListItem {...defaultProps} photoUri="https://example.com/photo.jpg" />);

  expect(screen.getByTestId("initials-avatar")).toBeOnTheScreen();
  expect(screen.getByLabelText("Photo of Snake Plant")).toBeOnTheScreen();
});

test("InitialsAvatar size matches the chat list image size of 48px", () => {
  render(<ChatListItem {...defaultProps} photoUri={null} />);

  let avatar = screen.getByTestId("initials-avatar");
  expect(avatar.props.style.width).toBe(48);
  expect(avatar.props.style.height).toBe(48);
});

test("image starts hidden and shows after onLoad", () => {
  render(<ChatListItem {...defaultProps} photoUri="https://example.com/photo.jpg" />);

  let image = screen.getByLabelText("Photo of Snake Plant");
  expect(image.props.style).toEqual(expect.objectContaining({ opacity: 0 }));

  fireEvent(image, "load");

  expect(image.props.style).toEqual(expect.objectContaining({ opacity: 1 }));
});

test("image is removed from tree when onError fires", () => {
  render(<ChatListItem {...defaultProps} photoUri="https://example.com/photo.jpg" />);

  let image = screen.getByLabelText("Photo of Snake Plant");
  fireEvent(image, "error");

  expect(screen.queryByLabelText("Photo of Snake Plant")).toBeNull();
  expect(screen.getByTestId("initials-avatar")).toBeOnTheScreen();
});

test("fallback InitialsAvatar is always visible with correct name", () => {
  render(<ChatListItem {...defaultProps} photoUri="https://example.com/photo.jpg" />);

  expect(screen.getByText("SP")).toBeOnTheScreen();
});

test("renders Delete context menu item", () => {
  render(<ChatListItem {...defaultProps} />);

  expect(screen.getByText("Delete")).toBeOnTheScreen();
});

test("Delete menu item calls onDelete with plant id", () => {
  let onDelete = jest.fn();
  render(<ChatListItem {...defaultProps} onDelete={onDelete} />);

  let deleteItem = screen.getByText("Delete").parent?.parent;
  fireEvent(deleteItem!, "touchEnd");

  expect(onDelete).toHaveBeenCalledWith("plant-1");
});
