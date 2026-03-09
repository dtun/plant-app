import { makePersistedAdapter } from "@livestore/adapter-expo";
import { __resetCachedDeviceIdForTesting, __setCachedDeviceIdForTesting } from "../utils/device";
import { createAdapter, getStoreId, useStore } from "./store";

// Mocks are set up in jest.setup.js

describe("db/store", () => {
  beforeEach(() => {
    __resetCachedDeviceIdForTesting();
    __setCachedDeviceIdForTesting("mock-device-id");
    jest.clearAllMocks();
  });

  describe("getStoreId", () => {
    test("should return keeptend-{deviceId} format", () => {
      let storeId = getStoreId();

      expect(storeId).toBe("keeptend-mock-device-id");
      expect(typeof storeId).toBe("string");
    });
  });

  describe("createAdapter", () => {
    test("should call makePersistedAdapter with sync disabled", () => {
      createAdapter();

      expect(makePersistedAdapter).toHaveBeenCalledWith(
        expect.objectContaining({
          sync: undefined,
        })
      );
    });

    test("should configure storage with correct storeId subdirectory", () => {
      createAdapter();

      expect(makePersistedAdapter).toHaveBeenCalledWith(
        expect.objectContaining({
          storage: {
            subDirectory: "keeptend-mock-device-id",
          },
        })
      );
    });

    test("should return the adapter created by makePersistedAdapter", () => {
      let mockAdapter = {
        connect: jest.fn(),
        disconnect: jest.fn(),
      };
      (makePersistedAdapter as jest.Mock).mockReturnValue(mockAdapter);

      let adapter = createAdapter();

      expect(adapter).toBe(mockAdapter);
    });

    test("should throw meaningful error when adapter creation fails", () => {
      let originalError = new Error("SQLite initialization failed");
      (makePersistedAdapter as jest.Mock).mockImplementation(() => {
        throw originalError;
      });

      expect(() => createAdapter()).toThrow("Failed to create adapter");
      expect(() => createAdapter()).toThrow("SQLite initialization failed");
    });

    test("should handle error with non-Error type", () => {
      (makePersistedAdapter as jest.Mock).mockImplementation(() => {
        throw "String error";
      });

      expect(() => createAdapter()).toThrow("Failed to create adapter");
      expect(() => createAdapter()).toThrow("Unknown error");
    });
  });

  describe("useStore", () => {
    test("should return result from @livestore/react useStore", () => {
      let result = useStore();

      expect(result).toEqual({ store: {} });
    });
  });
});
