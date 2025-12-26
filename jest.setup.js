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

jest.mock("@livestore/livestore", () => ({
  Events: {
    synced: jest.fn((config) => config),
  },
  Schema: {
    Struct: jest.fn((schema) => schema),
    String: "string",
    Number: "number",
    Boolean: "boolean",
    optional: jest.fn((type) => ({ optional: true, type })),
  },
  State: {
    SQLite: {
      table: jest.fn((config) => config),
      text: jest.fn((options) => ({ type: "text", ...options })),
      integer: jest.fn((options) => ({ type: "integer", ...options })),
      boolean: jest.fn((options) => ({ type: "boolean", ...options })),
      makeState: jest.fn((config) => config),
      materializers: jest.fn((events, materializers) => materializers),
    },
  },
  makeSchema: jest.fn((config) => config),
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

// Mock schema events and tables
jest.mock('@/src/livestore/schema', () => ({
  events: {
    userCreated: jest.fn((data) => ({
      type: 'v1.UserCreated',
      data,
    })),
    userUpdated: jest.fn((data) => ({
      type: 'v1.UserUpdated',
      data,
    })),
    usageRecorded: jest.fn((data) => ({
      type: 'v1.UsageRecorded',
      data,
    })),
    plantCreated: jest.fn((data) => ({
      type: 'v1.PlantCreated',
      data,
    })),
    plantUpdated: jest.fn((data) => ({
      type: 'v1.PlantUpdated',
      data,
    })),
    plantDeleted: jest.fn((data) => ({
      type: 'v1.PlantDeleted',
      data,
    })),
    messageCreated: jest.fn((data) => ({
      type: 'v1.MessageCreated',
      data,
    })),
  },
  tables: {
    user: {
      where: jest.fn((conditions) => ({ __table: 'user', __conditions: conditions })),
    },
    usage: {
      where: jest.fn((conditions) => ({ __table: 'usage', __conditions: conditions })),
    },
    plants: {
      where: jest.fn((conditions) => ({ __table: 'plants', __conditions: conditions })),
    },
    chatMessages: {
      where: jest.fn((conditions) => ({ __table: 'chatMessages', __conditions: conditions })),
    },
  },
  schema: {},
}));
