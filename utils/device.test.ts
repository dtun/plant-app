import {
  getDeviceId,
  __resetCachedDeviceIdForTesting,
  __setCachedDeviceIdForTesting,
} from "./device";

// Mocks are configured in jest.setup.js

describe("utils/device", () => {
  beforeEach(() => {
    __resetCachedDeviceIdForTesting();
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
