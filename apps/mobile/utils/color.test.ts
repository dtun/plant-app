import { withAlpha } from "./color";

describe("utils/color", () => {
  describe("withAlpha", () => {
    test("expands 3-digit hex", () => {
      expect(withAlpha("#fff", 0)).toBe("rgba(255, 255, 255, 0)");
    });

    test("reads 6-digit hex", () => {
      expect(withAlpha("#151718", 0.5)).toBe("rgba(21, 23, 24, 0.5)");
    });

    test("drops an existing alpha channel from 8-digit hex", () => {
      expect(withAlpha("#15171880", 1)).toBe("rgba(21, 23, 24, 1)");
    });

    test("reads rgb() and rgba() strings", () => {
      expect(withAlpha("rgb(1, 2, 3)", 0)).toBe("rgba(1, 2, 3, 0)");
      expect(withAlpha("rgba(1,2,3,0.4)", 1)).toBe("rgba(1, 2, 3, 1)");
    });

    test("reads processed 0xAARRGGBB numbers", () => {
      expect(withAlpha(0xff151718, 0)).toBe("rgba(21, 23, 24, 0)");
    });

    test("returns null for colors it cannot decompose", () => {
      expect(withAlpha(undefined, 0)).toBeNull();
      expect(withAlpha("transparent", 0)).toBeNull();
      expect(withAlpha("#12345", 0)).toBeNull();
    });
  });
});
