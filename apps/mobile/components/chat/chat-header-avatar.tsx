import { useLingui } from "@lingui/react/macro";
import { useState } from "react";
import { Image, Text, View } from "react-native";

import { getAvatarColor } from "@/utils/avatar-helpers";

interface ChatHeaderAvatarProps {
  name: string;
  photoUri: string | null;
  size?: number;
}

export function ChatHeaderAvatar({ name, photoUri, size = 32 }: ChatHeaderAvatarProps) {
  let { t } = useLingui();
  let [imageLoaded, setImageLoaded] = useState(false);
  let [imageError, setImageError] = useState(false);

  let trimmed = name.trim();
  let firstLetter = trimmed.length > 0 ? trimmed.charAt(0).toUpperCase() : "";
  let backgroundColor = getAvatarColor(name);
  let showImage = photoUri && !imageError;

  return (
    <View
      testID="chat-header-avatar"
      accessibilityLabel={t`${name} avatar`}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor,
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <Text className="text-color font-semibold" style={{ fontSize: size * 0.5 }}>
        {firstLetter}
      </Text>
      {showImage ? (
        <Image
          source={{ uri: photoUri }}
          accessibilityLabel={t`Photo of ${name}`}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
          style={{
            width: size,
            height: size,
            position: "absolute",
            opacity: imageLoaded ? 1 : 0,
          }}
        />
      ) : null}
    </View>
  );
}
