import { Text, TouchableOpacity, View } from "react-native";

interface OptionSelectorProps<T extends string> {
  label?: string;
  onChange: (value: T) => void;
  options: readonly T[];
  value?: T;
}

export function OptionSelector<T extends string>({
  label,
  onChange,
  options,
  value,
}: OptionSelectorProps<T>) {
  return (
    <View className="flex-row gap-3">
      {options.map((option) => (
        <TouchableOpacity
          key={option}
          className={
            value === option
              ? "flex-1 border rounded-xl p-3 items-center bg-tint border-tint"
              : "flex-1 border border-icon rounded-xl p-3 items-center"
          }
          onPress={() => onChange(option)}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={`Select ${option}`}
          accessibilityState={{ selected: value === option }}
        >
          <Text
            className={
              value === option
                ? "text-base font-semibold text-white"
                : "text-base text-color"
            }
          >
            {option}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
