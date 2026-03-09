// Mock expo-constants for db/store.ts testing
// Note: Using 'let' to allow tests to modify the mock if needed

let mockConstants = {
  sessionId: "mock-session-id",
};

export default mockConstants;
export const Constants = mockConstants;
