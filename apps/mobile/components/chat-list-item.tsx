import { msg } from "@lingui/core/macro";
import { i18n } from "@/src/i18n";
import * as haptics from "@/utils/haptics";
import { useLingui } from "@lingui/react/macro";
import { useEffect, useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import * as ContextMenu from "zeego/context-menu";
import { InitialsAvatar } from "./initials-avatar";

interface ChatListItemProps {
  id: string;
  name: string;
  photoUri: string | null;
  lastMessageContent: string | null;
  lastMessageCreatedAt: number | null;
  onPress: (plantId: string) => void;
  onDelete: (plantId: string) => void;
}

function formatTimestamp(timestamp: number): string {
  let now = new Date();
  let date = new Date(timestamp);
  let diffMs = now.getTime() - date.getTime();
  let diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }
  if (diffDays === 1) {
    return i18n._(msg`Yesterday`);
  }
  if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: "short" });
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function ChatListItem({
  id,
  name,
  photoUri,
  lastMessageContent,
  lastMessageCreatedAt,
  onPress,
  onDelete,
}: ChatListItemProps) {
  let { t } = useLingui();
  let [imageLoaded, setImageLoaded] = useState(false);
  let [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
  }, [photoUri]);

  return (
    <ContextMenu.Root onOpenWillChange={(open) => open && haptics.selection()}>
      <ContextMenu.Trigger>
        <Pressable
          onPress={() => onPress(id)}
          className="flex-row items-center px-4 py-3 border-b border-icon"
          accessibilityRole="button"
          accessibilityLabel={t`Chat with ${name}`}
          accessibilityHint={t`Opens chat conversation with this plant`}
        >
          <View className="w-12 h-12 rounded-full bg-background overflow-hidden mr-3 border border-icon items-center justify-center">
            <InitialsAvatar name={name} size={48} />
            {photoUri && !imageError ? (
              <Image
                source={{ uri: photoUri }}
                className="w-12 h-12 absolute"
                accessibilityLabel={t`Photo of ${name}`}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
                style={{ opacity: imageLoaded ? 1 : 0 }}
              />
            ) : null}
          </View>

          <View className="flex-1 mr-2">
            <Text className="text-color text-base font-semibold" numberOfLines={1}>
              {name}
            </Text>
            <Text className="text-icon text-sm mt-0.5" numberOfLines={1}>
              {lastMessageContent ?? t`No messages yet`}
            </Text>
          </View>

          {lastMessageCreatedAt ? (
            <Text className="text-icon text-xs">{formatTimestamp(lastMessageCreatedAt)}</Text>
          ) : null}
        </Pressable>
      </ContextMenu.Trigger>
      <ContextMenu.Content>
        <ContextMenu.Item key="delete" onSelect={() => onDelete(id)} destructive>
          <ContextMenu.ItemTitle>{t`Delete`}</ContextMenu.ItemTitle>
          <ContextMenu.ItemIcon ios={{ name: "trash" }} />
        </ContextMenu.Item>
      </ContextMenu.Content>
    </ContextMenu.Root>
  );
}
