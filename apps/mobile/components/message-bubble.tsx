import * as Clipboard from "expo-clipboard";
import * as haptics from "@/utils/haptics";
import { Alert, Image, Text, View } from "react-native";
import * as ContextMenu from "zeego/context-menu";
import { useLingui } from "@lingui/react/macro";
import { useStore } from "@livestore/react";
import { events } from "@/src/livestore/schema";

export interface MessageBubbleProps {
  id: string;
  role: string;
  content: string;
  imageUri?: string | null;
}

export function MessageBubble({ id, role, content, imageUri }: MessageBubbleProps) {
  let isUser = role === "user";
  let { t } = useLingui();
  let { store } = useStore();

  function handleCopy() {
    Clipboard.setStringAsync(content);
    haptics.success();
  }

  function handleDelete() {
    Alert.alert(t`Delete Message`, t`Are you sure you want to delete this message?`, [
      { text: t`Cancel`, style: "cancel" },
      {
        text: t`Delete`,
        style: "destructive",
        onPress: () => {
          store.commit(events.messageDeleted({ id, deletedAt: Date.now() }));
          haptics.success();
        },
      },
    ]);
  }

  return (
    <View className={`px-4 py-1 ${isUser ? "items-end" : "items-start"}`}>
      <View className="max-w-[80%]">
        <ContextMenu.Root onOpenWillChange={(open) => open && haptics.selection()}>
          <ContextMenu.Trigger>
            <View
              className={`rounded-2xl overflow-hidden ${
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
          </ContextMenu.Trigger>
          <ContextMenu.Content>
            <ContextMenu.Item key="copy" onSelect={handleCopy}>
              <ContextMenu.ItemTitle>{t`Copy`}</ContextMenu.ItemTitle>
              <ContextMenu.ItemIcon ios={{ name: "doc.on.doc" }} />
            </ContextMenu.Item>
            <ContextMenu.Item key="delete" onSelect={handleDelete} destructive>
              <ContextMenu.ItemTitle>{t`Delete`}</ContextMenu.ItemTitle>
              <ContextMenu.ItemIcon ios={{ name: "trash" }} />
            </ContextMenu.Item>
          </ContextMenu.Content>
        </ContextMenu.Root>
      </View>
    </View>
  );
}
