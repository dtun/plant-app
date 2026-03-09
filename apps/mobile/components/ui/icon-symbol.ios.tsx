import { SymbolView, SymbolViewProps, SymbolWeight } from "expo-symbols";
import { StyleProp, ViewStyle } from "react-native";
import { useResolveClassNames } from "uniwind";

type ThemeColorClassName = "text-color" | "text-tint" | "text-icon";

export function IconSymbol({
  name,
  size = 24,
  color,
  colorClassName = "text-color",
  style,
  weight = "regular",
}: {
  name: SymbolViewProps["name"];
  size?: number;
  color?: string;
  colorClassName?: ThemeColorClassName;
  style?: StyleProp<ViewStyle>;
  weight?: SymbolWeight;
}) {
  let { color: resolvedColor } = useResolveClassNames(colorClassName || "");
  let iconColor = colorClassName ? resolvedColor?.toString() : color;

  return (
    <SymbolView
      weight={weight}
      tintColor={iconColor}
      resizeMode="scaleAspectFit"
      name={name}
      style={[
        {
          width: size,
          height: size,
        },
        style,
      ]}
    />
  );
}
