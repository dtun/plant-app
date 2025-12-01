import { render, screen } from "@testing-library/react-native";

import { PlantForm } from "./plant-form";

test("title is always visible", () => {
  render(<PlantForm />);

  expect(screen.getByText("About your plant")).toBeOnTheScreen();
});
