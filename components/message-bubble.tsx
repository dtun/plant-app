import { Image, Text, View } from "react-native";

export interface MessageBubbleProps {
  role: string;
  content: string;
  imageUri?: string | null;
}

export function MessageBubble({ role, content, imageUri }: MessageBubbleProps) {
  let isUser = role === "user";

  return (
    <View className={`px-4 py-1 ${isUser ? "items-end" : "items-start"}`}>
      <View
        className={`rounded-2xl max-w-[80%] overflow-hidden ${
          isUser ? "bg-bubble-user" : "bg-bubble-assistant"
        }`}
      >
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            className="w-56 h-56"
            accessibilityLabel="Photo sent in chat"
            resizeMode="cover"
          />
        ) : null}
        {content ? (
          <Text className={`text-base px-4 py-2.5 ${isUser ? "text-white" : "text-color"}`}>
            {content}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
