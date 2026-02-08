import { Text, View } from "react-native";

interface DaySeparatorProps {
  label: string;
}

export function DaySeparator({ label }: DaySeparatorProps) {
  return (
    <View className="items-center py-3">
      <Text className="text-xs text-icon">{label}</Text>
    </View>
  );
}
