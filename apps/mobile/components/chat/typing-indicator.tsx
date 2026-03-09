import { Text, View } from "react-native";

export function TypingIndicator() {
  return (
    <View className="px-4 py-1 items-start">
      <View className="rounded-2xl px-4 py-3 bg-bubble-assistant">
        <Text className="text-base text-icon">•••</Text>
      </View>
    </View>
  );
}
