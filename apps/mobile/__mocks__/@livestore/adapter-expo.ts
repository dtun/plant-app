// Mock LiveStore adapter for Expo

export const makePersistedAdapter = jest.fn(() => ({
  connect: jest.fn(),
  disconnect: jest.fn(),
}));
