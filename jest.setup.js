// Jest setup for React Native Testing Library
// Note: @testing-library/react-native v12.4+ has built-in Jest matchers
// No need to import extend-expect separately

// Mock react-native-reanimated
require('react-native-reanimated').setUpTests();

// Global mocks for common dependencies

jest.mock("uniwind", () => ({
  useResolveClassNames: () => ({ color: "#000000" }),
  withUniwind: (Component) => Component,
}));

// Mock expo-sqlite native module (used by ai-service.ts for localStorage polyfill)
jest.mock("expo-sqlite", () => ({
  openDatabaseSync: jest.fn(() => ({
    execSync: jest.fn(),
    closeSync: jest.fn(),
    withTransactionSync: jest.fn((callback) => callback()),
    getFirstSync: jest.fn(() => ({ user_version: 1 })),
    getAllSync: jest.fn(() => []),
    runSync: jest.fn(),
  })),
}));
