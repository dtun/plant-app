import { fireEvent, render, screen } from "@testing-library/react-native";

import { PlantForm } from "./plant-form";

test("renders title", () => {
  render(<PlantForm />);
  expect(screen.getByText("About your plant")).toBeOnTheScreen();
});

test("renders plant type input field", () => {
  render(<PlantForm />);
  expect(
    screen.getByPlaceholderText("e.g., Succulent, Fern, Flowering Plant...")
  ).toBeOnTheScreen();
});

test("renders plant description input", () => {
  render(<PlantForm />);
  expect(screen.getByPlaceholderText("Describe your plant...")).toBeOnTheScreen();
});

test("can type in plant type field", () => {
  render(<PlantForm />);
  let input = screen.getByPlaceholderText("e.g., Succulent, Fern, Flowering Plant...");
  fireEvent.changeText(input, "Succulent");
  expect(input).toHaveDisplayValue("Succulent");
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
