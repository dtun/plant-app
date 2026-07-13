import { ChatsScreen } from "@/src/features/chats";
import { useRouter } from "expo-router";

export default function ChatsRoute() {
  let router = useRouter();
  return (
    <ChatsScreen
      onPlantPress={(plantId) => router.push(`/chat/${plantId}` as any)}
      onAddPlant={() => router.push("/")}
    />
  );
}
