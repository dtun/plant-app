import { tables } from "@/src/livestore/schema";
import { useQuery } from "@livestore/react";
import { queryDb } from "@livestore/livestore";
import { Stack, useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";

export default function ChatScreen() {
  let { plantId } = useLocalSearchParams<{ plantId: string }>();
  let plants = useQuery(queryDb(tables.plants.where({ id: plantId })));
  let plant = plants[0];

  return (
    <View className="flex-1 bg-background items-center justify-center px-8">
      <Stack.Screen options={{ title: plant?.name ?? "Chat", headerBackTitle: "Chats" }} />
      <Text className="text-icon text-base text-center">Chat coming soon!</Text>
    </View>
  );
}
