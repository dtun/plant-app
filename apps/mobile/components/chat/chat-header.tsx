import { ChatHeaderMenu } from "@/components/chat/chat-header-menu";
import { useChatContext } from "@/contexts/chat-context";
import { useLingui } from "@lingui/react/macro";
import { Stack } from "expo-router";
import { Image, View } from "react-native";

/**
 * Configures the native stack header for the open chat. Transparent so the
 * conversation scrolls underneath it; `MessageList` pads for its height.
 */
export function ChatHeader() {
  let { t } = useLingui();
  let { plant, handleClearChat } = useChatContext();

  return (
    <Stack.Screen
      options={{
        title: plant?.name ?? t`Chat`,
        headerBackTitle: t`Chats`,
        headerTransparent: true,
        headerRight: () => (
          <>
            {plant?.photoUri ? (
              <View className="w-8 h-8 rounded-full overflow-hidden">
                <Image
                  source={{ uri: plant.photoUri! }}
                  className="w-8 h-8"
                  accessibilityLabel={t`Photo of ${plant.name}`}
                />
              </View>
            ) : null}
            <ChatHeaderMenu onClearChat={handleClearChat} />
          </>
        ),
      }}
    />
  );
}
