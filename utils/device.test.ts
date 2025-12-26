import Constants from "expo-constants";
import { getDeviceId } from "./device";

// Mock is configured in jest.setup.js
jest.mock("expo-constants");

describe("utils/device", () => {
  describe("getDeviceId", () => {
    test("returns sessionId when available", () => {
      let deviceId = getDeviceId();

      expect(deviceId).toBe("mock-session-id");
    });

    test("returns 'default' when sessionId is null", () => {
      (Constants as any).sessionId = null;

      let deviceId = getDeviceId();

      expect(deviceId).toBe("default");
    });

    test("returns 'default' when sessionId is undefined", () => {
      (Constants as any).sessionId = undefined;

      let deviceId = getDeviceId();

      expect(deviceId).toBe("default");
    });

    test("returns 'default' when sessionId is empty string", () => {
      (Constants as any).sessionId = "";

      let deviceId = getDeviceId();

      expect(deviceId).toBe("default");
    });

    test("always returns a string", () => {
      let deviceId = getDeviceId();

      expect(typeof deviceId).toBe("string");
    });

    test("never returns null or undefined", () => {
      (Constants as any).sessionId = null;

      let deviceId = getDeviceId();

      expect(deviceId).not.toBeNull();
      expect(deviceId).not.toBeUndefined();
    });
  });
});
