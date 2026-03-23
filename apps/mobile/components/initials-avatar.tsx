import { Text, View } from "react-native";
import { getInitials, getAvatarColor } from "@/utils/avatar-helpers";

interface InitialsAvatarProps {
  name: string;
  size?: number;
}

export function InitialsAvatar({ name, size = 48 }: InitialsAvatarProps) {
  let initials = getInitials(name);
  let backgroundColor = getAvatarColor(name);
  let fontSize = size * 0.4;

  return (
    <View
      testID="initials-avatar"
      accessibilityLabel={`${name} avatar`}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text className="text-color font-semibold" style={{ fontSize }}>
        {initials}
      </Text>
    </View>
  );
}
