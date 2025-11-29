import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { analyzePhoto, checkQuota, generatePlantNameAPI } from "./api-client";

// Mock device ID
jest.mock("./device-id", () => ({
  getDeviceId: jest.fn(() => Promise.resolve("test-device-123")),
}));

// Mock global fetch
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

describe("API Client", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("analyzePhoto", () => {
    it("should call API with correct headers and body", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            result: { species: "Monstera", confidence: 0.95 },
            remaining: 9,
            isPremium: false,
          }),
      } as Response);

      const result = await analyzePhoto(
        "openai",
        "base64-image",
        "Identify plant"
      );

      expect(fetch).toHaveBeenCalledWith(
        "https://www.keeptend.com/api/ai/analyze",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            "X-Device-ID": "test-device-123",
          }),
          body: JSON.stringify({
            provider: "openai",
            image: "base64-image",
            prompt: "Identify plant",
          }),
        })
      );

      expect(result).toEqual({
        result: { species: "Monstera", confidence: 0.95 },
        remaining: 9,
        isPremium: false,
      });
    });

    it("should throw error on 402 payment required", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 402,
        json: () =>
          Promise.resolve({
            error: "Free limit reached",
            upgradeRequired: true,
            remaining: 0,
          }),
      } as Response);

      await expect(analyzePhoto("openai", "image", "prompt")).rejects.toThrow(
        "Free limit reached"
      );
    });

    it("should handle network errors", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"));

      await expect(analyzePhoto("openai", "image", "prompt")).rejects.toThrow(
        "Network error"
      );
    });

    it("should handle non-200 responses", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: "Internal server error" }),
      } as Response);

      await expect(analyzePhoto("openai", "image", "prompt")).rejects.toThrow(
        "Internal server error"
      );
    });
  });

  describe("generatePlantNameAPI", () => {
    it("should generate plant names via API", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            result: { names: ["Monty", "Leafy", "Greenbean"] },
            remaining: 8,
            isPremium: false,
          }),
      } as Response);

      const result = await generatePlantNameAPI(
        "openai",
        "Monstera",
        "large leaves",
        "whimsical"
      );

      expect(fetch).toHaveBeenCalledWith(
        "https://www.keeptend.com/api/ai/generate-name",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            provider: "openai",
            species: "Monstera",
            characteristics: "large leaves",
            style: "whimsical",
          }),
        })
      );

      expect(result.result.names).toHaveLength(3);
      expect(result.remaining).toBe(8);
    });

    it("should handle 402 for name generation", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 402,
        json: () =>
          Promise.resolve({
            error: "Free limit reached",
            upgradeRequired: true,
          }),
      } as Response);

      await expect(
        generatePlantNameAPI("openai", "Species", "chars", "style")
      ).rejects.toThrow("Free limit reached");
    });
  });

  describe("checkQuota", () => {
    it("should return quota information", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            remaining: 7,
            limit: 10,
            resetDate: "2025-11-26T00:00:00Z",
            isPremium: false,
          }),
      } as Response);

      const result = await checkQuota();

      expect(fetch).toHaveBeenCalledWith(
        "https://www.keeptend.com/api/user/quota",
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            "X-Device-ID": "test-device-123",
          }),
        })
      );

      expect(result.remaining).toBe(7);
      expect(result.limit).toBe(10);
      expect(result.isPremium).toBe(false);
    });

    it("should handle premium users", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            isPremium: true,
          }),
      } as Response);

      const result = await checkQuota();

      expect(result.isPremium).toBe(true);
      expect(result.remaining).toBeUndefined();
    });
  });
});
