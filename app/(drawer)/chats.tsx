import { ChatListItem } from "@/components/chat-list-item";
import { plantsWithLastMessage$ } from "@/src/livestore/queries";
import { useQuery } from "@livestore/react";
import { useRouter } from "expo-router";
import { FlatList, Text, View } from "react-native";

export default function ChatsScreen() {
  let plants = useQuery(plantsWithLastMessage$);
  let router = useRouter();

  function handlePlantPress(plantId: string) {
    router.push(`/chat/${plantId}` as any);
  }

  if (plants.length === 0) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-8">
        <Text className="text-icon text-base text-center">Name a plant to start chatting!</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <FlatList
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
