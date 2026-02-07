import { ChatListItem } from "@/components/chat-list-item";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { plantsWithLastMessage$ } from "@/src/livestore/queries";
import { FlashList } from "@shopify/flash-list";
import { useQuery } from "@livestore/react";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";

export default function ChatsScreen() {
  let plants = useQuery(plantsWithLastMessage$);
  let router = useRouter();

  function handlePlantPress(plantId: string) {
    router.push(`/chat/${plantId}` as any);
  }

  let hopOffset = useSharedValue(0);

  useEffect(() => {
    hopOffset.value = withRepeat(
      withSequence(
        withTiming(-2.4, { duration: 240, easing: Easing.out(Easing.ease) }),
        withTiming(0, { duration: 240, easing: Easing.in(Easing.ease) })
      ),
      -1
    );
  }, [hopOffset]);

  let hopStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: hopOffset.value }],
  }));

  if (plants.length === 0) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-8">
        <TouchableOpacity
          className="flex-row items-center gap-4"
          onPress={() => router.push("/")}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Name a plant to start chatting"
          accessibilityHint="Navigates to the plant naming screen"
        >
          <Text className="text-icon text-base">Name a plant to start chatting!</Text>
          <View className="rounded-full bg-tint justify-center items-center w-8 h-8">
            <Animated.View style={hopStyle}>
              <IconSymbol colorClassName={null} name="arrow.up.right" size={16} color="#fff" />
            </Animated.View>
          </View>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <FlashList
        data={plants}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ChatListItem
            id={item.id}
            name={item.name}
            photoUri={item.photoUri}
            lastMessageContent={item.lastMessageContent}
            lastMessageCreatedAt={item.lastMessageCreatedAt}
            onPress={handlePlantPress}
          />
        )}
      />
    </View>
  );
}
