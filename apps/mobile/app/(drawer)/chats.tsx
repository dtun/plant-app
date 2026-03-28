import { ChatListItem } from "@/components/chat-list-item";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { plantsWithLastMessage$ } from "@/src/livestore/queries";
import { events } from "@/src/livestore/schema";
import { Trans, useLingui } from "@lingui/react/macro";
import { FlashList } from "@shopify/flash-list";
import { useQuery, useStore } from "@livestore/react";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";

export default function ChatsScreen() {
  let { t } = useLingui();
  let plants = useQuery(plantsWithLastMessage$);
  let { store } = useStore();
  let router = useRouter();

  function handlePlantPress(plantId: string) {
    router.push(`/chat/${plantId}` as any);
  }

  function handleDeletePlant(plantId: string) {
    let plant = plants.find((p) => p.id === plantId);
    let name = plant?.name ?? t`this plant`;
    Alert.alert(
      t`Delete Plant`,
      t`Are you sure you want to delete ${name}? This will also delete all chat messages.`,
      [
        { text: t`Cancel`, style: "cancel" },
        {
          text: t`Delete`,
          style: "destructive",
          onPress: () => {
            store.commit(events.plantDeleted({ id: plantId, deletedAt: Date.now() }));
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
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
          accessibilityLabel={t`Name a plant to start chatting`}
          accessibilityHint={t`Navigates to the plant naming screen`}
        >
          <Text className="text-icon text-base">
            <Trans>Name a plant to start chatting!</Trans>
          </Text>
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
            onDelete={handleDeletePlant}
          />
        )}
      />
    </View>
  );
}
