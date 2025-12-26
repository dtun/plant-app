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

// Mock LiveStore modules for testing
jest.mock("@livestore/adapter-expo", () => ({
  makePersistedAdapter: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
  })),
}));

jest.mock("@livestore/react", () => ({
  LiveStoreProvider: ({ children }) => children,
  useQuery: jest.fn(() => []),
  useClientDocument: jest.fn(() => ({})),
  useStore: jest.fn(() => ({ store: {} })),
}));

// Mock expo-constants for db/store.ts testing
let mockConstants = {
  sessionId: 'mock-session-id',
};

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: mockConstants,
  Constants: mockConstants,
}));
