// Jest setup for React Native Testing Library
// Note: @testing-library/react-native v12.4+ has built-in Jest matchers
// No need to import extend-expect separately

// Mock react-native-reanimated
require('react-native-reanimated').setUpTests();

// Global mocks for common dependencies
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
  withUniwind: (Component) => Component,
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
