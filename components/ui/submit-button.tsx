import { IconSymbol } from "@/components/ui/icon-symbol";
import { ReactNode } from "react";
import { ActivityIndicator, TouchableOpacity, View } from "react-native";

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
  size = 32,
  variant = "primary",
}: SubmitButtonProps) {
  let isDisabled = disabled || isLoading;

  return (
    <View className="flex-row items-center gap-2">
      <TouchableOpacity
        className={
          variant === "primary"
            ? "rounded-lg justify-center items-center bg-tint"
            : "rounded-lg justify-center items-center"
        }
        style={{
          width: size,
          height: size,
          opacity: isDisabled ? 0.7 : 1,
        }}
        onPress={onPress}
        disabled={isDisabled}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={isLoading ? "Loading" : "Submit"}
        accessibilityState={{ disabled: isDisabled }}
      >
        {isLoading ? (
          <View className="flex-row items-center gap-2">
            <ActivityIndicator size="small" color="#fff" />
          </View>
        ) : children ? (
          children
        ) : (
          <IconSymbol
            colorClassName={null}
            name={icon}
            size={16}
            color="#fff"
          />
        )}
      </TouchableOpacity>
    </View>
  );
}
