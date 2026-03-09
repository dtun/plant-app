// Mock for expo-crypto

let mockUuidCounter = 0;

export function randomUUID(): string {
  mockUuidCounter++;
  return `mock-uuid-${mockUuidCounter}`;
}

// Helper function for tests to reset state
export function __resetMockCrypto(): void {
  mockUuidCounter = 0;
}
