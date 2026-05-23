import { fireEvent, render, screen } from "@testing-library/react-native";

import { PlantForm } from "./plant-form";

test("renders plant description input", () => {
  render(<PlantForm />);
  expect(screen.getByPlaceholderText("Describe your plant...")).toBeOnTheScreen();
});

test("can type in plant description field", () => {
  render(<PlantForm />);
  let input = screen.getByPlaceholderText("Describe your plant...");
  fireEvent.changeText(input, "Small green succulent with thick leaves");
  expect(input).toHaveDisplayValue("Small green succulent with thick leaves");
});

test("renders submit button", () => {
  render(<PlantForm />);
  expect(screen.getByLabelText("Submit")).toBeOnTheScreen();
});
