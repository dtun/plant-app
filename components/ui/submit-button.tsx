import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useThemeColor } from "@/hooks/use-theme-color";
import { ReactNode } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

interface SubmitButtonProps {
  children?: ReactNode;
  disabled?: boolean;
  icon?: React.ComponentProps<typeof IconSymbol>["name"];
  isLoading?: boolean;
  onPress: () => void;
  size?: number;
  variant?: "primary" | "secondary";
}

export function SubmitButton({
  children,
  disabled = false,
  icon = "arrow.up",
  isLoading = false,
  onPress,
  size = 48,
  variant = "primary",
}: SubmitButtonProps) {
  let tintColor = useThemeColor({}, "tint");
  let backgroundColor = variant === "primary" ? tintColor : "transparent";
  let isDisabled = disabled || isLoading;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor,
          width: size,
          height: size,
        },
        isDisabled && styles.buttonDisabled,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={isLoading ? "Loading" : "Submit"}
      accessibilityState={{ disabled: isDisabled }}
    >
      {isLoading ? (
        <View style={styles.buttonContent}>
          <ActivityIndicator size="small" color="#fff" />
        </View>
      ) : children ? (
        children
      ) : (
        <ThemedText style={styles.buttonText}>
          <IconSymbol name={icon} size={24} color="#fff" />
        </ThemedText>
      )}
    </TouchableOpacity>
  );
}

let styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});
