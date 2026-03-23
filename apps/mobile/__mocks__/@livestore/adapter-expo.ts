// Mock LiveStore adapter for Expo

export let makePersistedAdapter = jest.fn(() => ({
  connect: jest.fn(),
  disconnect: jest.fn(),
}));
