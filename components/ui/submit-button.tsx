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
    <View style={styles.container}>
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
          <IconSymbol name={icon} size={20} color="#fff" />
        )}
      </TouchableOpacity>
    </View>
  );
}

let styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  button: {
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
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
