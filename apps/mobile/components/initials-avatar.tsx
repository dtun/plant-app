import { Text, View } from "react-native";
import { getInitials, getAvatarColor } from "@/utils/avatar-helpers";

interface InitialsAvatarProps {
  name: string;
  size?: number;
  /** Which AI provider named this plant, shown as a small badge. */
  namedBy?: "openai" | "anthropic";
}

const MAX_INITIALS = 2;

export function InitialsAvatar({ name, size = 48, namedBy }: InitialsAvatarProps) {
  let initials = getInitials(name).slice(0, MAX_INITIALS - 1);
  let backgroundColor = getAvatarColor(name);
  let fontSize = size * 0.4;

  const labelParts = [name];
  if (namedBy) {
    labelParts.push(namedBy);
  }

  return (
    <View
      accessibilityLabel={`${labelParts.join(" ")} avatar`}
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
        {initials.length > 0 ? initials : "Unnamed plant"}
      </Text>
    </View>
  );
}
