import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Application from "expo-application";
import { getDeviceId } from "./device-id";

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
  },
}));

// Mock expo-application
jest.mock("expo-application", () => ({
  androidId: "mock-android-id-123",
  getIosIdForVendorAsync: jest.fn(() => Promise.resolve("mock-ios-id-456")),
}));

describe("Device ID Utility", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return stored device ID if it exists", async () => {
    const mockGetItem = AsyncStorage.getItem as jest.MockedFunction<
      typeof AsyncStorage.getItem
    >;
    mockGetItem.mockResolvedValue("stored-device-id");

    const deviceId = await getDeviceId();

    expect(deviceId).toBe("stored-device-id");
    expect(AsyncStorage.getItem).toHaveBeenCalledWith("deviceId");
    expect(AsyncStorage.setItem).not.toHaveBeenCalled();
  });

  it("should generate and store Android ID if no stored ID exists", async () => {
    const mockGetItem = AsyncStorage.getItem as jest.MockedFunction<
      typeof AsyncStorage.getItem
    >;
    const mockSetItem = AsyncStorage.setItem as jest.MockedFunction<
      typeof AsyncStorage.setItem
    >;
    mockGetItem.mockResolvedValue(null);
    mockSetItem.mockResolvedValue(undefined);

    const deviceId = await getDeviceId();

    expect(deviceId).toBe("mock-android-id-123");
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      "deviceId",
      "mock-android-id-123"
    );
  });

  it("should fallback to iOS ID if Android ID is not available", async () => {
    const mockGetItem = AsyncStorage.getItem as jest.MockedFunction<
      typeof AsyncStorage.getItem
    >;
    const mockSetItem = AsyncStorage.setItem as jest.MockedFunction<
      typeof AsyncStorage.setItem
    >;
    mockGetItem.mockResolvedValue(null);
    mockSetItem.mockResolvedValue(undefined);

    // Mock Android ID as null to simulate iOS
    (Application as any).androidId = null;

    const deviceId = await getDeviceId();

    expect(deviceId).toBe("mock-ios-id-456");
    expect(Application.getIosIdForVendorAsync).toHaveBeenCalled();
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      "deviceId",
      "mock-ios-id-456"
    );
  });

  it("should handle errors gracefully", async () => {
    const mockGetItem = AsyncStorage.getItem as jest.MockedFunction<
      typeof AsyncStorage.getItem
    >;
    mockGetItem.mockRejectedValue(new Error("Storage error"));

    await expect(getDeviceId()).rejects.toThrow("Storage error");
  });

  it("should persist the same ID across multiple calls", async () => {
    const mockGetItem = AsyncStorage.getItem as jest.MockedFunction<
      typeof AsyncStorage.getItem
    >;
    mockGetItem.mockResolvedValue("persisted-id");

    const id1 = await getDeviceId();
    const id2 = await getDeviceId();

    expect(id1).toBe(id2);
    expect(id1).toBe("persisted-id");
  });
});
