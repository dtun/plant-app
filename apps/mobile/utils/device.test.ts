import {
  getDeviceId,
  initializeDeviceId,
  __resetCachedDeviceIdForTesting,
  __setCachedDeviceIdForTesting,
} from "./device";

let mockCrypto = jest.requireMock("expo-crypto") as {
  __resetMockCrypto: () => void;
};
let mockFileSystem = jest.requireMock("expo-file-system") as {
  __resetMockFileSystem: () => void;
};

// Mocks are configured in jest.setup.js

describe("utils/device", () => {
  beforeEach(() => {
    __resetCachedDeviceIdForTesting();
    mockCrypto.__resetMockCrypto();
    mockFileSystem.__resetMockFileSystem();
  });

  describe("getDeviceId", () => {
    test("returns the device ID after setting via test helper", () => {
      __setCachedDeviceIdForTesting("test-device-id-123");
      let deviceId = getDeviceId();

      expect(deviceId).toBe("test-device-id-123");
    });

    test("throws error if called before initialization", () => {
      expect(() => getDeviceId()).toThrow(
        "Device ID not initialized. Call initializeDeviceId() first."
      );
    });

    test("always returns a string", () => {
      __setCachedDeviceIdForTesting("another-test-id");
      let deviceId = getDeviceId();

      expect(typeof deviceId).toBe("string");
    });

    test("never returns null or undefined after initialization", () => {
      __setCachedDeviceIdForTesting("valid-id");
      let deviceId = getDeviceId();

      expect(deviceId).not.toBeNull();
      expect(deviceId).not.toBeUndefined();
    });
  });

  describe("initializeDeviceId", () => {
    test("returns cached ID without re-reading file", async () => {
      let firstId = await initializeDeviceId();
      let secondId = await initializeDeviceId();

      expect(firstId).toBe(secondId);
    });

    test("persists generated ID to storage", async () => {
      await initializeDeviceId();

      __resetCachedDeviceIdForTesting();
      let deviceId = await initializeDeviceId();

      expect(deviceId).toBe("mock-uuid-1");
    });

    test("reads existing ID from storage", async () => {
      let deviceId = await initializeDeviceId();

      __resetCachedDeviceIdForTesting();
      let loadedId = await initializeDeviceId();

      expect(loadedId).toBe(deviceId);
    });
  });

  describe("test helpers", () => {
    test("__resetCachedDeviceIdForTesting clears the cached ID", () => {
      __setCachedDeviceIdForTesting("some-id");
      expect(getDeviceId()).toBe("some-id");

      __resetCachedDeviceIdForTesting();
      expect(() => getDeviceId()).toThrow(
        "Device ID not initialized. Call initializeDeviceId() first."
      );
    });

    test("__setCachedDeviceIdForTesting sets the cached ID", () => {
      __setCachedDeviceIdForTesting("first-id");
      expect(getDeviceId()).toBe("first-id");

      __setCachedDeviceIdForTesting("second-id");
      expect(getDeviceId()).toBe("second-id");
    });
  });
});
