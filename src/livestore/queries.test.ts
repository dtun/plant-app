import { plantById$, messagesByPlant$, plantsWithLastMessage$ } from "./queries";

describe("livestore/queries", () => {
  describe("plantsWithLastMessage$", () => {
    test("is a static query with expected label", () => {
      expect(plantsWithLastMessage$).toHaveProperty("label", "plantsWithLastMessage");
    });

    test("has a query string", () => {
      expect((plantsWithLastMessage$ as any).query).toBeDefined();
    });
  });

  describe("plantById$", () => {
    test("returns a query with label containing the plantId", () => {
      let query = plantById$("abc-123") as any;

      expect(query.label).toBe("plant-abc-123");
    });

    test("has a query string referencing the plantId", () => {
      let query = plantById$("abc-123") as any;

      expect(query.query).toContain("abc-123");
    });
  });

  describe("messagesByPlant$", () => {
    test("returns a query with label containing the plantId", () => {
      let query = messagesByPlant$("xyz-456") as any;

      expect(query.label).toBe("chatMessages-xyz-456");
    });

    test("has a query string referencing the plantId", () => {
      let query = messagesByPlant$("xyz-456") as any;

      expect(query.query).toContain("xyz-456");
    });
  });
});
