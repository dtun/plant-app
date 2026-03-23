import { getInitials, getAvatarColor } from "./avatar-helpers";

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

  describe("getAvatarColor", () => {
    test("returns a hex color string", () => {
      let color = getAvatarColor("Monstera");
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });

    test("returns the same color for the same name", () => {
      let color1 = getAvatarColor("Snake Plant");
      let color2 = getAvatarColor("Snake Plant");
      expect(color1).toBe(color2);
    });

    test("is case-insensitive", () => {
      let color1 = getAvatarColor("Monstera");
      let color2 = getAvatarColor("monstera");
      expect(color1).toBe(color2);
    });

    test("trims whitespace before hashing", () => {
      let color1 = getAvatarColor("  Monstera  ");
      let color2 = getAvatarColor("Monstera");
      expect(color1).toBe(color2);
    });

    test("returns default color for empty string", () => {
      let color = getAvatarColor("");
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });

    test("returns different colors for different names", () => {
      let color1 = getAvatarColor("Monstera");
      let color2 = getAvatarColor("Snake Plant");
      expect(color1).not.toBe(color2);
    });
  });
});
