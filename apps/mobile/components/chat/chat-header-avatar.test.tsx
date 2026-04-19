import { render, screen, fireEvent } from "@testing-library/react-native";

import { ChatHeaderAvatar } from "./chat-header-avatar";

test("renders first letter of name when photoUri is null", () => {
  render(<ChatHeaderAvatar name="Minty Cream" photoUri={null} />);

  expect(screen.getByText("M")).toBeOnTheScreen();
});

test("uppercases the first letter even when name starts lowercase", () => {
  render(<ChatHeaderAvatar name="fern" photoUri={null} />);

  expect(screen.getByText("F")).toBeOnTheScreen();
});

test("renders plant image when photoUri is provided", () => {
  render(<ChatHeaderAvatar name="Snake Plant" photoUri="https://example.com/photo.jpg" />);

  expect(screen.getByLabelText("Photo of Snake Plant")).toBeOnTheScreen();
});

test("first-letter fallback remains in the tree even when image is provided", () => {
  render(<ChatHeaderAvatar name="Snake Plant" photoUri="https://example.com/photo.jpg" />);

  expect(screen.getByText("S")).toBeOnTheScreen();
});

test("image starts hidden and fades in after onLoad", () => {
  render(<ChatHeaderAvatar name="Snake Plant" photoUri="https://example.com/photo.jpg" />);

  let image = screen.getByLabelText("Photo of Snake Plant");
  expect(image.props.style).toEqual(expect.objectContaining({ opacity: 0 }));

  fireEvent(image, "load");

  expect(image.props.style).toEqual(expect.objectContaining({ opacity: 1 }));
});

test("falls back to first letter when image load errors", () => {
  render(<ChatHeaderAvatar name="Snake Plant" photoUri="https://example.com/photo.jpg" />);

  let image = screen.getByLabelText("Photo of Snake Plant");
  fireEvent(image, "error");

  expect(screen.queryByLabelText("Photo of Snake Plant")).toBeNull();
  expect(screen.getByText("S")).toBeOnTheScreen();
});

test("renders first letter when name has leading whitespace", () => {
  render(<ChatHeaderAvatar name="  Aloe" photoUri={null} />);

  expect(screen.getByText("A")).toBeOnTheScreen();
});

test("renders nothing as letter when name is empty", () => {
  render(<ChatHeaderAvatar name="" photoUri={null} />);

  expect(screen.getByTestId("chat-header-avatar")).toBeOnTheScreen();
});
