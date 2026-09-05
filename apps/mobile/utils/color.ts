import type { ColorValue } from "react-native";

/**
 * Re-express a resolved theme color with a different alpha, as an `rgba()` string.
 *
 * Accepts the shapes a resolved style color can take: `#rgb`, `#rgba`, `#rrggbb`,
 * `#rrggbbaa`, an `rgb()`/`rgba()` string, or a processed 0xAARRGGBB number. Returns
 * `null` for anything else (platform colors, named colors) so callers can skip
 * rendering rather than guess.
 */
export function withAlpha(color: ColorValue | number | undefined, alpha: number): string | null {
  let rgb = toRgb(color);
  if (!rgb) return null;
  let [r, g, b] = rgb;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function toRgb(color: ColorValue | number | undefined): [number, number, number] | null {
  if (typeof color === "number") {
    return [(color >> 16) & 255, (color >> 8) & 255, color & 255];
  }
  if (typeof color !== "string") return null;

  let hex = color.match(/^#([0-9a-f]{3,8})$/i)?.[1];
  if (hex) {
    if (hex.length === 3 || hex.length === 4) {
      hex = hex
        .split("")
        .map((c) => c + c)
        .join("");
    }
    if (hex.length !== 6 && hex.length !== 8) return null;
    return [
      parseInt(hex.slice(0, 2), 16),
      parseInt(hex.slice(2, 4), 16),
      parseInt(hex.slice(4, 6), 16),
    ];
  }

  let rgb = color.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (rgb) {
    return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];
  }

  return null;
}
