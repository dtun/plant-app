import { render, screen } from "@testing-library/react-native";
import { Markdown, parseInline, parseBlocks } from "./markdown";

describe("parseInline", () => {
  test("parses plain text", () => {
    expect(parseInline("hello world")).toEqual([{ type: "text", value: "hello world" }]);
  });

  test("parses bold with **", () => {
    expect(parseInline("a **bold** b")).toEqual([
      { type: "text", value: "a " },
      { type: "bold", children: [{ type: "text", value: "bold" }] },
      { type: "text", value: " b" },
    ]);
  });

  test("parses bold with __", () => {
    expect(parseInline("a __bold__ b")).toEqual([
      { type: "text", value: "a " },
      { type: "bold", children: [{ type: "text", value: "bold" }] },
      { type: "text", value: " b" },
    ]);
  });

  test("parses italic with single *", () => {
    expect(parseInline("a *it* b")).toEqual([
      { type: "text", value: "a " },
      { type: "italic", children: [{ type: "text", value: "it" }] },
      { type: "text", value: " b" },
    ]);
  });

  test("parses inline code", () => {
    expect(parseInline("use `npm install`")).toEqual([
      { type: "text", value: "use " },
      { type: "code", value: "npm install" },
    ]);
  });

  test("does not treat snake_case as italic", () => {
    expect(parseInline("foo_bar_baz")).toEqual([{ type: "text", value: "foo_bar_baz" }]);
  });

  test("parses link", () => {
    expect(parseInline("see [docs](https://example.com)")).toEqual([
      { type: "text", value: "see " },
      {
        type: "link",
        href: "https://example.com",
        children: [{ type: "text", value: "docs" }],
      },
    ]);
  });

  test("parses bold and italic siblings", () => {
    expect(parseInline("**bold** and *italic*")).toEqual([
      { type: "bold", children: [{ type: "text", value: "bold" }] },
      { type: "text", value: " and " },
      { type: "italic", children: [{ type: "text", value: "italic" }] },
    ]);
  });
});

describe("parseBlocks", () => {
  test("parses paragraphs separated by blank lines", () => {
    let blocks = parseBlocks("first paragraph\n\nsecond paragraph");
    expect(blocks).toHaveLength(2);
    expect(blocks[0].type).toBe("paragraph");
    expect(blocks[1].type).toBe("paragraph");
  });

  test("parses headings", () => {
    let blocks = parseBlocks("# Heading 1\n## Heading 2\n### Heading 3");
    expect(blocks).toHaveLength(3);
    expect(blocks[0]).toMatchObject({ type: "heading", level: 1 });
    expect(blocks[1]).toMatchObject({ type: "heading", level: 2 });
    expect(blocks[2]).toMatchObject({ type: "heading", level: 3 });
  });

  test("parses bullet list", () => {
    let blocks = parseBlocks("- one\n- two\n- three");
    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toMatchObject({ type: "list", ordered: false, items: expect.any(Array) });
    expect((blocks[0] as { items: unknown[] }).items).toHaveLength(3);
  });

  test("parses numbered list", () => {
    let blocks = parseBlocks("1. one\n2. two");
    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toMatchObject({ type: "list", ordered: true });
  });

  test("parses blockquote", () => {
    let blocks = parseBlocks("> a wise quote");
    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe("quote");
  });
});

describe("Markdown rendering", () => {
  test("renders plain text", () => {
    render(<Markdown content="Hello world" />);
    expect(screen.getByText("Hello world")).toBeOnTheScreen();
  });

  test("renders bold text content", () => {
    render(<Markdown content="I belong to the **Asphodelaceae family**!" />);
    expect(screen.getByText("Asphodelaceae family")).toBeOnTheScreen();
  });

  test("renders italic text content", () => {
    render(<Markdown content="most likely *Aloe vera*" />);
    expect(screen.getByText("Aloe vera")).toBeOnTheScreen();
  });

  test("renders bullet list with markers", () => {
    render(<Markdown content={"- first\n- second"} />);
    expect(screen.getByText("first")).toBeOnTheScreen();
    expect(screen.getByText("second")).toBeOnTheScreen();
    expect(screen.getAllByText("•")).toHaveLength(2);
  });

  test("renders numbered list with markers", () => {
    render(<Markdown content={"1. one\n2. two"} />);
    expect(screen.getByText("1.")).toBeOnTheScreen();
    expect(screen.getByText("2.")).toBeOnTheScreen();
  });

  test("renders headings", () => {
    render(<Markdown content="# Big heading" />);
    expect(screen.getByText("Big heading")).toBeOnTheScreen();
  });
});
