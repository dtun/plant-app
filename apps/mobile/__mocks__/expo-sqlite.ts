// Mock expo-sqlite native module (used by ai-service.ts for localStorage polyfill)

let mockDatabase = {
  execSync: jest.fn(),
  closeSync: jest.fn(),
  withTransactionSync: jest.fn((callback: () => void) => callback()),
  getFirstSync: jest.fn(() => ({ user_version: 1 })),
  getAllSync: jest.fn(() => []),
  runSync: jest.fn(),
};

export const openDatabaseSync = jest.fn(() => mockDatabase);

// Mock NativeDatabase class as a constructor
export class NativeDatabase {
  constructor() {
    return mockDatabase as any;
  }
}

// Export as default as well for default imports
export default {
  openDatabaseSync,
  NativeDatabase,
};
