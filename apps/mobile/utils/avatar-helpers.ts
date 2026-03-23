export function getInitials(name: string): string {
  let trimmed = name.trim();
  if (trimmed.length === 0) {
    return "";
  }

  let words = trimmed.split(/\s+/);
  return words.map((word) => word[0].toUpperCase()).join("");
}
