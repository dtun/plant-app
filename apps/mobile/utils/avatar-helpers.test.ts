import { getInitials } from "./avatar-helpers";

describe("utils/avatar-helpers", () => {
  describe("getInitials", () => {
    test("single-word name returns first letter capitalized", () => {
      expect(getInitials("monstera")).toBe("M");
    });

    test("multi-word name returns first letter of each word capitalized", () => {
      expect(getInitials("Snake Plant")).toBe("SP");
    });

    test("handles lowercase multi-word names", () => {
      expect(getInitials("fiddle leaf fig")).toBe("FLF");
    });

    test("returns empty string for empty input", () => {
      expect(getInitials("")).toBe("");
    });

    test("handles extra whitespace between words", () => {
      expect(getInitials("  snake   plant  ")).toBe("SP");
    });

    test("handles single character name", () => {
      expect(getInitials("m")).toBe("M");
    });

    test("handles already capitalized single word", () => {
      expect(getInitials("Monstera")).toBe("M");
    });
  });
});
