import { View } from "react-native";

function Root({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function Trigger({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function Content({ children }: { children: React.ReactNode }) {
  return <View testID="context-menu-content">{children}</View>;
}

function Item({
  children,
  onSelect,
  destructive,
}: {
  children: React.ReactNode;
  onSelect?: () => void;
  destructive?: boolean;
}) {
  return (
    <View
      testID="context-menu-item"
      onTouchEnd={onSelect}
      accessibilityState={{ selected: destructive }}
    >
      {children}
    </View>
  );
}

function ItemTitle({ children }: { children: React.ReactNode }) {
  let { Text } = require("react-native");
  return <Text>{children}</Text>;
}

function ItemIcon() {
  return null;
}

export { Root, Trigger, Content, Item, ItemTitle, ItemIcon };
