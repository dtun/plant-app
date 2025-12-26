// Jest setup for React Native Testing Library
// Note: @testing-library/react-native v12.4+ has built-in Jest matchers
// No need to import extend-expect separately

// Mock react-native-reanimated
require("react-native-reanimated").setUpTests();

// Enable manual mocks from __mocks__ directories
// Jest will look for the implementation in the __mocks__ folder
jest.mock("uniwind");
jest.mock("expo-sqlite");
jest.mock("expo-constants");
jest.mock("@livestore/adapter-expo");
jest.mock("@livestore/livestore");
jest.mock("@livestore/react");
jest.mock("@/src/livestore/schema");
