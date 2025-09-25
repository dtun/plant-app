import { render, screen } from "@testing-library/react-native";

import { ThemedText } from "./themed-text";

test("renders correctly", () => {
  render(<ThemedText>Hello</ThemedText>);
  expect(screen.getByText("Hello")).toBeTruthy();
});
