import { Text, View } from "react-native";

type InlineNode =
  | { type: "text"; value: string }
  | { type: "bold"; children: InlineNode[] }
  | { type: "italic"; children: InlineNode[] }
  | { type: "code"; value: string }
  | { type: "link"; href: string; children: InlineNode[] };

type Block =
  | { type: "paragraph"; inline: InlineNode[] }
  | { type: "heading"; level: 1 | 2 | 3; inline: InlineNode[] }
  | { type: "list"; ordered: boolean; items: InlineNode[][] }
  | { type: "quote"; inline: InlineNode[] };

let inlinePattern =
  /\*\*([\s\S]+?)\*\*|__([\s\S]+?)__|\*([^*\n]+?)\*|(?<![A-Za-z0-9])_([^_\n]+?)_(?![A-Za-z0-9])|`([^`\n]+?)`|\[([^\]]+)\]\(([^)\s]+)\)/g;

export function parseInline(text: string): InlineNode[] {
  let nodes: InlineNode[] = [];
  let lastIndex = 0;
  let regex = new RegExp(inlinePattern.source, "g");
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push({ type: "text", value: text.slice(lastIndex, match.index) });
    }
    if (match[1] !== undefined) {
      nodes.push({ type: "bold", children: parseInline(match[1]) });
    } else if (match[2] !== undefined) {
      nodes.push({ type: "bold", children: parseInline(match[2]) });
    } else if (match[3] !== undefined) {
      nodes.push({ type: "italic", children: parseInline(match[3]) });
    } else if (match[4] !== undefined) {
      nodes.push({ type: "italic", children: parseInline(match[4]) });
    } else if (match[5] !== undefined) {
      nodes.push({ type: "code", value: match[5] });
    } else if (match[6] !== undefined && match[7] !== undefined) {
      nodes.push({ type: "link", href: match[7], children: parseInline(match[6]) });
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    nodes.push({ type: "text", value: text.slice(lastIndex) });
  }
  return nodes;
}

let headingRegex = /^(#{1,3})\s+(.*)$/;
let bulletRegex = /^\s*[-*]\s+(.*)$/;
let numberedRegex = /^\s*\d+\.\s+(.*)$/;
let quoteRegex = /^>\s?(.*)$/;

export function parseBlocks(text: string): Block[] {
  let lines = text.replace(/\r\n/g, "\n").split("\n");
  let blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    let line = lines[i];

    if (line.trim() === "") {
      i++;
      continue;
    }

    let headingMatch = line.match(headingRegex);
    if (headingMatch) {
      let level = Math.min(headingMatch[1].length, 3) as 1 | 2 | 3;
      blocks.push({ type: "heading", level, inline: parseInline(headingMatch[2]) });
      i++;
      continue;
    }

    if (bulletRegex.test(line)) {
      let items: InlineNode[][] = [];
      while (i < lines.length && bulletRegex.test(lines[i])) {
        items.push(parseInline(lines[i].match(bulletRegex)![1]));
        i++;
      }
      blocks.push({ type: "list", ordered: false, items });
      continue;
    }

    if (numberedRegex.test(line)) {
      let items: InlineNode[][] = [];
      while (i < lines.length && numberedRegex.test(lines[i])) {
        items.push(parseInline(lines[i].match(numberedRegex)![1]));
        i++;
      }
      blocks.push({ type: "list", ordered: true, items });
      continue;
    }

    if (quoteRegex.test(line)) {
      let quoteLines: string[] = [];
      while (i < lines.length && quoteRegex.test(lines[i])) {
        quoteLines.push(lines[i].match(quoteRegex)![1]);
        i++;
      }
      blocks.push({ type: "quote", inline: parseInline(quoteLines.join(" ")) });
      continue;
    }

    let paragraphLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !headingRegex.test(lines[i]) &&
      !bulletRegex.test(lines[i]) &&
      !numberedRegex.test(lines[i]) &&
      !quoteRegex.test(lines[i])
    ) {
      paragraphLines.push(lines[i]);
      i++;
    }
    blocks.push({ type: "paragraph", inline: parseInline(paragraphLines.join(" ")) });
  }

  return blocks;
}

function InlineSpan({ nodes }: { nodes: InlineNode[] }) {
  return (
    <>
      {nodes.map((node, i) => {
        if (node.type === "text") return <Text key={i}>{node.value}</Text>;
        if (node.type === "bold") {
          return (
            <Text key={i} className="font-bold">
              <InlineSpan nodes={node.children} />
            </Text>
          );
        }
        if (node.type === "italic") {
          return (
            <Text key={i} className="italic">
              <InlineSpan nodes={node.children} />
            </Text>
          );
        }
        if (node.type === "code") {
          return (
            <Text key={i} className="font-mono text-[0.95em]">
              {node.value}
            </Text>
          );
        }
        if (node.type === "link") {
          return (
            <Text key={i} className="underline">
              <InlineSpan nodes={node.children} />
            </Text>
          );
        }
        return null;
      })}
    </>
  );
}

interface MarkdownProps {
  content: string;
  textClassName?: string;
}

export function Markdown({ content, textClassName = "text-base text-color" }: MarkdownProps) {
  let blocks = parseBlocks(content);

  return (
    <View className="px-4 py-2.5">
      {blocks.map((block, i) => {
        let spacing = i > 0 ? "mt-2" : "";

        if (block.type === "heading") {
          let sizeClass =
            block.level === 1 ? "text-xl" : block.level === 2 ? "text-lg" : "text-base";
          let headingSpacing = i > 0 ? "mt-3" : "";
          return (
            <Text
              key={i}
              className={`${sizeClass} font-bold ${textClassName} ${headingSpacing}`.trim()}
            >
              <InlineSpan nodes={block.inline} />
            </Text>
          );
        }

        if (block.type === "list") {
          return (
            <View key={i} className={spacing}>
              {block.items.map((item, j) => (
                <View key={j} className="flex-row">
                  <Text className={`${textClassName} w-6`}>
                    {block.ordered ? `${j + 1}.` : "•"}
                  </Text>
                  <Text className={`${textClassName} flex-1`}>
                    <InlineSpan nodes={item} />
                  </Text>
                </View>
              ))}
            </View>
          );
        }

        if (block.type === "quote") {
          return (
            <View key={i} className={`border-l-2 border-icon pl-3 ${spacing}`.trim()}>
              <Text className={`${textClassName} italic`}>
                <InlineSpan nodes={block.inline} />
              </Text>
            </View>
          );
        }

        return (
          <Text key={i} className={`${textClassName} ${spacing}`.trim()}>
            <InlineSpan nodes={block.inline} />
          </Text>
        );
      })}
    </View>
  );
}
