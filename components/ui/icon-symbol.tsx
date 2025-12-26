// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolViewProps, SymbolWeight } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";
import { useResolveClassNames } from "uniwind";

type IconMapping = Record<SymbolViewProps["name"], ComponentProps<typeof MaterialIcons>["name"]>;

type IconSymbolName = keyof typeof mapping;
type ThemeColorClassName = "text-color" | "text-tint" | "text-icon" | null;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
let mapping: Partial<IconMapping> = {
  "house.fill": "home",
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  "camera.fill": "photo-camera",
  trash: "delete",
};

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  colorClassName = "text-color",
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color?: string | OpaqueColorValue;
  colorClassName?: ThemeColorClassName;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  let { color: resolvedColor } = useResolveClassNames(colorClassName || "");
  let iconColor = colorClassName ? resolvedColor?.toString() : color;

  return <MaterialIcons color={iconColor} size={size} name={mapping[name]} style={style} />;
}
