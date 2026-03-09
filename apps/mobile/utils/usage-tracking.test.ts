import { __resetCachedDeviceIdForTesting, __setCachedDeviceIdForTesting } from "./device";
import {
  canGenerateName,
  getCurrentUsage,
  incrementUsage,
  resetMonthlyUsage,
} from "./usage-tracking";

describe("utils/usage-tracking", () => {
  let mockStore: any;

  function mockQueryResponses(userResult: any[], usageResult: any[]) {
    mockStore.query.mockImplementation((tableQuery: any) => {
      if (tableQuery.__table === "user") {
        return userResult;
      }
      if (tableQuery.__table === "usage") {
        return usageResult;
      }
      return [];
    });
  }

  beforeEach(() => {
    __resetCachedDeviceIdForTesting();
    __setCachedDeviceIdForTesting("mock-device-id");

    mockStore = {
      commit: jest.fn().mockResolvedValue(undefined),
      query: jest.fn(() => []),
    };
  });

  describe("canGenerateName", () => {
    test("free tier with no usage allows generation", async () => {
      mockQueryResponses([{ id: "mock-device-id", tier: "free" }], []);

      let result = await canGenerateName(mockStore);

      expect(result).toEqual({
        allowed: true,
        remaining: 3,
        tier: "free",
      });
    });

    test("free tier at limit blocks generation", async () => {
      mockQueryResponses(
        [{ id: "mock-device-id", tier: "free" }],
        [{ id: "mock-device-id-2025-12", count: 3 }]
      );

      let result = await canGenerateName(mockStore);

      expect(result).toEqual({
        allowed: false,
        remaining: 0,
        tier: "free",
      });
    });

    test("pro tier always allows generation", async () => {
      mockQueryResponses(
        [{ id: "mock-device-id", tier: "pro" }],
        [{ id: "mock-device-id-2025-12", count: 100 }]
      );

      let result = await canGenerateName(mockStore);

      expect(result).toEqual({
        allowed: true,
        remaining: -1,
        tier: "pro",
      });
    });

    test("new user gets created as free tier", async () => {
      mockQueryResponses([], []);

      let result = await canGenerateName(mockStore);

      expect(mockStore.commit).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "v1.UserCreated",
          data: expect.objectContaining({
            tier: "free",
          }),
        })
      );
      expect(result).toEqual({
        allowed: true,
        remaining: 3,
        tier: "free",
      });
    });
  });

  describe("incrementUsage", () => {
    test("first usage records count of 1", async () => {
      mockQueryResponses([{ id: "mock-device-id", tier: "free" }], []);

      await incrementUsage(mockStore);

      expect(mockStore.commit).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "v1.UsageRecorded",
          data: expect.objectContaining({
            count: 1,
          }),
        })
      );
    });

    test("subsequent usage increments count", async () => {
      mockQueryResponses(
        [{ id: "mock-device-id", tier: "free" }],
        [{ id: "mock-device-id-2025-12", count: 2 }]
      );

      await incrementUsage(mockStore);

      expect(mockStore.commit).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "v1.UsageRecorded",
          data: expect.objectContaining({
            count: 3,
          }),
        })
      );
    });
  });

  describe("getCurrentUsage", () => {
    test("returns zero when no usage exists", async () => {
      mockQueryResponses([{ id: "mock-device-id", tier: "free" }], []);

      let result = await getCurrentUsage(mockStore);

      expect(result).toMatchObject({
        count: 0,
        tier: "free",
      });
      expect(result.month).toMatch(/^\d{4}-\d{2}$/);
    });

    test("returns existing usage count", async () => {
      mockQueryResponses(
        [{ id: "mock-device-id", tier: "free" }],
        [{ id: "mock-device-id-2025-12", count: 2 }]
      );

      let result = await getCurrentUsage(mockStore);

      expect(result).toMatchObject({
        count: 2,
        tier: "free",
      });
    });
  });

  describe("resetMonthlyUsage", () => {
    test("commits usage record with count of zero", async () => {
      mockQueryResponses([{ id: "mock-device-id", tier: "free" }], []);

      await resetMonthlyUsage(mockStore);

      expect(mockStore.commit).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "v1.UsageRecorded",
          data: expect.objectContaining({
            count: 0,
          }),
        })
      );
    });
  });
});
