import { render, screen } from "@testing-library/react-native";

import { PlantForm } from "./plant-form";

describe("PlantForm - Title Positioning", () => {
  test("title is always visible", () => {
    render(<PlantForm />);
    expect(screen.getByText("About your plant")).toBeTruthy();
  });
});
