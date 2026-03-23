export function getInitials(name: string): string {
  let trimmed = name.trim();
  if (trimmed.length === 0) {
    return "";
  }

  let words = trimmed.split(/\s+/);
  return words.map((word) => word[0].toUpperCase()).join("");
}

let PASTEL_COLORS = [
  "#FFB3BA", // pastel pink
  "#FFDFBA", // pastel peach
  "#FFFFBA", // pastel yellow
  "#BAFFC9", // pastel green
  "#BAE1FF", // pastel blue
  "#D4BAFF", // pastel purple
  "#FFBAF2", // pastel magenta
  "#BAF2FF", // pastel cyan
  "#FFD4BA", // pastel orange
  "#C9FFBA", // pastel lime
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    let char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getAvatarColor(name: string): string {
  let trimmed = name.trim().toLowerCase();
  if (trimmed.length === 0) {
    return PASTEL_COLORS[0];
  }
  let index = hashString(trimmed) % PASTEL_COLORS.length;
  return PASTEL_COLORS[index];
}
