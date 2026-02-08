import { plantById$, type Plant } from "@/src/livestore/queries";
import { events } from "@/src/livestore/schema";
import { useQuery, useStore } from "@livestore/react";
import { useLocalSearchParams } from "expo-router";
import { createContext, useContext, useCallback } from "react";
import { Alert } from "react-native";

interface ChatContextValue {
  plantId: string;
  store: ReturnType<typeof useStore>["store"];
  plant: Plant | undefined;
  handleClearChat: () => void;
}

let ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  let { plantId } = useLocalSearchParams<{ plantId: string }>();
  let { store } = useStore();
  let plants = useQuery(plantById$(plantId));
  let plant = plants[0];

  let handleClearChat = useCallback(() => {
    Alert.alert(
      "Clear Chat",
      `Are you sure you want to clear all messages with ${plant?.name ?? "this plant"}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: () => {
            store.commit(
              events.chatCleared({
                plantId,
                deletedAt: Date.now(),
              })
            );
          },
        },
      ]
    );
  }, [plant?.name, plantId, store]);

  return (
    <ChatContext.Provider value={{ plantId, store, plant, handleClearChat }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext(): ChatContextValue {
  let context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChatContext must be used within a ChatProvider");
  }
  return context;
}
