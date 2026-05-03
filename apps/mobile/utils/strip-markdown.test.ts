import { stripMarkdown } from "./strip-markdown";

describe("utils/strip-markdown", () => {
  test("removes bold markers", () => {
    expect(stripMarkdown("So **Eve** is here")).toBe("So Eve is here");
    expect(stripMarkdown("__bold__ text")).toBe("bold text");
  });

  test("removes italic markers", () => {
    expect(stripMarkdown("an *emphasis* word")).toBe("an emphasis word");
    expect(stripMarkdown("an _emphasis_ word")).toBe("an emphasis word");
  });

  test("removes heading hashes at line start", () => {
    expect(stripMarkdown("# Oh Eva, this makes my heart so happy")).toBe(
      "Oh Eva, this makes my heart so happy"
    );
    expect(stripMarkdown("### Smaller heading")).toBe("Smaller heading");
  });

  test("removes inline code backticks", () => {
    expect(stripMarkdown("use `npm install` first")).toBe("use npm install first");
  });

  test("removes fenced code blocks", () => {
    expect(stripMarkdown("before\n```\ncode\n```\nafter")).toBe("before after");
  });

  test("converts links to their label", () => {
    expect(stripMarkdown("see [the docs](https://example.com)")).toBe("see the docs");
  });

  test("converts images to their alt text", () => {
    expect(stripMarkdown("![a leaf](leaf.png) here")).toBe("a leaf here");
  });

  test("removes blockquote markers", () => {
    expect(stripMarkdown("> a quote")).toBe("a quote");
  });

  test("removes list markers", () => {
    expect(stripMarkdown("- one\n- two\n- three")).toBe("one two three");
    expect(stripMarkdown("1. first\n2. second")).toBe("first second");
  });

  test("removes strikethrough", () => {
    expect(stripMarkdown("~~old~~ new")).toBe("old new");
  });

  test("collapses whitespace and trims", () => {
    expect(stripMarkdown("  hello   world  ")).toBe("hello world");
    expect(stripMarkdown("line one\n\nline two")).toBe("line one line two");
  });

  test("preserves emoji", () => {
    expect(stripMarkdown("Oh Lizzie, that's so cool! 🦎 So **Eve** is here")).toBe(
      "Oh Lizzie, that's so cool! 🦎 So Eve is here"
    );
  });

  test("returns empty string for empty input", () => {
    expect(stripMarkdown("")).toBe("");
  });

  test("leaves plain text untouched apart from whitespace", () => {
    expect(stripMarkdown("Just a normal sentence.")).toBe("Just a normal sentence.");
  });
});
