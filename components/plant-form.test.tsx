import { render, screen } from "@testing-library/react-native";

import { PlantForm } from "./plant-form";

// Mock dependencies
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({
    setOptions: jest.fn(),
  }),
}));

jest.mock("expo-router", () => ({
  router: {
    push: jest.fn(),
  },
}));

jest.mock("uniwind", () => ({
  useResolveClassNames: () => ({ color: "#000000" }),
  withUniwind: (Component: any) => Component,
}));

jest.mock("@/utils/photo-utils", () => ({
  pickImageFromLibrary: jest.fn(),
  showPhotoPickerAlert: jest.fn(),
  takePhotoWithCamera: jest.fn(),
}));

jest.mock("@/utils/ai-service", () => ({
  analyzePhotoAndSetDescription: jest.fn(),
  generatePlantName: jest.fn(),
}));

describe("PlantForm - Title Positioning", () => {
  test("title is always visible", () => {
    render(<PlantForm />);
    expect(screen.getByText("About your plant")).toBeTruthy();
  });
});
