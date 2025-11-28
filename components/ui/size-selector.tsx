import { ThemedText } from "@/components/themed-text";
import { TouchableOpacity, View } from "react-native";

interface SizeSelectorProps<T extends string> {
  label?: string;
  onChange: (value: T) => void;
  options: readonly T[];
  value?: T;
}

export function SizeSelector<T extends string>({
  label,
  onChange,
  options,
  value,
}: SizeSelectorProps<T>) {
  return (
    <View className="flex-row gap-2">
      {options.map((option) => (
        <TouchableOpacity
          key={option}
          className={
            value === option
              ? "flex-1 p-1 items-center border-1 border-color rounded-xl"
              : "flex-1 p-1 items-center border border-icon rounded-xl"
          }
          onPress={() => onChange(option)}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={`Select ${option.toLowerCase()}`}
          accessibilityState={{ selected: value === option }}
        >
          <ThemedText
            className={
              value === option ? "text-base font-semibold" : "text-base"
            }
          >
            {option}
          </ThemedText>
        </TouchableOpacity>
      ))}
    </View>
  );
}
