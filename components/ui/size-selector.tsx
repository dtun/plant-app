import { ThemedText } from "@/components/themed-text";
import { useThemeColor } from "@/hooks/use-theme-color";
import { StyleSheet, TouchableOpacity, View } from "react-native";

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
  let borderColor = useThemeColor({ light: "#ccc", dark: "#555" }, "icon");
  let textColor = useThemeColor({}, "text");

  return (
    <View style={styles.container}>
      {options.map((option) => (
        <TouchableOpacity
          key={option}
          style={[
            styles.option,
            { borderColor },
            value === option && [
              styles.optionSelected,
              { borderColor: textColor },
            ],
          ]}
          onPress={() => onChange(option)}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={`Select ${option.toLowerCase()}`}
          accessibilityState={{ selected: value === option }}
        >
          <ThemedText
            style={[
              styles.optionText,
              value === option && styles.optionTextSelected,
            ]}
          >
            {option}
          </ThemedText>
        </TouchableOpacity>
      ))}
    </View>
  );
}

let styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 8,
  },
  option: {
    flex: 1,
    padding: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "transparent",
    borderRadius: 12,
  },
  optionSelected: {
    borderWidth: 1,
  },
  optionText: {
    fontSize: 16,
  },
  optionTextSelected: {
    fontWeight: "600",
  },
});
